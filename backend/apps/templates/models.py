from django.db import models

class EvaluationTemplate(models.Model):
    template_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'evaluation_template'
        ordering = ['-created_at']

class TemplateDimension(models.Model):
    dimension_id = models.BigAutoField(primary_key=True)
    template = models.ForeignKey(EvaluationTemplate, on_delete=models.CASCADE, related_name='dimensions')
    name = models.CharField(max_length=255)
    weight = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)

    class Meta:
        db_table = 'template_dimension'

class TemplateQuestion(models.Model):
    question_id = models.BigAutoField(primary_key=True)
    dimension = models.ForeignKey(TemplateDimension, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    question_type = models.CharField(max_length=50, default='likert')

    class Meta:
        db_table = 'template_question'

class TeacherEvaluation(models.Model):
    evaluation_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey('academic_career.Teacher', on_delete=models.CASCADE, related_name='evaluations')
    course = models.ForeignKey('academic_career.Course', on_delete=models.SET_NULL, null=True, blank=True)
    template = models.ForeignKey(EvaluationTemplate, on_delete=models.PROTECT)
    semester = models.CharField(max_length=50)
    section = models.CharField(max_length=50)
    period = models.CharField(max_length=100, blank=True, null=True)
    final_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    observations = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teacher_evaluation'

class EvaluationAnswer(models.Model):
    answer_id = models.BigAutoField(primary_key=True)
    evaluation = models.ForeignKey(TeacherEvaluation, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(TemplateQuestion, on_delete=models.CASCADE)
    value_numeric = models.IntegerField(null=True, blank=True)
    value_text = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'evaluation_answer'
