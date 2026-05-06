from django.urls import path
from . import views

app_name = 'academic_workload'

urlpatterns = [
    path('ai-analsis/', views.TeacherAIAnalysisView.as_view(), name='ai-analysis'),
    path('comments/', views.TeacherCommentsView.as_view(), name='comments'),
    path('teacher-periods/', views.TeacherPeriodsView.as_view(), name='teacher-periods'),
    path('teacher-courses/', views.TeacherCoursesInPeriodView.as_view(), name='teacher-courses'),
]