from django.urls import path
from .views import UploadPensumView, PensumStatusView, ResetPensumView

urlpatterns = [
    path('upload/', UploadPensumView.as_view(), name='pensum-upload'),
    path('status/', PensumStatusView.as_view(), name='pensum-status'),
    path('reset/', ResetPensumView.as_view(), name='pensum-reset'),
]