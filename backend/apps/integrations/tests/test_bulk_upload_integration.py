from io import BytesIO

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, TestCase
from openpyxl import Workbook

from apps.academic_career.models import Course, Teacher, TeacherStudentSurvey
from apps.academic_workload.models import Comment, Period, Section


def _xlsx_upload(filename, rows):
    workbook = Workbook()
    sheet = workbook.active
    for row in rows:
        sheet.append(row)

    buffer = BytesIO()
    workbook.save(buffer)
    workbook.close()
    buffer.seek(0)

    return SimpleUploadedFile(
        filename,
        buffer.read(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


class BulkUploadIntegrationTests(TestCase):
    def setUp(self):
        self.client = Client()

    def test_nomina_upload_persists_teacher_course_section_and_header_period(self):
        upload = _xlsx_upload(
            "Nomina de ejemplo.xlsx",
            [
                ["NÓMINA DOCENTE - PRIMER SEMESTRE 2026"],
                [],
                [
                    "Título académico",
                    "Docente",
                    "Código docente",
                    "Facultad",
                    "Carrera",
                    "Curso",
                    "Sección",
                ],
                [
                    "Ing.",
                    "González Armas, Freddy Alejandro",
                    "27128",
                    "Ingeniería",
                    "IIS",
                    "Algebra Lineal",
                    "1",
                ],
            ],
        )

        response = self.client.post(
            "/api/integrations/bulk-upload/",
            {"category": "credenciales", "files": [upload]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

        teacher = Teacher.objects.get(code="27128")
        course = Course.objects.get(name__iexact="Algebra Lineal")
        period = Period.objects.get(name="Primer Semestre 2026")
        section = Section.objects.get(course=course, period=period, section_code="01")

        self.assertEqual(teacher.first_name, "Freddy Alejandro")
        self.assertEqual(teacher.last_name, "González Armas")
        self.assertEqual(section.teacher, teacher)

    def test_evaluation_and_comments_upload_persist_domain_data_for_history(self):
        evaluation_upload = _xlsx_upload(
            "Evaluación Docente.xlsx",
            [
                ["Ciclo: 2do. Semestre 2025"],
                [],
                [
                    "No.",
                    "Código",
                    "Catedrático",
                    "Resultado",
                    "Curso",
                    "Sección",
                    "Estudiantes que realizaron la evaluación",
                    "Estudiantes Asignados",
                ],
                [
                    "1",
                    "27128",
                    "GONZÁLEZ ARMAS, FREDDY ALEJANDRO",
                    "100",
                    "ALGEBRA LINEAL",
                    "01",
                    "2",
                    "2",
                ],
            ],
        )
        comments_upload = _xlsx_upload(
            "Comentarios.xlsx",
            [
                ["Ciclo: 2do. Semestre 2025"],
                [],
                ["Curso", "Catedrático", "Comentario"],
                [
                    "ALGEBRA LINEAL sección: 01",
                    "(27128) FREDDY ALEJANDRO GONZÁLEZ ARMAS",
                    "Buen ingeniero",
                ],
                ["", "", "Excelente docente"],
            ],
        )

        response = self.client.post(
            "/api/integrations/bulk-upload/",
            {"category": "evaluaciones", "files": [evaluation_upload, comments_upload]},
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["ok"])

        teacher = Teacher.objects.get(code="27128")
        course = Course.objects.get(name__iexact="ALGEBRA LINEAL")
        period = Period.objects.get(name="2do. Semestre 2025")
        section = Section.objects.get(course=course, period=period, section_code="01")

        self.assertEqual(section.teacher, teacher)
        self.assertEqual(
            TeacherStudentSurvey.objects.filter(
                teacher=teacher,
                course=course,
                section="01",
                author="Estudiante",
            ).count(),
            2,
        )
        self.assertEqual(Comment.objects.filter(section=section).count(), 2)

        history_response = self.client.get("/api/academic-career/teachers-with-courses/")
        self.assertEqual(history_response.status_code, 200)
        teacher_payload = next(
            item for item in history_response.json() if item["teacher_id"] == teacher.teacher_id
        )
        self.assertEqual(teacher_payload["courses"][0]["period_name"], "2do. Semestre 2025")
        self.assertEqual(teacher_payload["courses"][0]["comments_count"], 2)

    def test_upload_returns_bad_request_when_no_domain_rows_are_saved(self):
        upload = _xlsx_upload(
            "archivo_desconocido.xlsx",
            [
                ["Columna rara", "Otra columna"],
                ["dato", "sin formato esperado"],
            ],
        )

        response = self.client.post(
            "/api/integrations/bulk-upload/",
            {"category": "credenciales", "files": [upload]},
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(response.json()["ok"])
        self.assertIn("No se guardaron registros", response.json()["message"])
