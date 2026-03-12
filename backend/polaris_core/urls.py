from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    path('api/academic-career/', include('apps.academic_career.urls')),
    path('api/academic-workload/', include('apps.academic_workload.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/assessment-360/', include('apps.assessment_360.urls')),
    path('api/integrations/', include('apps.integrations.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reporting/', include('apps.reporting.urls')),
    path('api/security-audit/', include('apps.security_audit.urls')),
]
