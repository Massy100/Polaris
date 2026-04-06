# apps/assessment_360/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
 
router = DefaultRouter()
router.register(r'weight-configs', views.WeightConfigViewSet, basename='weightconfig')
router.register(r'evaluation-criteria', views.EvaluationCriterionViewSet, basename='evaluationcriterion')
 
urlpatterns = [
    path('', include(router.urls)),
]