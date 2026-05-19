# backend/apps/integrations/tests/test_views.py
"""
Unit tests for integrations views
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from .factories import BulkUploadBatchFactory, BulkUploadRecordFactory
from ..models import BulkUploadBatch, BulkUploadRecord


class BulkUploadViewTest(TestCase):
    """Test bulk_upload view (GET, POST)"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('integrations:bulk_upload')

    def test_get_returns_info(self):
        """Test 46: GET returns API info"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertIn("accepted_extensions", response.json())

    def test_options_returns_ok(self):
        """Test 47: OPTIONS returns ok"""
        response = self.client.options(self.url)
        self.assertEqual(response.status_code, 200)

    @patch('apps.integrations.views.process_bulk_upload')
    def test_post_success(self, mock_process):
        """Test 48: POST with valid data returns success"""
        mock_process.return_value = {"ok": True, "message": "Processed"}
        file = MagicMock()
        file.name = "test.csv"
        
        response = self.client.post(self.url, {
            'category': 'titulos',
            'files': [file]
        }, format='multipart')
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

    @patch('apps.integrations.views.process_bulk_upload')
    def test_post_service_error_returns_400(self, mock_process):
        """Test 49: Service error returns 400"""
        from ..services import BulkUploadServiceError
        mock_process.side_effect = BulkUploadServiceError("Bad request")
        
        response = self.client.post(self.url, {
            'category': 'invalid',
            'files': []
        })
        
        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["ok"])


class BulkUploadBatchesViewTest(TestCase):
    """Test bulk_upload_batches view"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('integrations:bulk_upload_batches')
        self.batch1 = BulkUploadBatchFactory()
        self.batch2 = BulkUploadBatchFactory()

    def test_get_batches_default_limit(self):
        """Test 50: GET returns batches with default limit 20"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(response.json()["count"], 2)

    def test_get_batches_with_limit_param(self):
        """Test 51: GET respects limit parameter"""
        response = self.client.get(self.url, {'limit': 1})
        self.assertEqual(response.json()["count"], 1)

    def test_get_batches_invalid_limit_uses_default(self):
        """Test 52: Invalid limit uses default 20"""
        response = self.client.get(self.url, {'limit': 'abc'})
        self.assertEqual(response.json()["count"], 2)


class BulkUploadBatchRecordsViewTest(TestCase):
    """Test bulk_upload_batch_records view"""

    def setUp(self):
        self.client = APIClient()
        self.batch = BulkUploadBatchFactory()
        self.record1 = BulkUploadRecordFactory(batch=self.batch, row_number=1)
        self.record2 = BulkUploadRecordFactory(batch=self.batch, row_number=2)
        self.url = reverse('integrations:bulk_upload_batch_records', args=[self.batch.batch_id])

    def test_get_records_for_batch(self):
        """Test 53: GET returns records for batch"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])
        self.assertEqual(response.json()["batch_id"], self.batch.batch_id)
        self.assertEqual(response.json()["count"], 2)

    def test_get_records_with_limit(self):
        """Test 54: GET respects limit parameter"""
        response = self.client.get(self.url, {'limit': 1})
        self.assertEqual(response.json()["count"], 1)

    def test_get_records_for_nonexistent_batch(self):
        """Test 55: Returns empty results for non-existent batch"""
        url = reverse('integrations:bulk_upload_batch_records', args=[99999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["count"], 0)