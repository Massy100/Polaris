# backend/apps/pensum/tests/test_views.py
"""
Unit tests for pensum upload and status views
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import io
import pandas as pd
from .factories import PensumCourseFactory
from ..models import PensumCourse


class UploadPensumViewTest(TestCase):
    """Test UploadPensumView (POST /pensum/upload/)"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('pensum-upload')

    def create_excel_file(self, data_rows, header_row_index=None):
        """Helper to create an in-memory Excel file with given data."""
        df = pd.DataFrame(data_rows)
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, header=False)
        output.seek(0)
        return output

    def test_upload_successful_with_valid_file(self):
        """Test 7: Upload valid Excel file with courses"""
        # Simulate an Excel file with header row detection
        # Data as list of rows (each row is a list of values)
        rows = [
            ["NO_CURSO", "NOMBRE_CURSO", "CRED_TEO", "CRED_PRA"],  # header row
            ["CS101", "Programming", "3", "2"],
            ["CS102", "Data Structures", "4", "1"],
            ["CS103", "Algorithms", "3", "0"],
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"

        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Se procesaron 3 cursos', response.data['message'])
        self.assertEqual(PensumCourse.objects.count(), 3)

    def test_upload_ignores_duplicate_codes(self):
        """Test 8: Duplicate course codes are ignored"""
        rows = [
            ["NO_CURSO", "NOMBRE_CURSO", "CRED_TEO", "CRED_PRA"],
            ["CS101", "Programming", "3", "2"],
            ["CS101", "Programming Again", "4", "1"],  # duplicate code
            ["CS102", "Data Structures", "4", "1"],
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"

        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Should have 2 distinct courses (CS101 and CS102)
        self.assertEqual(PensumCourse.objects.count(), 2)
        # The first CS101 is kept, second ignored (bulk_create with ignore_conflicts)
        self.assertTrue(PensumCourse.objects.filter(code="CS101").exists())

    def test_upload_with_code_ending_with_dot_zero(self):
        """Test 9: Code like '123.0' should be cleaned to '123'"""
        rows = [
            ["NO_CURSO", "NOMBRE_CURSO", "CRED_TEO", "CRED_PRA"],
            ["123.0", "Course 123", "3", "1"],
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"

        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        course = PensumCourse.objects.first()
        self.assertEqual(course.code, "123")  # .0 removed

    def test_upload_with_credits_as_floats(self):
        """Test 10: Credits can be floats, should convert to int"""
        rows = [
            ["NO_CURSO", "NOMBRE_CURSO", "CRED_TEO", "CRED_PRA"],
            ["CS101", "Programming", "3.5", "1.2"],
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"

        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        course = PensumCourse.objects.first()
        self.assertEqual(course.credits_theory, 3)   # int conversion truncates? Actually int(float(3.5)) = 3
        self.assertEqual(course.credits_practice, 1)
        self.assertEqual(course.credits_total, 4)

    def test_upload_no_file(self):
        """Test 11: POST without file returns 400"""
        response = self.client.post(self.url, {}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se recibió ningún archivo', response.data['error'])

    def test_upload_invalid_file_format(self):
        """Test 12: Upload a non-Excel file raises exception"""
        file = io.BytesIO(b"this is not an excel file")
        file.name = "bad.txt"
        response = self.client.post(self.url, {'file': file}, format='multipart')
        # pandas will raise an exception, view returns 500
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)

    def test_upload_missing_header_row(self):
        """Test 13: File without valid header returns 400"""
        rows = [
            ["Random", "Data", "No", "Header"],
            ["CS101", "Course", "3", "2"],
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"
        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se encontró un encabezado válido', response.data['error'])

    def test_upload_empty_data(self):
        """Test 14: File with header but no valid course rows"""
        rows = [
            ["NO_CURSO", "NOMBRE_CURSO", "CRED_TEO", "CRED_PRA"],
            # no data rows
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"
        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se encontraron datos válidos', response.data['error'])

    def test_upload_handles_forward_fill(self):
        """Test 15: Forward fill empty cells (ffill) should work"""
        rows = [
            ["NO_CURSO", "NOMBRE_CURSO", "CRED_TEO", "CRED_PRA"],
            ["CS101", "Programming", "3", "2"],
            ["", "", "", ""],  # empty row - should be filled with previous values? Actually ffill works on columns
            ["CS102", "Data Structures", "4", "1"],
        ]
        file = self.create_excel_file(rows)
        file.name = "pensum.xlsx"
        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # The empty row might become a course with empty code, which is skipped.
        # Should still have 2 valid courses.
        self.assertEqual(PensumCourse.objects.count(), 2)

    @patch('pandas.read_excel')
    def test_upload_general_exception_handling(self, mock_read_excel):
        """Test 16: Exception during processing returns 500"""
        mock_read_excel.side_effect = Exception("Mocked error")
        file = io.BytesIO(b"dummy")
        file.name = "pensum.xlsx"
        response = self.client.post(self.url, {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('Mocked error', response.data['error'])


class PensumStatusViewTest(TestCase):
    """Test PensumStatusView (GET /pensum/status/)"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('pensum-status')

    def test_status_false_when_empty(self):
        """Test 17: Status returns is_loaded=False when no courses"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_loaded'])

    def test_status_true_when_courses_exist(self):
        """Test 18: Status returns is_loaded=True when courses exist"""
        PensumCourseFactory()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_loaded'])