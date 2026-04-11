from django.db import models


class Period(models.Model):
    period_id = models.BigAutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=40, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'period'


class Section(models.Model):
    section_id = models.BigAutoField(primary_key=True)
    course = models.ForeignKey('academic_career.Course', models.DO_NOTHING)
    teacher = models.ForeignKey('academic_career.Teacher', models.DO_NOTHING)
    name = models.CharField(max_length=200)
    academic_term = models.CharField(max_length=50)  
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    period = models.ForeignKey(Period, models.DO_NOTHING)
    section_code = models.CharField(max_length=20, blank=True, null=True)
    modality = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'section'
        unique_together = (('course', 'teacher', 'academic_term'),)
        ordering = ['name']

    def __str__(self):
        return f"{self.name} - {self.academic_term}"


class Academicload(models.Model):
    academic_load_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey('academic_career.Teacher', models.DO_NOTHING)
    section = models.ForeignKey(Section, models.DO_NOTHING)
    assigned_hours = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'academicload'
        unique_together = (('teacher', 'section'),)


class Comment(models.Model):
    SENTIMENT_TYPES = [
        ('positive', 'Positivo'),
        ('negative', 'Negativo'),
    ]
    
    comment_id = models.BigAutoField(primary_key=True)
    section = models.ForeignKey(Section, on_delete=models.DO_NOTHING, related_name='comments')
    text = models.TextField()
    sentiment_type = models.CharField(max_length=20, choices=SENTIMENT_TYPES)
    is_true_sentiment = models.BooleanField(default=True) 
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'comment'
    
    def __str__(self):
        return f"Comment for {self.section.name} - {self.sentiment_type}"

class TeacherClassMetrics(models.Model):
    """Métricas de sentimiento para una clase específica"""
    metrics_id = models.BigAutoField(primary_key=True)
    section = models.OneToOneField(Section, on_delete=models.DO_NOTHING, related_name='metrics')
    
    positive_real = models.IntegerField(default=0)
    negative_real = models.IntegerField(default=0)
    false_positive = models.IntegerField(default=0)  
    false_negative = models.IntegerField(default=0)  
    
    calculated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'teacher_class_metrics'
    
    def calculate_metrics(self):
        from .models import Comment  
        
        comments = Comment.objects.filter(section=self.section)
        
        self.positive_real = comments.filter(
            sentiment_type='positive', 
            is_true_sentiment=True
        ).count()
        
        self.negative_real = comments.filter(
            sentiment_type='negative', 
            is_true_sentiment=True
        ).count()
        
        self.false_positive = comments.filter(
            sentiment_type='positive', 
            is_true_sentiment=False
        ).count()
        
        self.false_negative = comments.filter(
            sentiment_type='negative', 
            is_true_sentiment=False
        ).count()
        
        self.save()
        return self
    
    def __str__(self):
        return f"Métricas para {self.section.name}"
        
