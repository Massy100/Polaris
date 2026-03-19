from django.db import models


class BulkUploadBatch(models.Model):
    CATEGORY_TITLES = "titulos"
    CATEGORY_MERITS = "meritos"
    CATEGORY_OPINIONS = "opiniones"
    CATEGORY_CHOICES = [
        (CATEGORY_TITLES, "Titulos"),
        (CATEGORY_MERITS, "Meritos"),
        (CATEGORY_OPINIONS, "Opiniones"),
    ]

    STATUS_PENDING = "pending"
    STATUS_PROCESSED = "processed"
    STATUS_PROCESSED_WITH_ERRORS = "processed_with_errors"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_PROCESSED, "Processed"),
        (STATUS_PROCESSED_WITH_ERRORS, "Processed with errors"),
        (STATUS_FAILED, "Failed"),
    ]

    batch_id = models.BigAutoField(primary_key=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    source_filename = models.CharField(max_length=255)
    total_rows = models.PositiveIntegerField(default=0)
    valid_rows = models.PositiveIntegerField(default=0)
    invalid_rows = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=30,
        choices=STATUS_CHOICES,
        default=STATUS_PENDING,
    )
    summary = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "bulk_upload_batch"
        ordering = ["-created_at"]


class BulkUploadRecord(models.Model):
    STATUS_VALID = "valid"
    STATUS_INVALID = "invalid"
    STATUS_CHOICES = [
        (STATUS_VALID, "Valid"),
        (STATUS_INVALID, "Invalid"),
    ]

    record_id = models.BigAutoField(primary_key=True)
    batch = models.ForeignKey(
        BulkUploadBatch,
        on_delete=models.CASCADE,
        related_name="records",
        db_column="batch_id",
    )
    row_number = models.PositiveIntegerField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    raw_data = models.JSONField(default=dict, blank=True)
    normalized_data = models.JSONField(default=dict, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "bulk_upload_record"
        ordering = ["record_id"]
