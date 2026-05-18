import pandas as pd
from django.db import transaction
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import EvaluationTemplate, TemplateDimension, TemplateQuestion

class TemplateUploadView(APIView):
    def post(self, request):
        file = request.FILES.get('files')
        name = request.data.get('batch_name') or request.data.get('name')

        if not file:
            return Response({'ok': False, 'message': 'No se recibio ningun archivo.'}, status=status.HTTP_400_BAD_REQUEST)
        
        if not name:
            return Response({'ok': False, 'message': 'El nombre de la plantilla es obligatorio.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df_raw = pd.read_excel(file, header=None)
            
            def normalize_str(s):
                import unicodedata
                s = str(s).lower().strip()
                return "".join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')

            header_row = None
            for i, row in df_raw.iterrows():
                row_values = [normalize_str(v) for v in row.values]
                has_dim = any(k in row_values for k in ['dimension', 'apartado', 'seccion', 'categoria', 'criterio', 'aspecto', 'ambito'])
                has_ques = any(k in row_values for k in ['pregunta', 'enunciado', 'item', 'indicador', 'descripcion'])
                if has_dim and has_ques:
                    header_row = i
                    break
            
            if header_row is None:
                return Response({
                    'ok': False, 
                    'message': 'No se encontro el encabezado. Asegurese de que el archivo tenga columnas con nombres como "Dimension" y "Pregunta".'
                }, status=status.HTTP_400_BAD_REQUEST)

            df = df_raw.iloc[header_row:].copy()
            df.columns = [normalize_str(c) for c in df.iloc[0]]
            df = df.iloc[1:].reset_index(drop=True)
            
            df = df.dropna(how='all')
            df = df.ffill(axis=0)

            col_dim = next((c for c in df.columns if any(k in c for k in ['dimension', 'apartado', 'seccion', 'categoria', 'criterio', 'aspecto', 'ambito'])), None)
            col_ques = next((c for c in df.columns if any(k in c for k in ['pregunta', 'enunciado', 'item', 'indicador', 'descripcion'])), None)
            col_type = next((c for c in df.columns if any(k in c for k in ['tipo', 'type'])), None)
            col_weight = next((c for c in df.columns if any(k in c for k in ['peso', 'valor', 'weight', 'porcentaje', 'puntuacion'])), None)

            if not col_dim or not col_ques:
                return Response({
                    'ok': False, 
                    'message': 'No se pudieron identificar las columnas requeridas (Dimension, Pregunta).'
                }, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                template = EvaluationTemplate.objects.create(name=name)
                
                dim_total_weights = {}
                dim_questions_data = {} 
                
                for _, row in df.iterrows():
                    dim_name = str(row[col_dim]).strip()
                    if not dim_name or dim_name.lower() == 'nan':
                        continue
                        
                    row_weight = 0.0
                    for val in reversed(row.values):
                        try:
                            if pd.notna(val):
                                clean_val = str(val).replace('%', '').replace(',', '.').strip()
                                row_weight = float(clean_val)
                                break
                        except:
                            continue
                    
                    if dim_name not in dim_total_weights:
                        dim_total_weights[dim_name] = 0.0
                        dim_questions_data[dim_name] = []
                    
                    dim_total_weights[dim_name] += row_weight
                    
                    question_text = str(row[col_ques]).strip()
                    q_type = str(row[col_type]).strip().lower() if col_type and pd.notna(row[col_type]) else 'likert'
                    
                    if question_text and question_text.lower() != 'nan':
                        dim_questions_data[dim_name].append({
                            'text': question_text,
                            'type': q_type
                        })

                for dim_name, total_weight in dim_total_weights.items():
                    dimension = TemplateDimension.objects.create(
                        template=template,
                        name=dim_name,
                        weight=total_weight
                    )
                    
                    seen_questions = set()
                    for q_info in dim_questions_data[dim_name]:
                        if q_info['text'] not in seen_questions:
                            TemplateQuestion.objects.create(
                                dimension=dimension,
                                text=q_info['text'],
                                question_type=q_info['type']
                            )
                            seen_questions.add(q_info['text'])

            return Response({
                'ok': True,
                'message': f'Plantilla "{name}" cargada exitosamente.',
                'template_id': template.template_id
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'ok': False, 'message': f'Error al procesar el archivo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TemplateListView(APIView):
    def get(self, request):
        templates = EvaluationTemplate.objects.all()
        data = []
        for t in templates:
            data.append({
                'template_id': t.template_id,
                'name': t.name,
                'created_at': t.created_at,
                'total_dimensions': t.dimensions.count(),
                'total_questions': TemplateQuestion.objects.filter(dimension__template=t).count()
            })
        return Response({'ok': True, 'results': data})

from django.shortcuts import get_object_or_404
from apps.academic_career.models import Teacher, Course
from apps.academic_workload.models import Section, Period
from .models import EvaluationTemplate, TemplateDimension, TemplateQuestion, TeacherEvaluation, EvaluationAnswer

class TemplateDetailView(APIView):
    def get(self, request, pk):
        template = get_object_or_404(
            EvaluationTemplate.objects.prefetch_related('dimensions__questions'), 
            pk=pk
        )
        dimensions_data = []
        for dim in template.dimensions.all():
            questions = [{
                'question_id': q.question_id,
                'text': q.text,
                'question_type': q.question_type
            } for q in dim.questions.all()]
            
            dimensions_data.append({
                'dimension_id': dim.dimension_id,
                'name': dim.name,
                'weight': float(dim.weight),
                'questions': questions
            })
        
        return Response({
            'ok': True,
            'template_id': template.template_id,
            'name': template.name,
            'dimensions': dimensions_data
        })

    def patch(self, request, pk):
        try:
            template = EvaluationTemplate.objects.get(pk=pk)
            name = request.data.get('name') or request.data.get('batch_name')
            if name:
                template.name = name
                template.save()
                return Response({'ok': True, 'message': 'Plantilla actualizada.'})
            return Response({'ok': False, 'message': 'Nombre no proporcionado.'}, status=status.HTTP_400_BAD_REQUEST)
        except EvaluationTemplate.DoesNotExist:
            return Response({'ok': False, 'message': 'Plantilla no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            template = EvaluationTemplate.objects.get(pk=pk)
            template.delete()
            return Response({'ok': True, 'message': 'Plantilla eliminada.'})
        except EvaluationTemplate.DoesNotExist:
            return Response({'ok': False, 'message': 'Plantilla no encontrada.'}, status=status.HTTP_404_NOT_FOUND)

class SaveEvaluationView(APIView):
    def post(self, request):
        data = request.data
        teacher_id = data.get('teacher_id')
        template_id = data.get('template_id')
        course_id = data.get('course_id')
        semester = data.get('semester')
        section = data.get('section')
        period = data.get('period')
        answers = data.get('answers', [])

        if not all([teacher_id, template_id, semester, section]):
            return Response({'ok': False, 'message': 'Faltan datos obligatorios.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            teacher = get_object_or_404(Teacher, pk=teacher_id)
            template = get_object_or_404(EvaluationTemplate.objects.prefetch_related('dimensions__questions'), pk=template_id)
            course = Course.objects.filter(pk=course_id).first() if course_id else None

            existing_eval = TeacherEvaluation.objects.filter(
                teacher=teacher,
                course=course,
                semester=semester,
                section=section
            ).exists()

            if existing_eval:
                return Response({
                    'ok': False, 
                    'message': f'Ya existe una observación registrada para el docente {teacher.first_name} en esta sección ({section}) y semestre.'
                }, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                evaluation = TeacherEvaluation.objects.create(
                    teacher=teacher,
                    template=template,
                    course=course,
                    semester=semester,
                    section=section,
                    period=period,
                    observations=data.get('observations', '')
                )

                total_weighted_score = 0
                dimensions = template.dimensions.all()
                
                answers_map = {int(a.get('question_id')): a.get('value') for a in answers if a.get('question_id')}
                
                for dim in dimensions:
                    dim_questions = dim.questions.all()
                    if not dim_questions.exists():
                        continue
                    
                    dim_sum = 0
                    q_count = 0
                    
                    for q in dim_questions:
                        ans_val = answers_map.get(q.question_id)
                        
                        if ans_val is not None:
                            try:
                                val_num = int(ans_val)
                                dim_sum += val_num
                                q_count += 1
                                EvaluationAnswer.objects.create(
                                    evaluation=evaluation,
                                    question=q,
                                    value_numeric=val_num
                                )
                            except:
                                EvaluationAnswer.objects.create(
                                    evaluation=evaluation,
                                    question=q,
                                    value_text=str(ans_val)
                                )
                    
                    if q_count > 0:
                        # Convert 1-5 scale to 0-100 scale for each dimension
                        avg_dim_100 = (dim_sum / q_count) * 20.0
                        total_weighted_score += (avg_dim_100 * float(dim.weight)) / 100.0

                evaluation.final_score = total_weighted_score
                evaluation.save()

                from apps.academic_career.services.scoring_service import update_teacher_global_score
                update_teacher_global_score(teacher_id)

            return Response({
                'ok': True,
                'message': 'Evaluación guardada y score global actualizado.',
                'evaluation_id': evaluation.evaluation_id,
                'template_score': total_weighted_score,
                'global_score': teacher.score
            })

        except Exception as e:
            return Response({'ok': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EvaluationResourcesView(APIView):
    def get(self, request):
        from apps.assessment_360.models import Weightconfig, WeightconfigCriterion, Evaluationcriterion
        from django.utils import timezone
        
        # Determine current semester based on month
        now = timezone.now()
        month = now.month
        year = now.year
        if 1 <= month <= 6:
            current_semester = f"Primer Semestre {year}"
        else:
            current_semester = f"Segundo Semestre {year}"
            
        # Optimize teacher fetching
        teachers = Teacher.objects.filter(status__iexact='active').prefetch_related(
            'section_set__course', 
            'section_set__period'
        ).only('teacher_id', 'first_name', 'last_name', 'code')
        
        templates = EvaluationTemplate.objects.all().only('template_id', 'name')
        
        # Get weight for "Evaluación de pares" or similar
        active_config = Weightconfig.objects.filter(status='active').first()
        obs_weight = 10.0  # Default fallback
        if active_config:
            weight_entry = WeightconfigCriterion.objects.filter(
                weight_config=active_config,
                criterion__name__icontains='pares'
            ).first()
            if not weight_entry:
                weight_entry = WeightconfigCriterion.objects.filter(
                    weight_config=active_config,
                    criterion__name__icontains='observacion'
                ).first()
            
            if weight_entry:
                obs_weight = float(weight_entry.percentage)

        teacher_list = []
        for t in teachers:
            section_list = []
            for s in t.section_set.all():
                raw_p_name = s.period.name if s.period and s.period.name else ''
                p_name = 'Periodo General' if raw_p_name == 'Carga masiva' or not raw_p_name else raw_p_name
                
                # Extract section from course name if it contains (Section)
                import re
                section_code = s.section_code
                match = re.search(r'\(([^)]+)\)', s.course.name)
                if match:
                    section_code = match.group(1)
                    
                section_list.append({
                    'section_id': s.section_id,
                    'section_code': section_code,
                    'course_id': s.course.course_id,
                    'course_name': s.course.name,
                    'period_id': s.period.period_id,
                    'period_name': p_name
                })
            
            teacher_list.append({
                'teacher_id': t.teacher_id,
                'first_name': t.first_name,
                'last_name': t.last_name,
                'code': t.code,
                'sections': section_list
            })
            
        return Response({
            'ok': True,
            'teachers': teacher_list,
            'templates': [{
                'template_id': t.template_id,
                'name': t.name
            } for t in templates],
            'observation_weight': obs_weight,
            'current_semester': current_semester
        })

class EvaluationStatsView(APIView):
    def get(self, request):
        from django.db.models import Avg, Count
        from apps.templates.models import TeacherEvaluation
        from apps.academic_career.models import Teacher

        # Calculate stats
        stats = TeacherEvaluation.objects.aggregate(
            avg_score=Avg('final_score'),
            total_evals=Count('evaluation_id')
        )

        # Get active teachers count
        active_teachers = Teacher.objects.filter(status__iexact='active').count()

        # Get recent evaluations
        recent_evals = TeacherEvaluation.objects.select_related('teacher', 'template').order_by('-created_at')[:5]

        recent_list = []
        for e in recent_evals:
            # If the score is <= 5, it's likely from the old scale, so normalize it for display
            score_val = float(e.final_score)
            if score_val <= 5.0 and score_val > 0:
                score_val = (score_val / 5.0) * 100.0

            recent_list.append({
                'id': e.evaluation_id,
                'teacher_name': f"{e.teacher.first_name} {e.teacher.last_name}",
                'template_name': e.template.name,
                'score': round(score_val, 2),
                'date': e.created_at
            })

        # Calculate average score for the dashboard (normalized to 100)
        avg_score_raw = float(stats['avg_score'] or 0.0)
        if avg_score_raw <= 5.0 and avg_score_raw > 0:
            avg_score_100 = (avg_score_raw / 5.0) * 100.0
        else:
            avg_score_100 = avg_score_raw

        return Response({
            'ok': True,
            'total_evals': stats['total_evals'] or 0,
            'avg_score': round(avg_score_100, 2),
            'active_teachers': active_teachers,
            'recent_evaluations': recent_list
        })

