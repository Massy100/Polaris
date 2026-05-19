# backend/apps/integrations/tests/test_serializers.py
"""
Unit tests for integrations serializers (functions)
"""

from django.test import TestCase
from django.utils import timezone
from ..serializers import serialize_batch, serialize_record
from .factories import BulkUploadBatchFactory, BulkUploadRecordFactory


class SerializeBatchTest(TestCase):
    """Test serialize_batch function"""

    def test_serialize_batch_returns_dict(self):
        """Test 11: serialize_batch returns correct dictionary"""
        now = timezone.now()
        batch = BulkUploadBatchFactory(
            batch_id=1,
            category="titulos",
            source_filename="data.csv",
            source_extension=".csv",
            status="processed",
            total_rows=100,
            valid_rows=90,
            invalid_rows=10,
            summary={"errors": []},
            created_at=now,
            processed_at=now
        )
        result = serialize_batch(batch)
        
        self.assertEqual(result["batch_id"], 1)
        self.assertEqual(result["category"], "titulos")
        self.assertEqual(result["source_filename"], "data.csv")
        self.assertEqual(result["total_rows"], 100)
        self.assertEqual(result["valid_rows"], 90)
        self.assertEqual(result["invalid_rows"], 10)
        self.assertEqual(result["processed_at"], now.isoformat())
        self.assertEqual(result["created_at"], now.isoformat())

    def test_serialize_batch_processed_at_none(self):
        """Test 12: processed_at is None when not set"""
        batch = BulkUploadBatchFactory(processed_at=None)
        result = serialize_batch(batch)
        self.assertIsNone(result["processed_at"])


class SerializeRecordTest(TestCase):
    """Test serialize_record function"""

    def test_serialize_record_returns_dict(self):
        """Test 13: serialize_record returns correct dictionary"""
        now = timezone.now()
        batch = BulkUploadBatchFactory()
        record = BulkUploadRecordFactory(
            record_id=123,
            batch=batch,
            row_number=5,
            status="valid",
            raw_data={"name": "Test"},
            normalized_data={"norm": "data"},
            error_message="",
            created_at=now
        )
        result = serialize_record(record)
        
        self.assertEqual(result["record_id"], 123)
        self.assertEqual(result["batch_id"], batch.batch_id)
        self.assertEqual(result["row_number"], 5)
        self.assertEqual(result["status"], "valid")
        self.assertEqual(result["raw_data"], {"name": "Test"})
        self.assertEqual(result["normalized_data"], {"norm": "data"})
        self.assertEqual(result["error_message"], "")
        self.assertEqual(result["created_at"], now.isoformat())