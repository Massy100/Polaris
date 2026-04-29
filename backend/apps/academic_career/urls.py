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
from .history_views import TeacherWithCoursesViewSet, CourseWithTeachersViewSet

router = DefaultRouter()
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'careers', CareerViewSet, basename='career')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'faculties', FacultyViewSet, basename='faculty')
router.register(r'teacher-titles', TeacherTitleViewSet, basename='teacher-title')
router.register(r'teacher-merits', TeacherMeritViewSet, basename='teacher-merit')
router.register(r'teacher-opinions', TeacherCoordinatorOpinionViewSet, basename='teacher-coordinator-opinion')
router.register(r'teacher-surveys', TeacherStudentSurveyViewSet, basename='teacher-student-survey')

# History endpoints (History view)
router.register(r'teachers-with-courses', TeacherWithCoursesViewSet, basename='teachers-with-courses')
router.register(r'courses-with-teachers', CourseWithTeachersViewSet, basename='courses-with-teachers')

urlpatterns = [
    path('', include(router.urls)),
]
