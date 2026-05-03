# apps/academic_workload/serializers.py
from rest_framework import serializers
from .models import Period, Section, Academicload, Comment


class PeriodSerializer(serializers.ModelSerializer):
    class Meta:
        model = Period
        fields = ['period_id', 'name', 'start_date', 'end_date', 'status']


class SectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Section
        fields = ['section_id', 'course', 'period', 'section_code', 'modality', 'status']


class AcademicloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Academicload
        fields = ['academic_load_id', 'teacher', 'section', 'assigned_hours', 'status']


class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['comment_id', 'section', 'text', 'sentiment_type', 'is_true_sentiment', 'created_at']


class AIAnalysisRequestSerializer(serializers.Serializer):
    teacher_id = serializers.IntegerField()
    period_id = serializers.IntegerField()
    course_id = serializers.IntegerField()
    weight_config_id = serializers.IntegerField()