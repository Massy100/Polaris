# apps/academic_workload/urls.py
from django.urls import path
from . import views

app_name = 'academic_workload'

urlpatterns = [
    path('ai-analysis/', views.TeacherAIAnalysisView.as_view(), name='ai-analysis'),
]