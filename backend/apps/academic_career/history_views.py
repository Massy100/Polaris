from rest_framework import viewsets
from django.db.models import Prefetch
from .models import Teacher, Course
from .history_serializers import (
    TeacherWithCoursesSerializer,
    CourseWithTeachersSerializer,
)
from apps.academic_workload.models import Section


class TeacherWithCoursesViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeacherWithCoursesSerializer

    def get_queryset(self):
        return (
            Teacher.objects
            .filter(status__iexact='active')
            .prefetch_related(
                'courses',
                Prefetch(
                    'section_set',
                    queryset=Section.objects.select_related('course', 'period').prefetch_related('academicload_set'),
                ),
            )
            .order_by('teacher_id')
        )


class CourseWithTeachersViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseWithTeachersSerializer

    def get_queryset(self):
        return (
            Course.objects
            .filter(status__iexact='active')
            .prefetch_related(
                'teacher_set',
                Prefetch(
                    'section_set',
                    queryset=Section.objects.select_related('teacher', 'period').prefetch_related('academicload_set'),
                ),
            )
            .order_by('course_id')
        )
