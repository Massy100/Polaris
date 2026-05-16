from rest_framework import serializers
from .models import Teacher, Course
from .history_services import build_course_history, build_teacher_history


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
    courses = serializers.SerializerMethodField()

    def get_courses(self, teacher):
        return build_teacher_history(teacher)

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
    teachers = serializers.SerializerMethodField()

    def get_teachers(self, course):
        return build_course_history(course)

    class Meta:
        model = Course
        fields = [
            'course_id',
            'name',
            'credits',
            'status',
            'teachers',
        ]
