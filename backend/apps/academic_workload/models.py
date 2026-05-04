# apps/academic_workload/models.py
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
    period = models.ForeignKey(Period, models.DO_NOTHING)
    teacher = models.ForeignKey(
        'academic_career.Teacher', models.DO_NOTHING,
        blank=True, null=True,
    )
    section_code = models.CharField(max_length=20, blank=True, null=True)
    modality = models.CharField(max_length=20, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'section'
        unique_together = (('course', 'period', 'section_code'),)


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
    comment_id = models.BigAutoField(primary_key=True)
    section = models.ForeignKey(Section, models.DO_NOTHING, blank=True, null=True)
    text = models.TextField(blank=True, null=True)
    sentiment_type = models.CharField(max_length=30, blank=True, null=True)
    is_true_sentiment = models.BooleanField(default=False)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'comment'


class TeacherCourseScore(models.Model):
    score_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey('academic_career.Teacher', models.DO_NOTHING)
    course = models.ForeignKey('academic_career.Course', models.DO_NOTHING)
    period = models.ForeignKey(Period, models.DO_NOTHING)
    final_score = models.FloatField()
    criteria_scores = models.JSONField(default=dict)
    analyzed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'teacher_course_score'
        unique_together = (('teacher', 'course', 'period'),)