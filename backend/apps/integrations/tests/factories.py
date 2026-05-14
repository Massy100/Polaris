# backend/apps/integrations/tests/factories.py
"""
Factory Boy factories for integrations models
"""

import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from ..models import BulkUploadBatch, BulkUploadRecord


class BulkUploadBatchFactory(DjangoModelFactory):
    """Factory for BulkUploadBatch model"""
    class Meta:
        model = BulkUploadBatch

    category = "titulos"
    source_filename = factory.Sequence(lambda n: f"file{n}.csv")
    source_extension = ".csv"
    status = "processed"
    total_rows = 10
    valid_rows = 8
    invalid_rows = 2
    summary = factory.Dict({"errors": [], "teachers_affected": [1, 2]})
    created_at = factory.Faker('date_time_this_year')
    processed_at = factory.Faker('date_time_this_year')


class BulkUploadRecordFactory(DjangoModelFactory):
    """Factory for BulkUploadRecord model"""
    class Meta:
        model = BulkUploadRecord

    batch = factory.SubFactory(BulkUploadBatchFactory)
    row_number = factory.Sequence(lambda n: n + 1)
    status = "valid"
    raw_data = factory.Dict({"nombre_profesor": "John Doe", "email": "john@example.com"})
    normalized_data = factory.Dict({"nombre_profesor": "John Doe", "email": "john@example.com"})
    error_message = ""
    created_at = factory.Faker('date_time_this_year')