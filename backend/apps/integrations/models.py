from django.db import models


class BulkUploadBatch(models.Model):
    CATEGORY_CHOICES = (
        ("titulos", "Titulos"),
        ("meritos", "Meritos"),
        ("opiniones", "Opiniones"),
    )
    STATUS_CHOICES = (
        ("processed", "Processed"),
        ("processed_with_errors", "Processed With Errors"),
        ("failed", "Failed"),
    )

    batch_id = models.BigAutoField(primary_key=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    source_filename = models.CharField(max_length=255)
    source_extension = models.CharField(max_length=10)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="processed")
    total_rows = models.IntegerField(default=0)
    valid_rows = models.IntegerField(default=0)
    invalid_rows = models.IntegerField(default=0)
    summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "bulk_upload_batch"
        ordering = ("-created_at",)


class BulkUploadRecord(models.Model):
    STATUS_CHOICES = (
        ("valid", "Valid"),
        ("invalid", "Invalid"),
    )

    record_id = models.BigAutoField(primary_key=True)
    batch = models.ForeignKey(BulkUploadBatch, models.CASCADE, related_name="records")
    row_number = models.IntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    raw_data = models.JSONField(default=dict, blank=True)
    normalized_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bulk_upload_record"
        ordering = ("batch_id", "row_number")
