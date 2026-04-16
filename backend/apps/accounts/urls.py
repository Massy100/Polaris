from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .views import CoordinatorViewSet

app_name = 'accounts'
router = DefaultRouter()
router.register(r'coordinators', CoordinatorViewSet, basename='coordinator')

urlpatterns = [
    path('', include(router.urls)),
]