from rest_framework import serializers
from .models import Teacher, Course


class CourseSimpleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = ['course_id', 'name', 'credits', 'status']


class TeacherSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()

    class Meta:
        model = Teacher
        fields = ['teacher_id', 'first_name', 'last_name', 'full_name', 'email', 'status']


class TeacherWithCoursesSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    courses = CourseSimpleSerializer(many=True, read_only=True)

    class Meta:
        model = Teacher
        fields = [
            'teacher_id',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'status',
            'courses',
        ]


class CourseWithTeachersSerializer(serializers.ModelSerializer):
    teachers = TeacherSimpleSerializer(source='teacher_set', many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'course_id',
            'name',
            'credits',
            'status',
            'teachers',
        ]