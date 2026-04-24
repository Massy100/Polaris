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

    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=120, blank=True, null=True)
    since = models.DateField(blank=True, null=True)

    role = models.CharField(max_length=50, blank=True, null=True)

    courses = models.ManyToManyField(
        'Course',
        through='TeacherCourse',
        blank=True
    )

    status = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        default='active'
    )

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
        return ", ".join(
            [course.name for course in self.courses.all()]
        ) if self.courses.exists() else ""

    def __str__(self):
        return self.full_name


class TeacherTitle(models.Model):
    title_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey(Teacher, models.CASCADE, related_name='titles')
    phone = models.CharField(max_length=30, blank=True, null=True)
    specialty = models.CharField(max_length=140)
    academic_degree = models.CharField(max_length=140)
    experience_years = models.IntegerField(default=0)
    current_institution = models.CharField(max_length=180)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_title'
        ordering = ['teacher_id', '-created_at']
        unique_together = (('teacher', 'specialty', 'academic_degree', 'current_institution'),)

    def __str__(self):
        return f"{self.teacher.full_name} - {self.academic_degree}"


class TeacherMerit(models.Model):
    merit_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey(Teacher, models.CASCADE, related_name='merits')
    merit_type = models.CharField(max_length=140)
    description = models.TextField()
    obtained_at = models.DateField(blank=True, null=True)
    granting_institution = models.CharField(max_length=180)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_merit'
        ordering = ['teacher_id', '-obtained_at', '-created_at']
        unique_together = (('teacher', 'merit_type', 'description', 'obtained_at', 'granting_institution'),)

    def __str__(self):
        return f"{self.teacher.full_name} - {self.merit_type}"


class TeacherCoordinatorOpinion(models.Model):
    coordinator_opinion_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey(Teacher, models.CASCADE, related_name='coordinator_opinions')
    author = models.CharField(max_length=140)
    opinion = models.TextField()
    rating = models.IntegerField()
    opinion_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_coordinator_opinion'
        ordering = ['teacher_id', '-opinion_date', '-created_at']
        unique_together = (('teacher', 'author', 'opinion', 'opinion_date'),)

    def __str__(self):
        return f"{self.teacher.full_name} - Opinion coordinador"


class TeacherStudentSurvey(models.Model):
    survey_id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey(Teacher, models.CASCADE, related_name='student_surveys')
    course = models.ForeignKey(Course, models.DO_NOTHING, blank=True, null=True, related_name='student_surveys')
    section = models.CharField(max_length=30, blank=True, null=True)
    author = models.CharField(max_length=140)
    opinion = models.TextField()
    rating = models.IntegerField(blank=True, null=True)
    opinion_date = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teacher_student_survey'
        ordering = ['teacher_id', '-opinion_date', '-created_at']
        unique_together = (('teacher', 'course', 'section', 'author', 'opinion', 'opinion_date'),)

    def __str__(self):
        return f"{self.teacher.full_name} - Encuesta estudiante"
class TeacherCourse(models.Model):
    id = models.BigAutoField(primary_key=True)
    teacher = models.ForeignKey('Teacher', models.DO_NOTHING, db_column='teacher_id')
    course = models.ForeignKey('Course', models.DO_NOTHING, db_column='course_id')

    class Meta:
        db_table = 'teacher_courses'
        unique_together = (('teacher', 'course'),)
