# backend/apps/integrations/tests/test_integration.py
"""
Integration tests for bulk upload - end-to-end scenarios with mocked external dependencies
"""

from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch, MagicMock
from ..services import process_bulk_upload
from ..models import BulkUploadBatch, BulkUploadRecord


class BulkUploadIntegrationTest(TestCase):
    """End-to-end integration tests (mocking file parsing and DB persistence)"""

    @patch('apps.integrations.services._parse_file_rows')
    @patch('apps.integrations.services._persist_domain_row')
    @patch('apps.integrations.services._validate_row')
    @patch('apps.integrations.services._normalize_row')
    @patch('apps.integrations.services._adapt_row_for_category')
    def test_full_titulos_upload(self, mock_adapt, mock_normalize, mock_validate, mock_persist, mock_parse):
        """Test 56: Complete titulos upload flow"""
        # Mock file content
        mock_parse.return_value = [
            {"__source_row_number": 2, "nombre_profesor": "John Doe", "especialidad": "Math", 
             "grado_academico": "PhD", "experiencia_anos": "5", "institucion_actual": "Uni"},
            {"__source_row_number": 3, "nombre_profesor": "Jane Smith", "especialidad": "Physics",
             "grado_academico": "Master", "experiencia_anos": "3", "institucion_actual": "College"}
        ]
        mock_normalize.side_effect = lambda x: x
        mock_adapt.side_effect = lambda cat, x: x
        mock_validate.return_value = (True, "", {"validated": True})
        mock_persist.return_value = MagicMock(teacher_id=123)
        
        file = SimpleUploadedFile("teachers.csv", b"dummy")
        result = process_bulk_upload("titulos", [file])
        
        self.assertTrue(result["ok"])
        self.assertEqual(result["total_files"], 1)
        batch_result = result["results"][0]
        self.assertEqual(batch_result["valid_rows"], 2)
        self.assertEqual(batch_result["invalid_rows"], 0)
        
        # Verify batch and records were created
        self.assertEqual(BulkUploadBatch.objects.count(), 1)
        self.assertEqual(BulkUploadRecord.objects.count(), 2)
        batch = BulkUploadBatch.objects.first()
        self.assertEqual(batch.category, "titulos")
        self.assertEqual(batch.valid_rows, 2)

    @patch('apps.integrations.services._parse_file_rows')
    @patch('apps.integrations.services._detect_file_kind')
    @patch('apps.integrations.services._process_ceat_descriptor')
    def test_credenciales_group_with_ceat(self, mock_process_ceat, mock_detect, mock_parse):
        """Test 57: Credenciales group processes CEAT file"""
        mock_parse.return_value = [{"codigo_docente": "123", "nombres_y_apellidos": "John"}]
        mock_detect.return_value = "ceat"
        mock_process_ceat.return_value = {"batch_id": 1, "valid_rows": 1}
        
        file = SimpleUploadedFile("ceat.xlsx", b"dummy")
        result = process_bulk_upload("credenciales", [file])
        
        self.assertTrue(result["ok"])
        mock_process_ceat.assert_called_once()

    @patch('apps.integrations.services._parse_file_rows')
    @patch('apps.integrations.services._detect_file_kind')
    @patch('apps.integrations.services._process_evaluacion_docente_descriptor')
    def test_evaluaciones_group_with_evaluacion_docente(self, mock_process_eval, mock_detect, mock_parse):
        """Test 58: Evaluaciones group processes evaluacion_docente file"""
        mock_parse.return_value = [{"codigo": "123", "catedratico": "John", "resultado": "85"}]
        mock_detect.return_value = "evaluacion_docente"
        mock_process_eval.return_value = {"batch_id": 1, "valid_rows": 1}
        
        file = SimpleUploadedFile("evaluacion.xlsx", b"dummy")
        result = process_bulk_upload("evaluaciones", [file])
        
        self.assertTrue(result["ok"])
        mock_process_eval.assert_called_once()

    @patch('apps.integrations.services._parse_file_rows')
    @patch('apps.integrations.services._detect_file_kind')
    @patch('apps.integrations.services._process_comentarios_descriptor')
    def test_evaluaciones_group_with_comentarios(self, mock_process_comments, mock_detect, mock_parse):
        """Test 59: Evaluaciones group processes comentarios file"""
        mock_parse.return_value = [{"curso": "Math", "catedratico": "John", "comentario": "Good"}]
        mock_detect.return_value = "comentarios"
        mock_process_comments.return_value = {"batch_id": 1, "valid_rows": 1}
        
        file = SimpleUploadedFile("comentarios.xlsx", b"dummy")
        result = process_bulk_upload("evaluaciones", [file])
        
        self.assertTrue(result["ok"])
        mock_process_comments.assert_called_once()