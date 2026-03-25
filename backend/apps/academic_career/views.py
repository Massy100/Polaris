# academic-career/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Q
from .models import Teacher
from .serializers import TeacherSerializer, TeacherListSerializer

class StandardResultsSetPagination(PageNumberPagination):
    """Configuración de paginación estándar"""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class TeacherViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar docentes.
    Proporciona las acciones: list, create, retrieve, update, partial_update, destroy
    """
    queryset = Teacher.objects.all().order_by('-created_at')
    pagination_class = StandardResultsSetPagination
    
    def get_serializer_class(self):
        """Usar serializer diferente para listado vs detalle"""
        if self.action == 'list':
            return TeacherListSerializer
        return TeacherSerializer
    
    def get_queryset(self):
        """Filtrar por búsqueda si se proporciona"""
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
        """Endpoint específico para búsqueda por nombre"""
        name = request.query_params.get('name', '')
        teachers = self.get_queryset().filter(
            Q(first_name__icontains=name) | 
            Q(last_name__icontains=name)
        )[:20]  # Limitar a 20 resultados
        serializer = self.get_serializer(teachers, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='assign-courses')
    def assign_courses(self, request, pk=None):
        """Endpoint para asignar cursos a un docente"""
        teacher = self.get_object()
        course_ids = request.data.get('course_ids', [])
        
        courses = Course.objects.filter(course_id__in=course_ids)
        teacher.courses.set(courses)
        teacher.save()
        
        serializer = self.get_serializer(teacher)
        return Response(serializer.data, status=status.HTTP_200_OK)