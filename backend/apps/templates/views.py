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
            col_weight = next((c for c in df.columns if any(k in c for k in ['peso', 'valor', 'weight'])), None)

            if not col_dim or not col_ques:
                return Response({
                    'ok': False, 
                    'message': 'No se pudieron identificar las columnas requeridas (Dimension, Pregunta).'
                }, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                template = EvaluationTemplate.objects.create(name=name)
                dimensions_cache = {}
                questions_cache = {}
                
                for _, row in df.iterrows():
                    dim_name = str(row[col_dim]).strip()
                    question_text = str(row[col_ques]).strip()
                    q_type = str(row[col_type]).strip().lower() if col_type and pd.notna(row[col_type]) else 'likert'
                    
                    try:
                        weight = float(row[col_weight]) if col_weight and pd.notna(row[col_weight]) else 0.0
                    except:
                        weight = 0.0

                    if not dim_name or dim_name.lower() == 'nan':
                        continue
                    
                    if dim_name not in dimensions_cache:
                        dimension = TemplateDimension.objects.create(
                            template=template,
                            name=dim_name,
                            weight=weight
                        )
                        dimensions_cache[dim_name] = dimension
                        questions_cache[dim_name] = set()
                    
                    current_dim = dimensions_cache[dim_name]
                    
                    if question_text and question_text.lower() != 'nan':
                        if question_text not in questions_cache[dim_name]:
                            TemplateQuestion.objects.create(
                                dimension=current_dim,
                                text=question_text,
                                question_type=q_type
                            )
                            questions_cache[dim_name].add(question_text)

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
                        avg_dim = dim_sum / q_count
                        total_weighted_score += (avg_dim * float(dim.weight)) / 100.0

                evaluation.final_score = total_weighted_score
                evaluation.save()

                teacher.score = total_weighted_score
                teacher.save()

            return Response({
                'ok': True,
                'message': 'Evaluacion guardada exitosamente.',
                'evaluation_id': evaluation.evaluation_id,
                'final_score': total_weighted_score
            })

        except Exception as e:
            return Response({'ok': False, 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class EvaluationResourcesView(APIView):
    def get(self, request):
        teachers = Teacher.objects.filter(status='active').only('teacher_id', 'first_name', 'last_name', 'code')
        templates = EvaluationTemplate.objects.all().only('template_id', 'name')
        
        teacher_list = []
        for t in teachers:
            # Get sections for this teacher to auto-populate fields in the frontend
            sections = Section.objects.filter(teacher=t).select_related('course', 'period')
            
            section_list = []
            for s in sections:
                section_list.append({
                    'section_id': s.section_id,
                    'section_code': s.section_code,
                    'course_id': s.course.course_id,
                    'course_name': s.course.name,
                    'period_id': s.period.period_id,
                    'period_name': s.period.name
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
            } for t in templates]
        })
