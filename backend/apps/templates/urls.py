from django.urls import path
from .views import TemplateUploadView, TemplateListView, TemplateDetailView, SaveEvaluationView, EvaluationResourcesView, EvaluationStatsView

urlpatterns = [
    path('upload/', TemplateUploadView.as_view(), name='template-upload'),
    path('resources/', EvaluationResourcesView.as_view(), name='evaluation-resources'),
    path('stats/', EvaluationStatsView.as_view(), name='evaluation-stats'),
    path('save-evaluation/', SaveEvaluationView.as_view(), name='save-evaluation'),
    path('', TemplateListView.as_view(), name='template-list'),
    path('<int:pk>/', TemplateDetailView.as_view(), name='template-detail'),
]
