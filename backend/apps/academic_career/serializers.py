# academic-career/serializers.py
from rest_framework import serializers
from .models import (
    Teacher,
    Course,
    Career,
    Faculty,
    TeacherTitle,
    TeacherMerit,
    TeacherCoordinatorOpinion,
    TeacherStudentSurvey,
)


class TeacherTitleSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = TeacherTitle
        fields = [
            'title_id',
            'teacher',
            'teacher_name',
            'phone',
            'specialty',
            'academic_degree',
            'experience_years',
            'current_institution',
            'status',
            'created_at',
            'updated_at',
        ]


class TeacherMeritSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = TeacherMerit
        fields = [
            'merit_id',
            'teacher',
            'teacher_name',
            'merit_type',
            'description',
            'obtained_at',
            'granting_institution',
            'status',
            'created_at',
            'updated_at',
        ]


class TeacherCoordinatorOpinionSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = TeacherCoordinatorOpinion
        fields = [
            'coordinator_opinion_id',
            'teacher',
            'teacher_name',
            'author',
            'opinion',
            'rating',
            'opinion_date',
            'status',
            'created_at',
            'updated_at',
        ]


class TeacherStudentSurveySerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.full_name', read_only=True)

    class Meta:
        model = TeacherStudentSurvey
        fields = [
            'survey_id',
            'teacher',
            'teacher_name',
            'author',
            'opinion',
            'rating',
            'opinion_date',
            'status',
            'created_at',
            'updated_at',
        ]

class CourseSerializer(serializers.ModelSerializer):
    career_name = serializers.CharField(source='career.name', read_only=True)
    class Meta:
        model = Course
        fields = ['course_id', 'career', 'career_name', 'name', 'credits', 'status']

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ['faculty_id', 'name', 'status']

class CareerSerializer(serializers.ModelSerializer):
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = Career
        fields = ['career_id', 'faculty', 'faculty_name', 'name', 'status']


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    courses_taught = serializers.SerializerMethodField()
    specialties = serializers.SerializerMethodField()
    titles = TeacherTitleSerializer(many=True, read_only=True)
    merits = TeacherMeritSerializer(many=True, read_only=True)
    coordinator_opinions = TeacherCoordinatorOpinionSerializer(many=True, read_only=True)
    student_surveys = TeacherStudentSurveySerializer(many=True, read_only=True)
    courses = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Course.objects.all(),
        write_only=True,
        required=False
    )

    courses_detail = CourseSerializer(source='courses', many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = [
            'teacher_id',
            'first_name',
            'last_name',
            'full_name',
            'code',
            'email',
            'phone',
            'department',
            'since',
            'role',
            'courses',          
            'courses_detail',   
            'courses_taught',
            'specialties',
            'titles',
            'merits',
            'coordinator_opinions',
            'student_surveys',
            'status',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.last_name or f"Docente {obj.teacher_id}"
    
    def get_courses_taught(self, obj):
        courses = obj.courses.all()
        return ", ".join([course.name for course in courses]) if courses.exists() else ""

    def get_specialties(self, obj):
        specialties = obj.titles.filter(status='active').values_list('specialty', flat=True).distinct()
        return list(specialties) if specialties else []
    
class TeacherListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    courses_taught = serializers.SerializerMethodField()
    specialties = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = [
            'teacher_id',
            'first_name',
            'last_name',
            'full_name',
            'code',
            'email',
            'courses_taught',
            'specialties',
            'status'
        ]

    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.last_name or f"Docente {obj.teacher_id}"

    def get_courses_taught(self, obj):
        courses = obj.courses.all()
        return ", ".join([course.name for course in courses]) if courses.exists() else ""
    
    def get_specialties(self, obj):
        specialties = obj.titles.filter(status='active').values_list('specialty', flat=True)
        return list(specialties)
