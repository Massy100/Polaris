from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db.models import Prefetch
from .models import Teacher, Section, Comment, TeacherClassMetrics
from .serializers import TeacherSerializer

class TeacherDetailView(APIView):
    
    def get(self, request, teacher_id):
        teacher = get_object_or_404(
            Teacher.objects.prefetch_related(
                Prefetch('sections', 
                    queryset=Section.objects.prefetch_related('comments', 'metrics')
                )
            ),
            teacher_id=teacher_id
        )
        
        serializer = TeacherSerializer(teacher)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TeacherSentimentDataView(APIView):
    
    def get(self, request, teacher_id):
        teacher = get_object_or_404(Teacher, teacher_id=teacher_id)
        
        sentiment_data = []
        
        for section in teacher.sections.all():
            if hasattr(section, 'metrics'):
                metrics = section.metrics
                sentiment_data.append({
                    'subject': section.name,
                    'positiveReal': metrics.positive_real,
                    'negativeReal': metrics.negative_real,
                    'falsePositive': metrics.false_positive,
                    'falseNegative': metrics.false_negative,
                })
        
        return Response(sentiment_data, status=status.HTTP_200_OK)

class TeacherListAPIView(APIView):
    
    def get(self, request):
        teachers = Teacher.objects.filter(status='active')
        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)