# backend/apps/integrations/tests/test_services.py
"""
Unit tests for bulk upload services (mocked dependencies)
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock, mock_open
import io
import csv
from datetime import datetime
from django.core.files.uploadedfile import SimpleUploadedFile

from ..services import (
    ALLOWED_EXTENSIONS, REQUIRED_FIELDS_BY_CATEGORY, GROUP_CATEGORIES,
    _normalize_key, _normalize_value, _normalize_row, _clean_code,
    _extract_code_and_name_from_label, _extract_section, _extract_course_name,
    _score_to_rating, _split_full_name, _detect_file_kind, _validate_row,
    _validate_upload_file, _build_file_descriptor, process_bulk_upload,
    BulkUploadServiceError
)
from ..models import BulkUploadBatch, BulkUploadRecord


class NormalizationHelpersTest(TestCase):
    """Test helper normalization functions"""

    def test_normalize_key(self):
        """Test 14: _normalize_key converts to lowercase snake_case"""
        self.assertEqual(_normalize_key("Nombre Profesor"), "nombre_profesor")
        self.assertEqual(_normalize_key("  Email Address  "), "email_address")
        self.assertEqual(_normalize_key("Código_Único!"), "codigo_unico")

    def test_normalize_value(self):
        """Test 15: _normalize_value strips and removes trailing semicolons"""
        self.assertEqual(_normalize_value("  hello  "), "hello")
        self.assertEqual(_normalize_value("hello;;;"), "hello")
        self.assertEqual(_normalize_value(None), "")

    def test_normalize_row(self):
        """Test 16: _normalize_row normalizes all keys and values"""
        row = {"Nombre Profesor": "  Juan Perez  ", "Email": "juAN@test.com;;"}
        result = _normalize_row(row)
        self.assertEqual(result, {"nombre_profesor": "Juan Perez", "email": "juAN@test.com"})

    def test_clean_code(self):
        """Test 17: _clean_code removes .0 suffix"""
        self.assertEqual(_clean_code("123.0"), "123")
        self.assertEqual(_clean_code("ABC.0"), "ABC")
        self.assertEqual(_clean_code("123"), "123")

    def test_extract_code_and_name_from_label(self):
        """Test 18: Extract code from parenthesized label"""
        code, name = _extract_code_and_name_from_label("(T001) Juan Perez")
        self.assertEqual(code, "T001")
        self.assertEqual(name, "Juan Perez")
        
        code, name = _extract_code_and_name_from_label("No code")
        self.assertEqual(code, "")
        self.assertEqual(name, "No code")

    def test_extract_section(self):
        """Test 19: Extract section from text"""
        section = _extract_section("Course (sección: A01)")
        self.assertEqual(section, "A01")
        
        section = _extract_section("No section here")
        self.assertEqual(section, "No section here")

    def test_extract_course_name(self):
        """Test 20: Extract course name before 'sección:'"""
        course = _extract_course_name("Math 101 sección: A01")
        self.assertEqual(course, "Math 101")
        
        course = _extract_course_name("Physics")
        self.assertEqual(course, "Physics")

    def test_score_to_rating(self):
        """Test 21: Convert score to rating 1-10"""
        self.assertEqual(_score_to_rating("85"), 9)  # 85/10 = 8.5 rounded = 9
        self.assertEqual(_score_to_rating("9.5"), 10)  # direct
        self.assertEqual(_score_to_rating("0"), 1)
        self.assertEqual(_score_to_rating("150"), 10)  # capped
        self.assertIsNone(_score_to_rating("invalid"))

    def test_split_full_name(self):
        """Test 22: Split full name into first and last"""
        first, last = _split_full_name("John Doe")
        self.assertEqual(first, "John")
        self.assertEqual(last, "Doe")
        
        first, last = _split_full_name("Doe, John")
        self.assertEqual(first, "John")
        self.assertEqual(last, "Doe")
        
        first, last = _split_full_name("John")
        self.assertEqual(first, "John")
        self.assertEqual(last, "")


class DetectFileKindTest(TestCase):
    """Test _detect_file_kind function"""

    def test_detect_nomina_by_name(self):
        """Test 23: Detect 'nomina' from filename"""
        rows = [{"docente": "John", "codigo_docente": "123"}]
        kind = _detect_file_kind("nomina_teachers.xlsx", rows)
        self.assertEqual(kind, "nomina")

    def test_detect_ceat_by_keys(self):
        """Test 24: Detect 'ceat' by required keys"""
        rows = [{"codigo_docente": "123", "nombres_y_apellidos": "John", "numero_de_expediente": "456"}]
        kind = _detect_file_kind("file.xlsx", rows)
        self.assertEqual(kind, "ceat")

    def test_detect_evaluacion_docente_by_keys(self):
        """Test 25: Detect 'evaluacion_docente' by keys"""
        rows = [{"codigo": "123", "catedratico": "John", "resultado": "85", "curso": "Math", "seccion": "A"}]
        kind = _detect_file_kind("file.xlsx", rows)
        self.assertEqual(kind, "evaluacion_docente")

    def test_detect_comentarios_by_keys(self):
        """Test 26: Detect 'comentarios' by keys"""
        rows = [{"curso": "Math", "catedratico": "John", "comentario": "Great"}]
        kind = _detect_file_kind("comentarios.xlsx", rows)
        self.assertEqual(kind, "comentarios")

    def test_unknown_kind(self):
        """Test 27: Return 'unknown' for unrecognized"""
        rows = [{"unrelated": "data"}]
        kind = _detect_file_kind("random.csv", rows)
        self.assertEqual(kind, "unknown")


class ValidateRowTest(TestCase):
    """Test _validate_row function"""

    def test_valid_titulos_row(self):
        """Test 28: Valid titulos row passes"""
        row = {
            "nombre_profesor": "John Doe",
            "especialidad": "Math",
            "grado_academico": "PhD",
            "experiencia_anos": "5",
            "institucion_actual": "University"
        }
        is_valid, error, normalized = _validate_row("titulos", row)
        self.assertTrue(is_valid)
        self.assertEqual(normalized["experiencia_anos"], 5)

    def test_missing_field_titulos(self):
        """Test 29: Missing required field fails"""
        row = {"nombre_profesor": "John Doe"}
        is_valid, error, _ = _validate_row("titulos", row)
        self.assertFalse(is_valid)
        self.assertIn("Faltan columnas/valores requeridos", error)

    def test_negative_experience_years_fails(self):
        """Test 30: Negative experience years fails"""
        row = {
            "nombre_profesor": "John",
            "especialidad": "Math",
            "grado_academico": "PhD",
            "experiencia_anos": "-5",
            "institucion_actual": "Uni"
        }
        is_valid, error, _ = _validate_row("titulos", row)
        self.assertFalse(is_valid)
        self.assertIn("experiencia_anos debe ser un numero >= 0", error)

    def test_valid_opiniones_row(self):
        """Test 31: Valid opiniones row passes"""
        row = {
            "nombre_profesor": "John",
            "email": "john@test.com",
            "opinion": "Good",
            "calificacion": "8",
            "fecha_opinion": "2024-01-15",
            "autor": "Coordinator"
        }
        is_valid, error, normalized = _validate_row("opiniones", row)
        self.assertTrue(is_valid)
        self.assertEqual(normalized["calificacion"], 8)

    def test_rating_out_of_range_fails(self):
        """Test 32: Rating outside 1-10 fails"""
        row = {
            "nombre_profesor": "John",
            "email": "j@t.com",
            "opinion": "Good",
            "calificacion": "20",
            "fecha_opinion": "2024-01-01",
            "autor": "Coord"
        }
        is_valid, error, _ = _validate_row("opiniones", row)
        self.assertFalse(is_valid)
        self.assertIn("calificacion debe estar entre 1 y 10", error)

    def test_invalid_date_format_fails(self):
        """Test 33: Invalid date format fails"""
        row = {
            "nombre_profesor": "John",
            "email": "j@t.com",
            "opinion": "Good",
            "calificacion": "5",
            "fecha_opinion": "invalid-date",
            "autor": "Coord"
        }
        is_valid, error, _ = _validate_row("opiniones", row)
        self.assertFalse(is_valid)
        self.assertIn("no tiene formato de fecha valido", error)


class ValidateUploadFileTest(TestCase):
    """Test _validate_upload_file function"""

    def test_valid_csv_file(self):
        """Test 34: Valid CSV file passes"""
        file = SimpleUploadedFile("test.csv", b"content", content_type="text/csv")
        filename, ext = _validate_upload_file(file)
        self.assertEqual(filename, "test.csv")
        self.assertEqual(ext, ".csv")

    def test_invalid_extension(self):
        """Test 35: Invalid extension raises error"""
        file = SimpleUploadedFile("test.txt", b"content")
        with self.assertRaises(BulkUploadServiceError) as ctx:
            _validate_upload_file(file)
        self.assertIn("Archivo no permitido", str(ctx.exception))

    def test_file_too_large(self):
        """Test 36: File > 10MB raises error"""
        large_content = b"x" * (11 * 1024 * 1024)
        file = SimpleUploadedFile("large.csv", large_content)
        with self.assertRaises(BulkUploadServiceError) as ctx:
            _validate_upload_file(file)
        self.assertIn("demasiado grande", str(ctx.exception))


@patch('apps.integrations.services._parse_file_rows')
class BuildFileDescriptorTest(TestCase):
    """Test _build_file_descriptor"""

    def test_build_descriptor_success(self, mock_parse):
        """Test 37: Build descriptor correctly"""
        mock_parse.return_value = [{"col1": "val1"}]
        file = SimpleUploadedFile("test.csv", b"a,b\n1,2")
        descriptor = _build_file_descriptor(file)
        
        self.assertEqual(descriptor["filename"], "test.csv")
        self.assertEqual(descriptor["extension"], ".csv")
        self.assertEqual(descriptor["rows"], [{"col1": "val1"}])
        self.assertIn("kind", descriptor)

    def test_parse_error_raises_bulk_error(self, mock_parse):
        """Test 38: Parse error raises BulkUploadServiceError"""
        mock_parse.side_effect = Exception("Parse failed")
        file = SimpleUploadedFile("bad.csv", b"data")
        with self.assertRaises(BulkUploadServiceError):
            _build_file_descriptor(file)


@patch('apps.integrations.services._process_file')
@patch('apps.integrations.services._build_file_descriptor')
class ProcessBulkUploadSingleCategoryTest(TestCase):
    """Test process_bulk_upload for single categories"""

    def test_process_titulos_success(self, mock_build, mock_process):
        """Test 39: Process titulos category successfully"""
        mock_build.return_value = {
            "file": MagicMock(),
            "filename": "data.csv",
            "extension": ".csv",
            "rows": [],
            "kind": "nomina"
        }
        mock_process.return_value = (MagicMock(), {"batch_id": 1})
        
        files = [MagicMock()]
        result = process_bulk_upload("titulos", files)
        
        self.assertTrue(result["ok"])
        self.assertEqual(result["category"], "titulos")
        self.assertEqual(result["total_files"], 1)
        mock_process.assert_called_once()

    def test_unknown_category_raises_error(self, mock_build, mock_process):
        """Test 40: Unknown category raises error"""
        files = [MagicMock()]
        with self.assertRaises(BulkUploadServiceError) as ctx:
            process_bulk_upload("invalid", files)
        self.assertIn("Categoria invalida", str(ctx.exception))

    def test_no_files_raises_error(self, mock_build, mock_process):
        """Test 41: No files raises error"""
        with self.assertRaises(BulkUploadServiceError) as ctx:
            process_bulk_upload("titulos", [])
        self.assertIn("No se recibieron archivos", str(ctx.exception))


@patch('apps.integrations.services._merge_evaluation_context')
@patch('apps.integrations.services._build_evaluation_context_from_db')
@patch('apps.integrations.services._build_evaluation_context')
@patch('apps.integrations.services._process_group_descriptor')
@patch('apps.integrations.services._build_file_descriptor')
class ProcessBulkUploadGroupCategoryTest(TestCase):
    """Test process_bulk_upload for group categories (credenciales, evaluaciones)"""

    def test_process_credenciales(self, mock_build, mock_group_process, mock_build_eval, mock_eval_db, mock_merge):
        """Test 42: Process credenciales group"""
        mock_build.return_value = {
            "file": MagicMock(),
            "filename": "data.csv",
            "extension": ".csv",
            "rows": [],
            "kind": "nomina"
        }
        mock_group_process.return_value = {"batch_id": 1}
        mock_build_eval.return_value = {}
        mock_eval_db.return_value = {}
        mock_merge.return_value = {}
        
        files = [MagicMock(), MagicMock()]
        result = process_bulk_upload("credenciales", files)
        
        self.assertTrue(result["ok"])
        self.assertEqual(result["category"], "credenciales")
        self.assertEqual(result["total_files"], 2)
        self.assertEqual(mock_group_process.call_count, 2)

    def test_process_evaluaciones(self, mock_build, mock_group_process, mock_build_eval, mock_eval_db, mock_merge):
        """Test 43: Process evaluaciones group"""
        mock_build.return_value = {
            "file": MagicMock(),
            "filename": "data.csv",
            "extension": ".csv",
            "rows": [],
            "kind": "evaluacion_docente"
        }
        mock_group_process.return_value = {"batch_id": 1}
        mock_build_eval.return_value = {}
        mock_eval_db.return_value = {}
        mock_merge.return_value = {}
        
        files = [MagicMock()]
        result = process_bulk_upload("evaluaciones", files)
        
        self.assertTrue(result["ok"])
        self.assertEqual(result["category"], "evaluaciones")
        mock_merge.assert_called_once()


@patch('apps.integrations.services._persist_domain_row')
@patch('apps.integrations.services._validate_row')
@patch('apps.integrations.services._adapt_row_for_category')
@patch('apps.integrations.services._normalize_row')
@patch('apps.integrations.services._parse_file_rows')
class ProcessFileInternalTest(TestCase):
    """Test internal _process_file function (via process_bulk_upload single)"""

    def test_process_file_valid_row(self, mock_parse, mock_normalize, mock_adapt, mock_validate, mock_persist):
        """Test 44: Process valid row successfully"""
        mock_parse.return_value = [{"__source_row_number": 2, "Nombre": "John"}]
        mock_normalize.return_value = {"nombre": "John"}
        mock_adapt.return_value = {"nombre": "John"}
        mock_validate.return_value = (True, "", {"nombre": "John"})
        mock_persist.return_value = MagicMock(teacher_id=1)
        
        file = SimpleUploadedFile("test.csv", b"data")
        with patch('apps.integrations.services._create_batch') as mock_create:
            mock_batch = MagicMock()
            mock_create.return_value = mock_batch
            
            from ..services import _process_file
            batch, result = _process_file("titulos", file)
            
            self.assertEqual(result["valid_rows"], 1)
            self.assertEqual(result["invalid_rows"], 0)
            self.assertEqual(mock_batch.valid_rows, 1)
            mock_persist.assert_called_once()

    def test_process_file_invalid_row(self, mock_parse, mock_normalize, mock_adapt, mock_validate, mock_persist):
        """Test 45: Process invalid row"""
        mock_parse.return_value = [{"__source_row_number": 2, "Nombre": "John"}]
        mock_normalize.return_value = {"nombre": "John"}
        mock_adapt.return_value = {"nombre": "John"}
        mock_validate.return_value = (False, "Missing field", {})
        
        file = SimpleUploadedFile("test.csv", b"data")
        with patch('apps.integrations.services._create_batch') as mock_create:
            mock_batch = MagicMock()
            mock_create.return_value = mock_batch
            
            from ..services import _process_file
            batch, result = _process_file("titulos", file)
            
            self.assertEqual(result["valid_rows"], 0)
            self.assertEqual(result["invalid_rows"], 1)
            self.assertEqual(mock_batch.status, "processed_with_errors")
            mock_persist.assert_not_called()