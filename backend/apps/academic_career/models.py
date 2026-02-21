from django.db import models


class Faculty(models.Model):
    faculty_id = models.BigAutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=120, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'faculty'


class Career(models.Model):
    career_id = models.BigAutoField(primary_key=True)
    faculty = models.ForeignKey(Faculty, models.DO_NOTHING)
    name = models.CharField(max_length=140, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'career'
        unique_together = (('faculty', 'name'),)


class Course(models.Model):
    course_id = models.BigAutoField(primary_key=True)
    career = models.ForeignKey(Career, models.DO_NOTHING)
    name = models.CharField(max_length=160, blank=True, null=True)
    credits = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'course'
        unique_together = (('career', 'name'),)


class Teacher(models.Model):
    teacher_id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=120, blank=True, null=True)
    last_name = models.CharField(max_length=120, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'teacher'
