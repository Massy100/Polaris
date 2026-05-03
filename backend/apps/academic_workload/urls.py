from django.urls import path
from . import views

app_name = 'academic_workload'

urlpatterns = [
    path('ai-analysis/', views.TeacherAIAnalysisView.as_view(), name='ai-analysis'),
    path('comments/', views.TeacherCommentsView.as_view(), name='comments'),
]