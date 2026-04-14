# academic-career/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Teacher, Career, Course, Faculty
from .serializers import (
    TeacherSerializer, TeacherListSerializer,
    CareerSerializer, CourseSerializer, FacultySerializer
)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().order_by('-created_at')
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TeacherListSerializer
        return TeacherSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(code__icontains=search)
            )
        return queryset
    
    @action(detail=False, methods=['get'], url_path='search-by-name')
    def search_by_name(self, request):
        name = request.query_params.get('name', '')
        teachers = self.get_queryset().filter(
            Q(first_name__icontains=name) | 
            Q(last_name__icontains=name)
        )[:20]
        serializer = self.get_serializer(teachers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='assign-courses')
    def assign_courses(self, request, pk=None):
        teacher = self.get_object()
        course_ids = request.data.get('course_ids', [])
        courses = Course.objects.filter(course_id__in=course_ids)
        teacher.courses.set(courses)
        teacher.save()
        serializer = self.get_serializer(teacher)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FacultyViewSet(viewsets.ModelViewSet):
    queryset = Faculty.objects.all()
    serializer_class = FacultySerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(name__icontains=search)
        return queryset


class CareerViewSet(viewsets.ModelViewSet):
    queryset = Career.objects.all()
    serializer_class = CareerSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        faculty_id = self.request.query_params.get('faculty', None)

        if search:
            queryset = queryset.filter(name__icontains=search)
        if faculty_id:
            queryset = queryset.filter(faculty_id=faculty_id)
        return queryset


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = super().get_queryset()
        search = self.request.query_params.get('search', None)
        career_id = self.request.query_params.get('career', None)

        if search:
            queryset = queryset.filter(name__icontains=search)
        if career_id:
            queryset = queryset.filter(career_id=career_id)
        return queryset