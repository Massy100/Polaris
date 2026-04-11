
from rest_framework import serializers
from apps.academic_career.models import Teacher, Course
from apps.academic_workload.models import Section, Comment, TeacherClassMetrics, Academicload

class CommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Comment
        fields = ['comment_id', 'text', 'sentiment_type', 'is_true_sentiment', 'created_at']

class TeacherClassMetricsSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherClassMetrics
        fields = ['positive_real', 'negative_real', 'false_positive', 'false_negative']

class SectionSerializer(serializers.ModelSerializer):
    comments = serializers.SerializerMethodField()
    metrics = TeacherClassMetricsSerializer(read_only=True)
    course_name = serializers.ReadOnlyField(source='course.name')
    
    class Meta:
        model = Section
        fields = ['section_id', 'name', 'course_name', 'academic_term', 'comments', 'metrics']
    
    def get_comments(self, obj):
        positive_comments = obj.comments.filter(
            sentiment_type='positive', 
            is_true_sentiment=True
        ).values_list('text', flat=True)
        
        negative_comments = obj.comments.filter(
            sentiment_type='negative', 
            is_true_sentiment=True
        ).values_list('text', flat=True)
        
        return {
            'positive': list(positive_comments),
            'negative': list(negative_comments)
        }

class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    sections = SectionSerializer(many=True, read_only=True)
    final_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Teacher
        fields = [
            'teacher_id', 'first_name', 'last_name', 'full_name',
            'department', 'email', 'phone', 'role', 'since',
            'sections', 'final_score', 'status'
        ]
    
    def get_final_score(self, obj):
        sections = obj.sections.all()
        if not sections:
            return 0.0
        
        total_score = 0
        valid_sections = 0
        
        for section in sections:
            if hasattr(section, 'metrics'):
                metrics = section.metrics
                total_comments = metrics.positive_real + metrics.negative_real
                
                if total_comments > 0:
                    section_score = (metrics.positive_real / total_comments) * 10
                    total_score += section_score
                    valid_sections += 1
        
        if valid_sections == 0:
            return 0.0
            
        return round(total_score / valid_sections, 1)