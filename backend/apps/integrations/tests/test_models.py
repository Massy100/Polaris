# backend/apps/integrations/tests/test_models.py
"""
Unit tests for integrations models
"""

from django.test import TestCase
from django.db import IntegrityError
from .factories import BulkUploadBatchFactory, BulkUploadRecordFactory
from ..models import BulkUploadBatch, BulkUploadRecord


class BulkUploadBatchModelTest(TestCase):
    """Test BulkUploadBatch model"""

    def test_create_batch_success(self):
        """Test 1: Creating a batch works"""
        batch = BulkUploadBatchFactory(
            category="titulos",
            source_filename="teachers.csv",
            status="processed"
        )
        self.assertEqual(batch.category, "titulos")
        self.assertEqual(batch.source_filename, "teachers.csv")
        self.assertEqual(batch.status, "processed")
        self.assertIsNotNone(batch.batch_id)

    def test_batch_category_choices(self):
        """Test 2: Category must be a valid choice"""
        batch = BulkUploadBatchFactory(category="meritos")
        self.assertEqual(batch.category, "meritos")
        
        # Invalid choice would raise error at creation
        with self.assertRaises(IntegrityError):
            BulkUploadBatch.objects.create(
                category="invalid",
                source_filename="test.csv",
                source_extension=".csv"
            )

    def test_batch_status_choices(self):
        """Test 3: Status must be valid"""
        batch = BulkUploadBatchFactory(status="processed_with_errors")
        self.assertEqual(batch.status, "processed_with_errors")

    def test_batch_ordering(self):
        """Test 4: Batches ordered by -created_at"""
        batch1 = BulkUploadBatchFactory()
        import time
        time.sleep(0.01)
        batch2 = BulkUploadBatchFactory()
        
        queryset = BulkUploadBatch.objects.all()
        self.assertEqual(list(queryset), [batch2, batch1])

    def test_batch_str_method(self):
        """Test 5: String representation includes batch_id"""
        batch = BulkUploadBatchFactory(batch_id=123)
        self.assertIn("123", str(batch))


class BulkUploadRecordModelTest(TestCase):
    """Test BulkUploadRecord model"""

    def test_create_record_success(self):
        """Test 6: Creating a record works"""
        batch = BulkUploadBatchFactory()
        record = BulkUploadRecordFactory(batch=batch, row_number=5, status="valid")
        self.assertEqual(record.batch, batch)
        self.assertEqual(record.row_number, 5)
        self.assertEqual(record.status, "valid")

    def test_record_status_choices(self):
        """Test 7: Status must be valid or invalid"""
        record = BulkUploadRecordFactory(status="valid")
        self.assertEqual(record.status, "valid")
        
        record2 = BulkUploadRecordFactory(status="invalid")
        self.assertEqual(record2.status, "invalid")

    def test_record_ordering(self):
        """Test 8: Records ordered by batch_id, row_number"""
        batch = BulkUploadBatchFactory()
        record1 = BulkUploadRecordFactory(batch=batch, row_number=10)
        record2 = BulkUploadRecordFactory(batch=batch, row_number=1)
        
        queryset = BulkUploadRecord.objects.filter(batch=batch)
        self.assertEqual(list(queryset), [record2, record1])

    def test_record_cascade_delete(self):
        """Test 9: Deleting batch deletes its records"""
        batch = BulkUploadBatchFactory()
        record = BulkUploadRecordFactory(batch=batch)
        batch.delete()
        with self.assertRaises(BulkUploadRecord.DoesNotExist):
            record.refresh_from_db()

    def test_record_json_fields(self):
        """Test 10: raw_data and normalized_data store JSON"""
        record = BulkUploadRecordFactory(
            raw_data={"key1": "value1", "key2": 123},
            normalized_data={"norm_key": "norm_value"}
        )
        self.assertEqual(record.raw_data["key1"], "value1")
        self.assertEqual(record.normalized_data["norm_key"], "norm_value")