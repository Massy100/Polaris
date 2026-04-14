# academic-career/serializers.py
from rest_framework import serializers
from .models import Teacher, Course, Career, Faculty

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
    courses = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Course.objects.all(),
        required=False
    )
    
    class Meta:
        model = Teacher
        fields = [
            'teacher_id',
            'first_name', 
            'last_name',
            'full_name',
            'code',
            'email',
            'courses',
            'courses_taught',
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

class TeacherListSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    courses_taught = serializers.SerializerMethodField()
    
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
            'status'
        ]
    
    def get_full_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.first_name or obj.last_name or f"Docente {obj.teacher_id}"
    
    def get_courses_taught(self, obj):
        courses = obj.courses.all()
        return ", ".join([course.name for course in courses]) if courses.exists() else ""