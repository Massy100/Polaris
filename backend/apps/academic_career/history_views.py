from rest_framework import viewsets
from .models import Teacher, Course
from .history_serializers import (
    TeacherWithCoursesSerializer,
    CourseWithTeachersSerializer,
)


class TeacherWithCoursesViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TeacherWithCoursesSerializer

    def get_queryset(self):
        return (
            Teacher.objects
            .filter(status__iexact='active')
            .prefetch_related('courses')
            .order_by('teacher_id')
        )


class CourseWithTeachersViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CourseWithTeachersSerializer

    def get_queryset(self):
        return (
            Course.objects
            .filter(status__iexact='active')
            .prefetch_related('teacher_set')
            .order_by('course_id')
        )