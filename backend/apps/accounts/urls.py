from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'accounts'

router = DefaultRouter()
router.register(r'coordinators', views.CoordinatorViewSet, basename='coordinator')
router.register(r'access-requests', views.AccessRequestViewSet, basename='access-request')
router.register(r'users', views.UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/clerk-login/', views.ClerkLoginView.as_view({'post': 'clerk_login'}), name='clerk-login'),
]