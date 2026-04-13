from django.db import models

class Faculty(models.Model):
    faculty_id = models.BigAutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=120, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'faculty'

    def __str__(self):
        return self.name or f"Facultad {self.faculty_id}"

class Career(models.Model):
    career_id = models.BigAutoField(primary_key=True)
    faculty = models.ForeignKey(Faculty, models.DO_NOTHING)
    name = models.CharField(max_length=140, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'career'
        unique_together = (('faculty', 'name'),)

    def __str__(self):
        return self.name or f"Carrera {self.career_id}"

class Course(models.Model):
    course_id = models.BigAutoField(primary_key=True)
    career = models.ForeignKey(Career, models.DO_NOTHING)
    name = models.CharField(max_length=160, blank=True, null=True)
    credits = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'course'
        unique_together = (('career', 'name'),)

    def __str__(self):
        return self.name or f"Curso {self.course_id}"

class Teacher(models.Model):
    teacher_id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=120, blank=True, null=True)
    last_name = models.CharField(max_length=120, blank=True, null=True)
    email = models.EmailField(max_length=254, blank=True, null=True, unique=True)
    code = models.CharField(max_length=20, blank=True, null=True, unique=True)
    role = models.CharField(max_length=50, default='teacher')  # ← agregar
    courses = models.ManyToManyField(Course, blank=True)
    status = models.CharField(max_length=20, blank=True, null=True, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher'
        ordering = ['last_name', 'first_name']

    @property
    def full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or f"Docente {self.teacher_id}"
    
    @property
    def courses_taught(self):
        return ", ".join([course.name for course in self.courses.all()]) if self.courses.exists() else ""

    def __str__(self):
        return self.full_name