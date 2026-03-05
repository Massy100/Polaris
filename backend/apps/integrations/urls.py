from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    path('bulk-upload/', views.bulk_upload, name='bulk_upload'),
]
