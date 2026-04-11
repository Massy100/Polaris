from django.urls import path
from .views import TeacherDetailView, TeacherSentimentDataView, TeacherListAPIView

urlpatterns = [
    path('api/teachers/', TeacherListAPIView.as_view(), name='teacher-list'),
    path('api/teachers/<int:teacher_id>/', TeacherDetailView.as_view(), name='teacher-detail'),
    path('api/teachers/<int:teacher_id>/sentiment/', TeacherSentimentDataView.as_view(), name='teacher-sentiment'),
]