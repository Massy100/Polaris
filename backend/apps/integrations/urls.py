from django.urls import path
from . import views

app_name = 'integrations'

urlpatterns = [
    path("bulk-upload/", views.bulk_upload, name="bulk_upload"),
    path("bulk-upload/batches/", views.bulk_upload_batches, name="bulk_upload_batches"),
    path(
        "bulk-upload/batches/<int:batch_id>/records/",
        views.bulk_upload_batch_records,
        name="bulk_upload_batch_records",
    ),
]
