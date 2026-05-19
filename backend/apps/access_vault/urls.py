from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import clerk_sync_webhook, VaultSecurityGuardViewSet, PersonalVaultView

router = DefaultRouter()
router.register(r'gatekeeper', VaultSecurityGuardViewSet, basename='gatekeeper')

urlpatterns = [
    path('sync/', clerk_sync_webhook, name='clerk_sync'),
    path('identity/', PersonalVaultView.as_view(), name='personal_vault'),
    path('', include(router.urls)),
]
