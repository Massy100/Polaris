"""
URL configuration for polaris_core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
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
