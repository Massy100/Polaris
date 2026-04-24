import csv
import io
import re
import unicodedata
from datetime import datetime

from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from apps.academic_career.models import (
    Career,
    Course,
    Faculty,
    Teacher,
    TeacherCoordinatorOpinion,
    TeacherCourse,
    TeacherMerit,
    TeacherStudentSurvey,
    TeacherTitle,
)

from .models import BulkUploadBatch, BulkUploadRecord

try:
    import openpyxl
except Exception:
    openpyxl = None

try:
    import xlrd
except Exception:
    xlrd = None


ALLOWED_CATEGORIES = {"titulos", "meritos", "opiniones", "encuestas"}
GROUP_CATEGORIES = {"credenciales", "evaluaciones"}
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
REQUIRED_FIELDS_BY_CATEGORY = {
    "titulos": {
        "nombre_profesor",
        "especialidad",
        "grado_academico",
        "experiencia_anos",
        "institucion_actual",
    },
    "meritos": {
        "nombre_profesor",
        "email",
        "tipo_merito",
        "descripcion",
        "fecha_obtencion",
        "institucion_otorgante",
    },
    "opiniones": {
        "nombre_profesor",
        "email",
        "opinion",
        "calificacion",
        "fecha_opinion",
        "autor",
    },
    "encuestas": {
        "nombre_profesor",
        "email",
        "opinion",
        "calificacion",
        "fecha_opinion",
        "autor",
    },
}

FILE_KIND_TO_BATCH_CATEGORY = {
    "nomina": "titulos",
    "ceat": "meritos",
    "evaluacion_docente": "encuestas",
    "comentarios": "encuestas",
}


def _normalize_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", (value or "").strip().lower())
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    normalized = re.sub(r"\s+", "_", normalized)
    return re.sub(r"[^a-z0-9_]+", "", normalized).strip("_")


def _normalize_value(value) -> str:
    text = "" if value is None else str(value).strip()
    return re.sub(r";+$", "", text).strip()


def _normalize_row(row: dict) -> dict:
    return {
        _normalize_key(str(key)): _normalize_value(value)
        for key, value in row.items()
    }


def _clean_code(value: str) -> str:
    text = _normalize_value(value)
    if text.endswith(".0"):
        return text[:-2]
    return text


def _normalize_filename(value: str) -> str:
    filename = value.rsplit(".", 1)[0] if "." in value else value
    return _normalize_key(filename)


def _normalize_match_text(value: str) -> str:
    return _normalize_key(value).replace("_", "")


def _extract_code_and_name_from_label(value: str) -> tuple[str, str]:
    text = _normalize_value(value)
    match = re.match(r"^\(([^)]+)\)\s*(.+)$", text)
    if match:
        return _clean_code(match.group(1)), match.group(2).strip()
    return "", text


def _extract_section(value: str) -> str:
    text = _normalize_value(value)
    if not text:
        return ""
    match = re.search(r"secci[oó]n:\s*([0-9A-Za-z]+)", text, flags=re.IGNORECASE)
    if match:
        return match.group(1).strip()
    return text.strip()


def _extract_course_name(value: str) -> str:
    text = _normalize_value(value)
    if not text:
        return ""
    parts = re.split(r"\s+secci[oó]n:\s*[0-9A-Za-z]+\s*", text, maxsplit=1, flags=re.IGNORECASE)
    return parts[0].strip()


def _score_to_rating(value: str) -> int | None:
    raw = _normalize_value(value)
    if not raw:
        return None
    try:
        number = float(raw)
    except Exception:
        return None
    if number <= 10:
        return max(1, min(10, round(number)))
    return max(1, min(10, round(number / 10)))


def _adapt_row_for_category(category: str, row: dict) -> dict | None:
    if category != "titulos":
        return row

    adapted = dict(row)
    title_aliases = {
        "titulo_academico": "grado_academico",
        "docente": "nombre_profesor",
        "codigo_docente": "codigo_docente",
        "facultad": "facultad",
        "carrera": "carrera",
        "curso": "curso",
    }
    is_nomina_format = any(key in adapted for key in title_aliases)

    for source_key, target_key in title_aliases.items():
        if adapted.get(source_key) and not adapted.get(target_key):
            adapted[target_key] = adapted[source_key]

    if is_nomina_format and not adapted.get("nombre_profesor") and not adapted.get("grado_academico"):
        return None

    if is_nomina_format:
        adapted["codigo_docente"] = _clean_code(adapted.get("codigo_docente", ""))
        adapted.setdefault("telefono", "")
        adapted.setdefault("email", "")
        adapted.setdefault("experiencia_anos", "0")
        adapted.setdefault("institucion_actual", "Universidad Rafael Landivar")
        if not adapted.get("especialidad"):
            adapted["especialidad"] = (
                adapted.get("carrera")
                or adapted.get("facultad")
                or "Portafolio profesional"
            )

    return adapted


def _split_full_name(full_name: str) -> tuple[str, str]:
    clean_name = (full_name or "").strip()
    if not clean_name:
        return "", ""

    if "," in clean_name:
        last_name, first_name = [part.strip() for part in clean_name.split(",", 1)]
        return first_name, last_name

    parts = clean_name.split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[0], " ".join(parts[1:])


def _get_or_create_teacher(row: dict) -> Teacher:
    email = row.get("email", "").strip().lower()
    code = _clean_code(row.get("codigo_docente", "") or row.get("code", ""))
    first_name, last_name = _split_full_name(row.get("nombre_profesor", ""))
    now = timezone.now()

    defaults = {
        "first_name": first_name,
        "last_name": last_name,
        "status": "ACTIVE",
        "role": "teacher",
        "created_at": now,
        "updated_at": now,
    }
    if email:
        defaults["email"] = email

    if code:
        teacher, _ = Teacher.objects.get_or_create(code=code, defaults=defaults)
        updated_fields = []
        if first_name and not teacher.first_name:
            teacher.first_name = first_name
            updated_fields.append("first_name")
        if last_name and not teacher.last_name:
            teacher.last_name = last_name
            updated_fields.append("last_name")
        if email and not teacher.email:
            teacher.email = email
            updated_fields.append("email")
        if updated_fields:
            teacher.updated_at = now
            updated_fields.append("updated_at")
            teacher.save(update_fields=updated_fields)
        return teacher

    if email:
        teacher, created = Teacher.objects.get_or_create(
            email=email,
            defaults=defaults,
        )
        updated_fields = []
        if first_name and not teacher.first_name:
            teacher.first_name = first_name
            updated_fields.append("first_name")
        if last_name and not teacher.last_name:
            teacher.last_name = last_name
            updated_fields.append("last_name")
        if updated_fields:
            teacher.updated_at = now
            updated_fields.append("updated_at")
            teacher.save(update_fields=updated_fields)
        return teacher

    teacher = Teacher.objects.filter(first_name__iexact=first_name, last_name__iexact=last_name).first()
    if teacher:
        return teacher

    return Teacher.objects.create(
        first_name=first_name,
        last_name=last_name,
        status="ACTIVE",
        role="teacher",
        created_at=now,
        updated_at=now,
    )


def _get_or_create_course(row: dict) -> Course | None:
    course_name = _normalize_value(row.get("curso", ""))
    if not course_name:
        return None

    faculty_name = _normalize_value(row.get("facultad", "")) or "Carga masiva"
    career_name = _normalize_value(row.get("carrera", "")) or "General"

    faculty, _ = Faculty.objects.get_or_create(
        name=faculty_name,
        defaults={"status": "active"},
    )
    career, _ = Career.objects.get_or_create(
        faculty=faculty,
        name=career_name,
        defaults={"status": "active"},
    )

    course = Course.objects.filter(name__iexact=course_name).order_by("course_id").first()
    if course:
        return course

    course, _ = Course.objects.get_or_create(
        career=career,
        name=course_name,
        defaults={
            "credits": None,
            "status": "active",
        },
    )
    return course


def _link_teacher_course(teacher: Teacher, row: dict) -> None:
    course = _get_or_create_course(row)
    if not course:
        return

    TeacherCourse.objects.get_or_create(
        teacher=teacher,
        course=course,
    )


def _resolve_survey_course_and_section(row: dict) -> tuple[Course | None, str]:
    course = _get_or_create_course(row)
    section = _normalize_value(row.get("seccion", ""))
    return course, section


def _sync_pending_comment_ratings(teacher: Teacher, course: Course | None, section: str, rating: int | None) -> None:
    if rating is None:
        return

    pending_comments = TeacherStudentSurvey.objects.filter(
        teacher=teacher,
        course=course,
        author="Estudiante",
        status="active",
        rating__isnull=True,
    )

    if section:
        pending_comments = pending_comments.filter(section=section)
    else:
        pending_comments = pending_comments.filter(section__isnull=True)

    pending_comments.update(rating=rating, updated_at=timezone.now())


def _persist_domain_row(category: str, row: dict) -> Teacher:
    teacher = _get_or_create_teacher(row)

    if category == "titulos":
        TeacherTitle.objects.update_or_create(
            teacher=teacher,
            specialty=row["especialidad"],
            academic_degree=row["grado_academico"],
            current_institution=row["institucion_actual"],
            defaults={
                "phone": row.get("telefono", ""),
                "experience_years": row["experiencia_anos"],
                "status": "active",
            },
        )
        _link_teacher_course(teacher, row)
    elif category == "meritos":
        TeacherMerit.objects.update_or_create(
            teacher=teacher,
            merit_type=row["tipo_merito"],
            description=row["descripcion"],
            obtained_at=row.get("fecha_obtencion") or None,
            granting_institution=row["institucion_otorgante"],
            defaults={"status": "active"},
        )
    elif category == "opiniones":
        TeacherCoordinatorOpinion.objects.update_or_create(
            teacher=teacher,
            author=row["autor"],
            opinion=row["opinion"],
            opinion_date=row.get("fecha_opinion") or None,
            defaults={
                "rating": row["calificacion"],
                "status": "active",
            },
        )
    elif category == "encuestas":
        course, section = _resolve_survey_course_and_section(row)
        survey, _ = TeacherStudentSurvey.objects.update_or_create(
            teacher=teacher,
            course=course,
            section=section or None,
            author=row["autor"],
            opinion=row["opinion"],
            opinion_date=row.get("fecha_opinion") or None,
            defaults={
                "rating": row["calificacion"],
                "status": "active",
            },
        )
        if course:
            TeacherCourse.objects.get_or_create(
                teacher=teacher,
                course=course,
            )
        if row["autor"] == "Sistema de evaluación estudiantil":
            _sync_pending_comment_ratings(teacher, course, section or None, survey.rating)

    return teacher


def _parse_csv(file_obj) -> list[dict]:
    file_obj.seek(0)
    wrapper = io.TextIOWrapper(file_obj.file, encoding="utf-8-sig")
    reader = csv.DictReader(wrapper)
    rows = [dict(row) for row in reader]
    wrapper.detach()
    return rows


def _parse_xlsx(file_obj) -> list[dict]:
    if openpyxl is None:
        raise ValueError("Falta dependencia openpyxl para procesar .xlsx")
    file_obj.seek(0)
    workbook = openpyxl.load_workbook(file_obj, read_only=True, data_only=True)
    sheet = workbook.active
    all_rows = list(sheet.iter_rows(values_only=True))
    header_index = _find_header_row_index(all_rows)
    if header_index is None:
        workbook.close()
        return []
    headers = all_rows[header_index]
    if not headers:
        workbook.close()
        return []
    parsed_headers = [str(value).strip() if value is not None else "" for value in headers]
    rows = []
    for source_row_number, values in enumerate(all_rows[header_index + 1:], start=header_index + 2):
        row = {}
        for idx, header in enumerate(parsed_headers):
            if not header:
                continue
            cell_value = values[idx] if idx < len(values) else ""
            row[header] = "" if cell_value is None else str(cell_value)
        if any(value for value in row.values()):
            row["__source_row_number"] = source_row_number
            rows.append(row)
    workbook.close()
    return rows


def _find_header_row_index(rows) -> int | None:
    known_headers = {
        "nombre_profesor",
        "email",
        "telefono",
        "especialidad",
        "grado_academico",
        "experiencia_anos",
        "institucion_actual",
        "tipo_merito",
        "descripcion",
        "fecha_obtencion",
        "institucion_otorgante",
        "opinion",
        "calificacion",
        "fecha_opinion",
        "autor",
        "titulo_academico",
        "docente",
        "codigo_docente",
        "facultad",
        "carrera",
        "curso",
        "nombres_y_apellidos",
        "numero_de_expediente",
        "estado",
        "nivel_1_iniciacion",
        "nivel_2_transicion",
        "nivel_3_autonomia",
        "complementarias",
        "codigo",
        "catedratico",
        "resultado",
        "seccion",
        "comentario",
        "nombre_sede",
        "nombre_facultad",
        "nombre_carrera",
        "no_pensum",
        "no_curso",
        "area",
        "evaluacion_del_desempeno",
        "autoevaluacion",
        "evaluacion_desde_la_coordinacion",
    }

    for index, row in enumerate(rows):
        normalized_headers = {_normalize_key(str(value)) for value in row if value not in (None, "")}
        if len(normalized_headers.intersection(known_headers)) >= 2:
            return index
    return None


def _parse_xls(file_obj) -> list[dict]:
    if xlrd is None:
        raise ValueError("Falta dependencia xlrd para procesar .xls")
    file_obj.seek(0)
    book = xlrd.open_workbook(file_contents=file_obj.read())
    sheet = book.sheet_by_index(0)
    if sheet.nrows == 0:
        return []
    headers = [str(sheet.cell_value(0, col)).strip() for col in range(sheet.ncols)]
    rows = []
    for row_idx in range(1, sheet.nrows):
        row = {}
        for col_idx, header in enumerate(headers):
            if not header:
                continue
            value = sheet.cell_value(row_idx, col_idx)
            row[header] = "" if value is None else str(value)
        rows.append(row)
    return rows


def _parse_file_rows(file_obj, extension: str) -> list[dict]:
    if extension == ".csv":
        return _parse_csv(file_obj)
    if extension == ".xlsx":
        return _parse_xlsx(file_obj)
    if extension == ".xls":
        return _parse_xls(file_obj)
    raise ValueError("Extension no soportada.")


def _validate_row(category: str, row: dict) -> tuple[bool, str, dict]:
    required_fields = REQUIRED_FIELDS_BY_CATEGORY[category]
    missing = [field for field in required_fields if not row.get(field)]
    if missing:
        return False, f"Faltan columnas/valores requeridos: {', '.join(sorted(missing))}", {}

    normalized = dict(row)

    if category == "titulos":
        try:
            normalized["experiencia_anos"] = int(float(row.get("experiencia_anos", "0")))
            if normalized["experiencia_anos"] < 0:
                raise ValueError
        except Exception:
            return False, "experiencia_anos debe ser un numero >= 0.", {}

    if category in {"opiniones", "encuestas"}:
        try:
            normalized["calificacion"] = int(float(row.get("calificacion", "0")))
            if normalized["calificacion"] < 1 or normalized["calificacion"] > 10:
                raise ValueError
        except Exception:
            return False, "calificacion debe estar entre 1 y 10.", {}

    if category in {"meritos", "opiniones", "encuestas"}:
        date_key = "fecha_obtencion" if category == "meritos" else "fecha_opinion"
        date_value = row.get(date_key, "")
        if date_value:
            parsed = None
            for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y"):
                try:
                    parsed = datetime.strptime(date_value, fmt).date()
                    break
                except ValueError:
                    continue
            if parsed is None:
                return False, f"{date_key} no tiene formato de fecha valido.", {}
            normalized[date_key] = parsed.isoformat()

    return True, "", normalized


def _serialize_batch(batch: BulkUploadBatch) -> dict:
    return {
        "batch_id": batch.batch_id,
        "category": batch.category,
        "source_filename": batch.source_filename,
        "source_extension": batch.source_extension,
        "status": batch.status,
        "total_rows": batch.total_rows,
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "summary": batch.summary,
        "created_at": batch.created_at.isoformat(),
        "processed_at": batch.processed_at.isoformat() if batch.processed_at else None,
    }


def _serialize_record(record: BulkUploadRecord) -> dict:
    return {
        "record_id": record.record_id,
        "batch_id": record.batch_id,
        "row_number": record.row_number,
        "status": record.status,
        "raw_data": record.raw_data,
        "normalized_data": record.normalized_data,
        "error_message": record.error_message,
        "created_at": record.created_at.isoformat(),
    }


def _create_batch(category: str, filename: str, extension: str, total_rows: int) -> BulkUploadBatch:
    return BulkUploadBatch.objects.create(
        category=category,
        source_filename=filename,
        source_extension=extension,
        status="processed",
        total_rows=total_rows,
        summary={},
    )


def _save_batch_record(
    batch: BulkUploadBatch,
    row_number: int,
    status: str,
    raw_data: dict,
    normalized_data: dict | None = None,
    error_message: str = "",
):
    BulkUploadRecord.objects.create(
        batch=batch,
        row_number=row_number,
        status=status,
        raw_data=raw_data,
        normalized_data=normalized_data or {},
        error_message=error_message,
    )


def _finalize_batch(
    batch: BulkUploadBatch,
    valid_rows: int,
    invalid_rows: int,
    errors: list[dict],
    teacher_ids: set[int],
):
    if invalid_rows > 0:
        batch.status = "processed_with_errors"
    batch.valid_rows = valid_rows
    batch.invalid_rows = invalid_rows
    batch.summary = {
        "errors": errors[:50],
        "teachers_affected": sorted(teacher_ids),
        "teachers_count": len(teacher_ids),
    }
    batch.processed_at = timezone.now()
    batch.save(update_fields=["valid_rows", "invalid_rows", "status", "summary", "processed_at"])


def _extract_row_keys(rows: list[dict]) -> set[str]:
    keys = set()
    for row in rows[:10]:
        keys.update(_normalize_key(str(key)) for key in row.keys() if key != "__source_row_number")
    return keys


def _detect_file_kind(filename: str, rows: list[dict]) -> str:
    normalized_name = _normalize_filename(filename)
    keys = _extract_row_keys(rows)

    if "nomina" in normalized_name or {"titulo_academico", "docente", "codigo_docente"}.issubset(keys):
        return "nomina"
    if "comentario" in normalized_name or {"curso", "catedratico", "comentario"}.issubset(keys):
        return "comentarios"
    if "evaluacion_docente" in normalized_name or {"codigo", "catedratico", "resultado", "curso", "seccion"}.issubset(keys):
        return "evaluacion_docente"
    if "ceat" in normalized_name or {"codigo_docente", "nombres_y_apellidos", "numero_de_expediente"}.issubset(keys):
        return "ceat"
    if "control_docente" in normalized_name or {"area", "docente", "curso", "jornada", "seccion"}.issubset(keys):
        return "control_docente"
    if "pensum" in normalized_name or {"nombre_sede", "nombre_facultad", "nombre_carrera", "no_pensum", "no_curso"}.issubset(keys):
        return "pensum"
    return "unknown"


def _build_evaluation_context(descriptors: list[dict]) -> dict:
    by_code_course_section = {}
    by_code = {}

    for descriptor in descriptors:
        for raw_row in descriptor["rows"]:
            row = _normalize_row({key: value for key, value in raw_row.items() if key != "__source_row_number"})
            code = _clean_code(row.get("codigo", ""))
            teacher_name = row.get("catedratico", "")
            course = _normalize_match_text(row.get("curso", ""))
            section = _extract_section(row.get("seccion", ""))
            rating = _score_to_rating(row.get("resultado", ""))

            if not code or not teacher_name or not course or not rating:
                continue

            key = (code, course, section)
            by_code_course_section[key] = rating
            by_code.setdefault(code, []).append(rating)

    return {
        "by_code_course_section": by_code_course_section,
        "by_code_average": {
            code: max(1, min(10, round(sum(values) / len(values))))
            for code, values in by_code.items()
            if values
        },
    }


def _build_evaluation_context_from_db() -> dict:
    by_code_course_section = {}
    by_code = {}

    surveys = (
        TeacherStudentSurvey.objects.filter(
            status="active",
            author="Sistema de evaluación estudiantil",
        )
        .select_related("teacher", "course")
    )

    for survey in surveys:
        code = _clean_code(getattr(survey.teacher, "code", "") or "")
        course_name = _normalize_match_text(getattr(survey.course, "name", "") or "")
        section = _normalize_value(getattr(survey, "section", "") or "")
        rating = getattr(survey, "rating", None)

        if not code or not rating:
            continue

        if course_name:
            by_code_course_section[(code, course_name, section)] = rating
        by_code.setdefault(code, []).append(rating)

    return {
        "by_code_course_section": by_code_course_section,
        "by_code_average": {
            code: max(1, min(10, round(sum(values) / len(values))))
            for code, values in by_code.items()
            if values
        },
    }


def _merge_evaluation_context(*contexts: dict) -> dict:
    merged_by_code_course_section = {}
    merged_by_code = {}

    for context in contexts:
        merged_by_code_course_section.update(context.get("by_code_course_section", {}))
        for code, rating in context.get("by_code_average", {}).items():
            merged_by_code.setdefault(code, []).append(rating)

    return {
        "by_code_course_section": merged_by_code_course_section,
        "by_code_average": {
            code: max(1, min(10, round(sum(values) / len(values))))
            for code, values in merged_by_code.items()
            if values
        },
    }


def _unsupported_group_result(file_obj, kind: str, message: str) -> dict:
    return {
        "filename": file_obj.name,
        "detected_type": kind,
        "status": "ignored",
        "message": message,
        "valid_rows": 0,
        "invalid_rows": 0,
    }


def _process_ceat_descriptor(descriptor: dict) -> dict:
    file_obj = descriptor["file"]
    filename = descriptor["filename"]
    extension = descriptor["extension"]
    rows = descriptor["rows"]
    batch = _create_batch("meritos", filename, extension, len(rows))

    valid_rows = 0
    invalid_rows = 0
    errors = []
    teacher_ids = set()

    for fallback_row_number, raw_row in enumerate(rows, start=2):
        row_number = raw_row.get("__source_row_number", fallback_row_number)
        row = _normalize_row({key: value for key, value in raw_row.items() if key != "__source_row_number"})
        code = _clean_code(row.get("codigo_docente", ""))
        teacher_name = row.get("nombres_y_apellidos", "")

        if not code and not teacher_name:
            continue

        merit_values = [
            row.get("numero_de_expediente", ""),
            row.get("estado", ""),
            row.get("nivel_1_iniciacion", ""),
            row.get("nivel_2_transicion", ""),
            row.get("nivel_3_autonomia", ""),
            row.get("complementarias", ""),
        ]
        if not any(merit_values):
            continue

        merit_row = {
            "nombre_profesor": teacher_name,
            "codigo_docente": code,
            "tipo_merito": "Capacitación CEAT",
            "descripcion": " | ".join(
                [
                    value
                    for value in [
                        f"Expediente: {row.get('numero_de_expediente', '')}" if row.get("numero_de_expediente") else "",
                        f"Estado: {row.get('estado', '')}" if row.get("estado") else "",
                        f"Nivel 1: {row.get('nivel_1_iniciacion', '')}" if row.get("nivel_1_iniciacion") else "",
                        f"Nivel 2: {row.get('nivel_2_transicion', '')}" if row.get("nivel_2_transicion") else "",
                        f"Nivel 3: {row.get('nivel_3_autonomia', '')}" if row.get("nivel_3_autonomia") else "",
                        f"Complementarias: {row.get('complementarias', '')}" if row.get("complementarias") else "",
                    ]
                    if value
                ]
            ),
            "fecha_obtencion": "",
            "institucion_otorgante": "CEAT",
        }

        try:
            teacher = _persist_domain_row("meritos", merit_row)
            teacher_ids.add(teacher.teacher_id)
            valid_rows += 1
            _save_batch_record(batch, row_number, "valid", row, merit_row, "")
        except Exception as exc:
            invalid_rows += 1
            error_message = f"No se pudo persistir en tablas de dominio: {str(exc)}"
            errors.append({"row_number": row_number, "error": error_message})
            _save_batch_record(batch, row_number, "invalid", row, {}, error_message)

    _finalize_batch(batch, valid_rows, invalid_rows, errors, teacher_ids)
    return {
        "batch_id": batch.batch_id,
        "filename": filename,
        "detected_type": "ceat",
        "saved_as": "meritos",
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "status": batch.status,
    }


def _process_evaluacion_docente_descriptor(descriptor: dict) -> dict:
    filename = descriptor["filename"]
    extension = descriptor["extension"]
    rows = descriptor["rows"]
    batch = _create_batch("encuestas", filename, extension, len(rows))

    valid_rows = 0
    invalid_rows = 0
    errors = []
    teacher_ids = set()

    for fallback_row_number, raw_row in enumerate(rows, start=2):
        row_number = raw_row.get("__source_row_number", fallback_row_number)
        row = _normalize_row({key: value for key, value in raw_row.items() if key != "__source_row_number"})
        code = _clean_code(row.get("codigo", ""))
        teacher_name = row.get("catedratico", "")
        rating = _score_to_rating(row.get("resultado", ""))

        if not code or not teacher_name or rating is None:
            continue

        course = row.get("curso", "")
        section = row.get("seccion", "")
        jornada = row.get("jornada", "")
        evaluated = row.get("estudiantes_que_realizaron_la_evaluacion", "")
        assigned = row.get("estudiantes_asignados", "")

        survey_row = {
            "nombre_profesor": teacher_name,
            "codigo_docente": code,
            "curso": course,
            "seccion": section,
            "autor": "Sistema de evaluación estudiantil",
            "opinion": (
                f"Resultado agregado de evaluación estudiantil para {course or 'curso sin nombre'}"
                f"{f' sección {section}' if section else ''}"
                f"{f' ({jornada})' if jornada else ''}."
                f"{f' Participaron {evaluated} de {assigned} estudiantes.' if evaluated or assigned else ''}"
            ).strip(),
            "calificacion": rating,
            "fecha_opinion": "",
        }

        try:
            teacher = _persist_domain_row("encuestas", survey_row)
            teacher_ids.add(teacher.teacher_id)
            valid_rows += 1
            _save_batch_record(batch, row_number, "valid", row, survey_row, "")
        except Exception as exc:
            invalid_rows += 1
            error_message = f"No se pudo persistir en tablas de dominio: {str(exc)}"
            errors.append({"row_number": row_number, "error": error_message})
            _save_batch_record(batch, row_number, "invalid", row, {}, error_message)

    _finalize_batch(batch, valid_rows, invalid_rows, errors, teacher_ids)
    return {
        "batch_id": batch.batch_id,
        "filename": filename,
        "detected_type": "evaluacion_docente",
        "saved_as": "encuestas",
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "status": batch.status,
    }


def _process_comentarios_descriptor(descriptor: dict, evaluation_context: dict) -> dict:
    filename = descriptor["filename"]
    extension = descriptor["extension"]
    rows = descriptor["rows"]
    batch = _create_batch("encuestas", filename, extension, len(rows))

    valid_rows = 0
    invalid_rows = 0
    errors = []
    teacher_ids = set()
    current_block = None

    for fallback_row_number, raw_row in enumerate(rows, start=2):
        row_number = raw_row.get("__source_row_number", fallback_row_number)
        row = _normalize_row({key: value for key, value in raw_row.items() if key != "__source_row_number"})
        course_label = row.get("curso", "")
        teacher_label = row.get("catedratico", "")
        comment = row.get("comentario", "")

        if teacher_label:
            code, teacher_name = _extract_code_and_name_from_label(teacher_label)
            course_key = _normalize_match_text(_extract_course_name(course_label))
            section = _extract_section(course_label)
            rating = (
                evaluation_context["by_code_course_section"].get((code, course_key, section))
                or evaluation_context["by_code_average"].get(code)
            )
            current_block = {
                "code": code,
                "teacher_name": teacher_name,
                "course_label": course_label,
                "rating": rating,
            }

        if not comment:
            continue

        if not current_block or not current_block.get("teacher_name"):
            invalid_rows += 1
            error_message = "Comentario sin bloque de docente asociado."
            errors.append({"row_number": row_number, "error": error_message})
            _save_batch_record(batch, row_number, "invalid", row, {}, error_message)
            continue

        rating = current_block.get("rating")

        survey_row = {
            "nombre_profesor": current_block["teacher_name"],
            "codigo_docente": current_block["code"],
            "curso": _extract_course_name(current_block["course_label"]),
            "seccion": _extract_section(current_block["course_label"]),
            "autor": "Estudiante",
            "opinion": comment,
            "calificacion": rating,
            "fecha_opinion": "",
        }

        try:
            teacher = _persist_domain_row("encuestas", survey_row)
            teacher_ids.add(teacher.teacher_id)
            valid_rows += 1
            _save_batch_record(
                batch,
                row_number,
                "valid",
                row,
                survey_row,
                "" if rating is not None else "Comentario guardado sin rating; pendiente de evaluación.",
            )
        except Exception as exc:
            invalid_rows += 1
            error_message = f"No se pudo persistir en tablas de dominio: {str(exc)}"
            errors.append({"row_number": row_number, "error": error_message})
            _save_batch_record(batch, row_number, "invalid", row, {}, error_message)

    _finalize_batch(batch, valid_rows, invalid_rows, errors, teacher_ids)
    return {
        "batch_id": batch.batch_id,
        "filename": filename,
        "detected_type": "comentarios",
        "saved_as": "encuestas",
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "status": batch.status,
    }


def _process_file(category: str, file_obj) -> tuple[BulkUploadBatch, dict]:
    filename = file_obj.name
    extension = f".{filename.split('.')[-1].lower()}" if "." in filename else ""
    raw_rows = _parse_file_rows(file_obj, extension)

    batch = BulkUploadBatch.objects.create(
        category=category,
        source_filename=filename,
        source_extension=extension,
        status="processed",
        total_rows=len(raw_rows),
        summary={},
    )

    valid_rows = 0
    invalid_rows = 0
    errors = []
    teacher_ids = set()

    for fallback_row_number, raw_row in enumerate(raw_rows, start=2):
        row_number = raw_row.get("__source_row_number", fallback_row_number)
        row_values = {key: value for key, value in raw_row.items() if key != "__source_row_number"}
        normalized_row = _adapt_row_for_category(category, _normalize_row(row_values))
        if normalized_row is None:
            continue
        is_valid, error_message, clean_row = _validate_row(category, normalized_row)
        if is_valid:
            try:
                teacher = _persist_domain_row(category, clean_row)
                teacher_ids.add(teacher.teacher_id)
                valid_rows += 1
                status = "valid"
                normalized_data = clean_row
                error_to_save = ""
            except Exception as exc:
                invalid_rows += 1
                status = "invalid"
                normalized_data = {}
                error_to_save = f"No se pudo persistir en tablas de dominio: {str(exc)}"
                errors.append({"row_number": row_number, "error": error_to_save})
        else:
            invalid_rows += 1
            status = "invalid"
            normalized_data = {}
            error_to_save = error_message
            errors.append({"row_number": row_number, "error": error_message})

        BulkUploadRecord.objects.create(
            batch=batch,
            row_number=row_number,
            status=status,
            raw_data=normalized_row,
            normalized_data=normalized_data,
            error_message=error_to_save,
        )

    batch.valid_rows = valid_rows
    batch.invalid_rows = invalid_rows
    if invalid_rows > 0:
        batch.status = "processed_with_errors"
    batch.summary = {
        "errors": errors[:50],
        "teachers_affected": sorted(teacher_ids),
        "teachers_count": len(teacher_ids),
    }
    batch.processed_at = timezone.now()
    batch.save(update_fields=["valid_rows", "invalid_rows", "status", "summary", "processed_at"])

    result = {
        "batch_id": batch.batch_id,
        "filename": filename,
        "total_rows": batch.total_rows,
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "status": batch.status,
    }
    return batch, result


@csrf_exempt
@require_http_methods(["GET", "POST", "OPTIONS"])
def bulk_upload(request):
    if request.method == "GET":
        return JsonResponse(
            {
                "ok": True,
                "message": "Bulk upload API ready.",
                "endpoint": "/api/integrations/bulk-upload/",
                "methods": ["GET", "POST", "OPTIONS"],
                "accepted_extensions": sorted(ALLOWED_EXTENSIONS),
                "accepted_groups": sorted(GROUP_CATEGORIES),
                "required_fields_by_category": {
                    key: sorted(value) for key, value in REQUIRED_FIELDS_BY_CATEGORY.items()
                },
            }
        )

    if request.method == "OPTIONS":
        return JsonResponse({"detail": "ok"})

    category = request.POST.get("category", "").strip().lower()
    if category not in ALLOWED_CATEGORIES and category not in GROUP_CATEGORIES:
        return JsonResponse(
            {
                "ok": False,
                "message": "Categoria invalida. Usa: titulos, meritos, opiniones, encuestas, credenciales o evaluaciones.",
            },
            status=400,
        )

    files = request.FILES.getlist("files")
    if not files:
        return JsonResponse({"ok": False, "message": "No se recibieron archivos."}, status=400)

    results = []

    if category in GROUP_CATEGORIES:
        descriptors = []
        for file_obj in files:
            filename = file_obj.name
            extension = f".{filename.split('.')[-1].lower()}" if "." in filename else ""

            if extension not in ALLOWED_EXTENSIONS:
                return JsonResponse(
                    {
                        "ok": False,
                        "message": f"Archivo no permitido: {filename}. Solo .csv, .xlsx o .xls.",
                    },
                    status=400,
                )

            if file_obj.size > MAX_FILE_SIZE_BYTES:
                return JsonResponse(
                    {"ok": False, "message": f"Archivo demasiado grande: {filename}. Maximo 10MB."},
                    status=400,
                )

            try:
                rows = _parse_file_rows(file_obj, extension)
            except Exception as exc:
                return JsonResponse(
                    {"ok": False, "message": f"No se pudo leer {filename}: {str(exc)}"},
                    status=400,
                )

            descriptors.append(
                {
                    "file": file_obj,
                    "filename": filename,
                    "extension": extension,
                    "rows": rows,
                    "kind": _detect_file_kind(filename, rows),
                }
            )

        evaluation_context = _merge_evaluation_context(
            _build_evaluation_context_from_db(),
            _build_evaluation_context(
                [descriptor for descriptor in descriptors if descriptor["kind"] == "evaluacion_docente"]
            ),
        )

        for descriptor in descriptors:
            kind = descriptor["kind"]
            try:
                with transaction.atomic():
                    if category == "credenciales":
                        if kind == "nomina":
                            _, result = _process_file("titulos", descriptor["file"])
                            result["detected_type"] = "nomina"
                            result["saved_as"] = "titulos"
                        elif kind == "ceat":
                            result = _process_ceat_descriptor(descriptor)
                        elif kind == "control_docente":
                            result = _unsupported_group_result(
                                descriptor["file"],
                                kind,
                                "Control docente no tiene tabla de dominio destino en la DB actual.",
                            )
                        elif kind == "pensum":
                            result = _unsupported_group_result(
                                descriptor["file"],
                                kind,
                                "Pensum no pertenece al flujo de portafolio docente.",
                            )
                        else:
                            result = _unsupported_group_result(
                                descriptor["file"],
                                kind,
                                "El archivo no corresponde al grupo de portafolio profesional.",
                            )
                    else:
                        if kind == "evaluacion_docente":
                            result = _process_evaluacion_docente_descriptor(descriptor)
                        elif kind == "comentarios":
                            result = _process_comentarios_descriptor(descriptor, evaluation_context)
                        else:
                            result = _unsupported_group_result(
                                descriptor["file"],
                                kind,
                                "El archivo no corresponde al grupo de evaluaciones estudiantiles.",
                            )

                    results.append(result)
            except Exception as exc:
                return JsonResponse(
                    {"ok": False, "message": f"No se pudo procesar {descriptor['filename']}: {str(exc)}"},
                    status=400,
                )

        return JsonResponse(
            {
                "ok": True,
                "message": "Carga masiva procesada.",
                "category": category,
                "total_files": len(results),
                "results": results,
            }
        )

    for file_obj in files:
        filename = file_obj.name
        extension = f".{filename.split('.')[-1].lower()}" if "." in filename else ""

        if extension not in ALLOWED_EXTENSIONS:
            return JsonResponse(
                {
                    "ok": False,
                    "message": f"Archivo no permitido: {filename}. Solo .csv, .xlsx o .xls.",
                },
                status=400,
            )

        if file_obj.size > MAX_FILE_SIZE_BYTES:
            return JsonResponse(
                {"ok": False, "message": f"Archivo demasiado grande: {filename}. Maximo 10MB."},
                status=400,
            )

        try:
            rows = _parse_file_rows(file_obj, extension)
            descriptor = {
                "file": file_obj,
                "filename": filename,
                "extension": extension,
                "rows": rows,
                "kind": _detect_file_kind(filename, rows),
            }

            with transaction.atomic():
                if category == "encuestas" and descriptor["kind"] == "evaluacion_docente":
                    result = _process_evaluacion_docente_descriptor(descriptor)
                elif category == "encuestas" and descriptor["kind"] == "comentarios":
                    result = _process_comentarios_descriptor(
                        descriptor,
                        _merge_evaluation_context(
                            _build_evaluation_context_from_db(),
                            {},
                        ),
                    )
                elif category == "meritos" and descriptor["kind"] == "ceat":
                    result = _process_ceat_descriptor(descriptor)
                else:
                    _, result = _process_file(category, file_obj)
                results.append(result)
        except Exception as exc:
            return JsonResponse(
                {"ok": False, "message": f"No se pudo procesar {filename}: {str(exc)}"},
                status=400,
            )

    return JsonResponse(
        {
            "ok": True,
            "message": "Carga masiva procesada.",
            "category": category,
            "total_files": len(results),
            "results": results,
        }
    )


@require_http_methods(["GET"])
def bulk_upload_batches(request):
    limit = request.GET.get("limit", "20")
    try:
        limit_value = max(1, min(int(limit), 100))
    except ValueError:
        limit_value = 20

    batches = BulkUploadBatch.objects.all()[:limit_value]
    return JsonResponse(
        {"ok": True, "count": len(batches), "results": [_serialize_batch(batch) for batch in batches]}
    )


@require_http_methods(["GET"])
def bulk_upload_batch_records(request, batch_id: int):
    limit = request.GET.get("limit", "100")
    try:
        limit_value = max(1, min(int(limit), 500))
    except ValueError:
        limit_value = 100

    records = BulkUploadRecord.objects.filter(batch_id=batch_id)[:limit_value]
    return JsonResponse(
        {
            "ok": True,
            "batch_id": batch_id,
            "count": len(records),
            "results": [_serialize_record(record) for record in records],
        }
    )
