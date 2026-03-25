# academic-career/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TeacherViewSet

# Crear el router
router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')

# También puedes registrar otros ViewSets aquí si los tienes
# router.register(r'careers', CareerViewSet, basename='career')
# router.register(r'courses', CourseViewSet, basename='course')
# router.register(r'faculties', FacultyViewSet, basename='faculty')

urlpatterns = [
    path('', include(router.urls)),
]