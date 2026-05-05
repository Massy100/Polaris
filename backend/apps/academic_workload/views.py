# apps/academic_workload/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from django.db.models import Avg

from .models import Comment, TeacherCourseScore
from .serializers import AIAnalysisRequestSerializer
from .services import analyze_teacher
from apps.assessment_360.models import Weightconfig, WeightconfigCriterion
from apps.academic_career.models import Teacher


class TeacherAIAnalysisView(APIView):

    def post(self, request):
        serializer = AIAnalysisRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        teacher_id = serializer.validated_data['teacher_id']
        course_id = serializer.validated_data['course_id']

        comments_qs = Comment.objects.filter(
            section__teacher_id=teacher_id,
            section__course_id=course_id,
        ).values('comment_id', 'text')

        comments = [
            {'comment_id': row['comment_id'], 'content': row['text']}
            for row in comments_qs
            if row.get('text')
        ]

        if not comments:
            return Response(
                {'detail': 'No hay comentarios para analizar con ese docente y curso.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        weight_config = Weightconfig.objects.filter(
            status=Weightconfig.Status.ACTIVE,
            is_deleted=False,
        ).first()

        if not weight_config:
            return Response(
                {'detail': 'No hay una configuración de pesos activa.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        criteria_qs = (
            WeightconfigCriterion.objects
            .filter(weight_config=weight_config, is_deleted=False)
            .select_related('criterion')
            .order_by('criterion__display_order')
        )

        if not criteria_qs.exists():
            return Response(
                {'detail': 'La configuración de pesos activa no tiene criterios.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        criteria = [
            {
                'criterion_id': wcc.criterion.criterion_id,
                'name': wcc.criterion.name,
                'description': wcc.criterion.description or '',
                'percentage': float(wcc.percentage),
            }
            for wcc in criteria_qs
        ]

        try:
            result = analyze_teacher(comments, criteria)
        except Exception as e:
            return Response(
                {'detail': f'Error al procesar la IA: {str(e)}'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        for comment_result in result['comments']:
            Comment.objects.filter(comment_id=comment_result['comment_id']).update(
                sentiment_type='positive' if comment_result['sentiment'] == 'P' else 'negative'
            )

        TeacherCourseScore.objects.update_or_create(
            teacher_id=teacher_id,
            course_id=course_id,
            defaults={
                'final_score': result['final_score'],
                'criteria_scores': result['criteria_scores'],
                'period_id': 1,
            }
        )

        avg = TeacherCourseScore.objects.filter(
            teacher_id=teacher_id
        ).aggregate(avg=Avg('final_score'))['avg'] or 0.0

        Teacher.objects.filter(teacher_id=teacher_id).update(score=round(avg, 2))

        return Response(
            {
                'teacher_id': teacher_id,
                'course_id': course_id,
                'weight_config_id': weight_config.weight_config_id,
                **result,
            },
            status=status.HTTP_200_OK,
        )


class TeacherCommentsView(APIView):

    def get(self, request):
        teacher_id = request.query_params.get('teacher_id')
        course_id = request.query_params.get('course_id')

        if not teacher_id or not course_id:
            return Response(
                {'detail': 'teacher_id y course_id son requeridos.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        comments_qs = Comment.objects.filter(
            section__teacher_id=teacher_id,
            section__course_id=course_id,
        ).values('text', 'sentiment_type')

        positive = [c['text'] for c in comments_qs if c['sentiment_type'] == 'positive' and c['text']]
        negative = [c['text'] for c in comments_qs if c['sentiment_type'] == 'negative' and c['text']]

        return Response({
            'teacher_id': int(teacher_id),
            'course_id': int(course_id),
            'positive': positive,
            'negative': negative,
        })