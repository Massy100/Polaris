# academic-career/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TeacherViewSet,
    CareerViewSet,
    CourseViewSet,
    FacultyViewSet,
    TeacherTitleViewSet,
    TeacherMeritViewSet,
    TeacherCoordinatorOpinionViewSet,
    TeacherStudentSurveyViewSet,
)

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'careers', CareerViewSet, basename='career')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'faculties', FacultyViewSet, basename='faculty')
router.register(r'teacher-titles', TeacherTitleViewSet, basename='teacher-title')
router.register(r'teacher-merits', TeacherMeritViewSet, basename='teacher-merit')
router.register(r'teacher-opinions', TeacherCoordinatorOpinionViewSet, basename='teacher-coordinator-opinion')
router.register(r'teacher-surveys', TeacherStudentSurveyViewSet, basename='teacher-student-survey')

urlpatterns = [
    path('', include(router.urls)),
]
