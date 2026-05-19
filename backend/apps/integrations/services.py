import csv
import io
import re
import unicodedata
from datetime import datetime

from django.db import connection, transaction
from django.utils import timezone

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
from apps.academic_workload.models import Academicload, Comment, Period, Section

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
_TABLE_COLUMNS_CACHE: dict[str, set[str]] = {}
_TEACHER_CACHE: dict[tuple[str, str, str, str], Teacher] = {}
_TEACHER_BY_CODE_CACHE: dict[str, Teacher] = {}
_FACULTY_CACHE: dict[str, Faculty] = {}
_CAREER_CACHE: dict[tuple[int, str], Career] = {}
_COURSE_CACHE: dict[str, Course] = {}
_PERIOD_CACHE: dict[str, Period] = {}
_SECTION_CACHE: dict[tuple[int, int, str, int | None], Section] = {}
_TEACHER_COURSE_CACHE: set[tuple[int, int]] = set()
_STUDENT_SURVEY_CACHE: dict[tuple[int, int | None, str, str, str, str], TeacherStudentSurvey] = {}
_STUDENT_SURVEY_TEACHERS_LOADED: set[int] = set()
_COMMENT_CACHE: set[tuple[int | None, str]] = set()
_COMMENT_SECTIONS_LOADED: set[int | None] = set()


def _reset_request_caches() -> None:
    _TEACHER_CACHE.clear()
    _TEACHER_BY_CODE_CACHE.clear()
    _FACULTY_CACHE.clear()
    _CAREER_CACHE.clear()
    _COURSE_CACHE.clear()
    _PERIOD_CACHE.clear()
    _SECTION_CACHE.clear()
    _TEACHER_COURSE_CACHE.clear()
    _STUDENT_SURVEY_CACHE.clear()
    _STUDENT_SURVEY_TEACHERS_LOADED.clear()
    _COMMENT_CACHE.clear()
    _COMMENT_SECTIONS_LOADED.clear()


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
        text = match.group(1).strip()
    if text.isdigit():
        return text.zfill(2)
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
        return max(0, min(100, round(number * 10)))
    return max(0, min(100, round(number)))


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


def _remember_teacher(teacher: Teacher, cache_key: tuple[str, str, str, str] | None = None) -> Teacher:
    if cache_key:
        _TEACHER_CACHE[cache_key] = teacher
    if teacher.code:
        _TEACHER_BY_CODE_CACHE[_clean_code(teacher.code).lower()] = teacher
    return teacher


def _preload_teachers_by_code(codes: set[str]) -> None:
    missing_codes = {
        _clean_code(code).lower()
        for code in codes
        if _clean_code(code) and _clean_code(code).lower() not in _TEACHER_BY_CODE_CACHE
    }
    if not missing_codes:
        return

    for teacher in Teacher.objects.filter(code__in=missing_codes):
        _remember_teacher(teacher)


def _preload_courses_by_name(course_names: set[str]) -> None:
    missing_names = {
        _normalize_match_text(name)
        for name in course_names
        if _normalize_match_text(name) and _normalize_match_text(name) not in _COURSE_CACHE
    }
    if not missing_names:
        return

    for course in Course.objects.all().only("course_id", "career_id", "name", "credits", "status"):
        course_key = _normalize_match_text(course.name or "")
        if course_key in missing_names:
            _COURSE_CACHE[course_key] = course


def _preload_teacher_course_links(descriptors: list[dict]) -> None:
    teacher_ids = set()
    course_ids = set()

    for descriptor in descriptors:
        for raw_row in descriptor["rows"]:
            row = _normalize_row({key: value for key, value in raw_row.items() if key != "__source_row_number"})
            code = _clean_code(row.get("codigo", "") or row.get("codigo_docente", ""))
            teacher_label = row.get("catedratico", "")
            if teacher_label:
                label_code, _ = _extract_code_and_name_from_label(teacher_label)
                code = code or label_code
            teacher = _TEACHER_BY_CODE_CACHE.get(code.lower()) if code else None

            course_name = _extract_course_name(row.get("curso", ""))
            course = _COURSE_CACHE.get(_normalize_match_text(course_name)) if course_name else None

            if teacher and course:
                teacher_ids.add(teacher.teacher_id)
                course_ids.add(course.course_id)

    if not teacher_ids or not course_ids:
        return

    for link in TeacherCourse.objects.filter(teacher_id__in=teacher_ids, course_id__in=course_ids):
        _TEACHER_COURSE_CACHE.add((link.teacher_id, link.course_id))


def _preload_descriptor_lookups(descriptors: list[dict]) -> None:
    codes = set()
    course_names = set()

    for descriptor in descriptors:
        for raw_row in descriptor["rows"]:
            row = _normalize_row({key: value for key, value in raw_row.items() if key != "__source_row_number"})
            code = _clean_code(row.get("codigo", "") or row.get("codigo_docente", ""))
            teacher_label = row.get("catedratico", "")
            if teacher_label:
                label_code, _ = _extract_code_and_name_from_label(teacher_label)
                code = code or label_code
            if code:
                codes.add(code)

            course_name = _extract_course_name(row.get("curso", ""))
            if course_name:
                course_names.add(course_name)

    _preload_teachers_by_code(codes)
    _preload_courses_by_name(course_names)
    _preload_teacher_course_links(descriptors)


def _get_or_create_teacher(row: dict) -> Teacher:
    email = row.get("email", "").strip().lower()
    code = _clean_code(row.get("codigo_docente", "") or row.get("code", ""))
    first_name, last_name = _split_full_name(row.get("nombre_profesor", ""))
    cache_key = (
        code.lower(),
        email,
        _normalize_match_text(first_name),
        _normalize_match_text(last_name),
    )
    cached_teacher = _TEACHER_CACHE.get(cache_key)
    if cached_teacher:
        return cached_teacher

    if code:
        cached_by_code = _TEACHER_BY_CODE_CACHE.get(code.lower())
        if cached_by_code:
            updated_fields = []
            if first_name and not cached_by_code.first_name:
                cached_by_code.first_name = first_name
                updated_fields.append("first_name")
            if last_name and not cached_by_code.last_name:
                cached_by_code.last_name = last_name
                updated_fields.append("last_name")
            if email and not cached_by_code.email:
                cached_by_code.email = email
                updated_fields.append("email")
            if updated_fields:
                cached_by_code.updated_at = timezone.now()
                updated_fields.append("updated_at")
                cached_by_code.save(update_fields=updated_fields)
            return _remember_teacher(cached_by_code, cache_key)

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
        return _remember_teacher(teacher, cache_key)

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
        return _remember_teacher(teacher, cache_key)

    teacher = Teacher.objects.filter(first_name__iexact=first_name, last_name__iexact=last_name).first()
    if teacher:
        return _remember_teacher(teacher, cache_key)

    teacher = Teacher.objects.create(
        first_name=first_name,
        last_name=last_name,
        status="ACTIVE",
        role="teacher",
        created_at=now,
        updated_at=now,
    )
    return _remember_teacher(teacher, cache_key)


def _get_or_create_course(row: dict) -> Course | None:
    course_name = _normalize_value(row.get("curso", ""))
    if not course_name:
        return None

    course_key = _normalize_match_text(course_name)
    cached_course = _COURSE_CACHE.get(course_key)
    if cached_course:
        return cached_course

    faculty_name = _normalize_value(row.get("facultad", "")) or "Carga masiva"
    career_name = _normalize_value(row.get("carrera", "")) or "General"

    faculty_key = _normalize_match_text(faculty_name)
    faculty = _FACULTY_CACHE.get(faculty_key)
    if not faculty:
        faculty, _ = Faculty.objects.get_or_create(
            name=faculty_name,
            defaults={"status": "active"},
        )
        _FACULTY_CACHE[faculty_key] = faculty

    career_key = (faculty.faculty_id, _normalize_match_text(career_name))
    career = _CAREER_CACHE.get(career_key)
    if not career:
        career, _ = Career.objects.get_or_create(
            faculty=faculty,
            name=career_name,
            defaults={"status": "active"},
        )
        _CAREER_CACHE[career_key] = career

    course = Course.objects.filter(name__iexact=course_name).order_by("course_id").first()
    if course:
        _COURSE_CACHE[course_key] = course
        return course

    course, _ = Course.objects.get_or_create(
        career=career,
        name=course_name,
        defaults={
            "credits": None,
            "status": "active",
        },
    )
    _COURSE_CACHE[course_key] = course
    return course


def _link_teacher_course(teacher: Teacher, row: dict) -> None:
    course = _get_or_create_course(row)
    if not course:
        return

    _ensure_teacher_course(teacher, course)


def _ensure_teacher_course(teacher: Teacher, course: Course) -> None:
    cache_key = (teacher.teacher_id, course.course_id)
    if cache_key in _TEACHER_COURSE_CACHE:
        return

    TeacherCourse.objects.get_or_create(
        teacher=teacher,
        course=course,
    )
    _TEACHER_COURSE_CACHE.add(cache_key)


def _resolve_survey_course_and_section(row: dict) -> tuple[Course | None, str]:
    course = _get_or_create_course(row)
    section = _extract_section(row.get("seccion", ""))
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


def _bulk_sync_pending_comment_ratings(sync_items: list[tuple[int, int, str, int]]) -> None:
    if not sync_items:
        return

    deduped = list(dict.fromkeys(sync_items))
    values_sql = ", ".join(["(%s, %s, %s, %s)"] * len(deduped))
    params = []
    for teacher_id, course_id, section, rating in deduped:
        params.extend([teacher_id, course_id, section or "", rating])

    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            UPDATE teacher_student_survey AS survey
            SET rating = incoming.rating,
                updated_at = %s
            FROM (VALUES {values_sql}) AS incoming(teacher_id, course_id, section, rating)
            WHERE survey.author = 'Estudiante'
              AND survey.status = 'active'
              AND survey.rating IS NULL
              AND survey.teacher_id = incoming.teacher_id
              AND survey.course_id = incoming.course_id
              AND COALESCE(survey.section, '') = incoming.section
            """,
            [timezone.now()] + params,
        )


def _survey_date_key(value) -> str:
    return value.isoformat() if value else ""


def _survey_cache_key(
    teacher: Teacher,
    course: Course | None,
    section: str | None,
    author: str,
    opinion: str,
    opinion_date,
) -> tuple[int, int | None, str, str, str, str]:
    return (
        teacher.teacher_id,
        course.course_id if course else None,
        section or "",
        author,
        opinion,
        _survey_date_key(opinion_date),
    )


def _preload_teacher_surveys(teacher: Teacher) -> None:
    if teacher.teacher_id in _STUDENT_SURVEY_TEACHERS_LOADED:
        return

    for survey in TeacherStudentSurvey.objects.filter(teacher=teacher).select_related("course"):
        _STUDENT_SURVEY_CACHE[
            _survey_cache_key(
                survey.teacher,
                survey.course,
                survey.section,
                survey.author,
                survey.opinion,
                survey.opinion_date,
            )
        ] = survey
    _STUDENT_SURVEY_TEACHERS_LOADED.add(teacher.teacher_id)


def _get_table_columns(table_name: str) -> set[str]:
    cached_columns = _TABLE_COLUMNS_CACHE.get(table_name)
    if cached_columns is not None:
        return cached_columns

    with connection.cursor() as cursor:
        description = connection.introspection.get_table_description(cursor, table_name)
    columns = {column.name for column in description}
    _TABLE_COLUMNS_CACHE[table_name] = columns
    return columns


def _get_comment_table_columns() -> set[str]:
    return _get_table_columns("comment")


def _get_or_create_workload_section(
    course: Course | None,
    section_code: str,
    teacher: Teacher | None = None,
) -> Section | None:
    if not course:
        return None

    period_name = "Carga masiva"
    period = _PERIOD_CACHE.get(period_name)
    if not period:
        period, _ = Period.objects.get_or_create(
            name=period_name,
            defaults={"status": "active"},
        )
        _PERIOD_CACHE[period_name] = period

    section_columns = _get_table_columns("section")
    section_key = (
        course.course_id,
        period.period_id,
        section_code or "",
        teacher.teacher_id if teacher else None,
    )
    cached_section = _SECTION_CACHE.get(section_key)
    if cached_section:
        return cached_section

    if "name" in section_columns:
        with connection.cursor() as cursor:
            where_sql = """
                course_id = %s
                AND period_id = %s
                AND COALESCE(section_code, '') = %s
            """
            select_params = [course.course_id, period.period_id, section_code or ""]
            if "teacher_id" in section_columns and teacher:
                where_sql += " AND teacher_id = %s"
                select_params.append(teacher.teacher_id)

            cursor.execute(
                f"""
                SELECT section_id
                FROM section
                WHERE {where_sql}
                LIMIT 1
                """,
                select_params,
            )
            existing = cursor.fetchone()
            if existing:
                section = Section.objects.get(section_id=existing[0])
                _SECTION_CACHE[section_key] = section
                return section

            insert_columns = ["course_id", "period_id", "section_code", "status", "name"]
            insert_values = ["%s", "%s", "%s", "%s", "%s"]
            insert_params = [
                course.course_id,
                period.period_id,
                section_code or "",
                "active",
                f"{course.name} {section_code or ''}".strip(),
            ]

            if "modality" in section_columns:
                insert_columns.append("modality")
                insert_values.append("%s")
                insert_params.append(None)
            if "academic_term" in section_columns:
                insert_columns.append("academic_term")
                insert_values.append("%s")
                insert_params.append("Carga masiva")
            if "teacher_id" in section_columns and teacher:
                insert_columns.append("teacher_id")
                insert_values.append("%s")
                insert_params.append(teacher.teacher_id)
            if "created_at" in section_columns:
                insert_columns.append("created_at")
                insert_values.append("%s")
                insert_params.append(timezone.now())
            if "updated_at" in section_columns:
                insert_columns.append("updated_at")
                insert_values.append("%s")
                insert_params.append(timezone.now())

            cursor.execute(
                f"""
                INSERT INTO section ({", ".join(insert_columns)})
                VALUES ({", ".join(insert_values)})
                RETURNING section_id
                """,
                insert_params,
            )
            section_id = cursor.fetchone()[0]
        section = Section.objects.get(section_id=section_id)
        _SECTION_CACHE[section_key] = section
        return section

    section, _ = Section.objects.get_or_create(
        course=course,
        period=period,
        section_code=section_code or "",
        defaults={
            "modality": None,
            "status": "active",
        },
    )
    _SECTION_CACHE[section_key] = section
    return section


def _get_or_create_academic_load(teacher: Teacher, section: Section | None) -> Academicload | None:
    if not section:
        return None

    academic_load, _ = Academicload.objects.get_or_create(
        teacher=teacher,
        section=section,
        defaults={
            "assigned_hours": None,
            "status": "active",
        },
    )
    return academic_load


def _insert_comment_text(section: Section | None, text: str) -> None:
    columns = _get_comment_table_columns()

    if "text" not in columns:
        return

    section_id = section.section_id if section and "section_id" in columns else None
    if section_id not in _COMMENT_SECTIONS_LOADED:
        with connection.cursor() as cursor:
            if "section_id" in columns:
                if section_id is None:
                    cursor.execute('SELECT "text" FROM "comment" WHERE "section_id" IS NULL')
                else:
                    cursor.execute('SELECT "text" FROM "comment" WHERE "section_id" = %s', [section_id])
            else:
                cursor.execute('SELECT "text" FROM "comment"')
            for (existing_text,) in cursor.fetchall():
                _COMMENT_CACHE.add((section_id, existing_text))
        _COMMENT_SECTIONS_LOADED.add(section_id)

    comment_key = (section_id, text)
    if comment_key in _COMMENT_CACHE:
        return

    with connection.cursor() as cursor:
        insert_columns = ['"text"']
        insert_values = ["%s"]
        insert_params = [text]

        if "created_at" in columns:
            insert_columns.append('"created_at"')
            insert_values.append("%s")
            insert_params.append(timezone.now())
        if "sentiment_type" in columns:
            insert_columns.append('"sentiment_type"')
            insert_values.append("%s")
            insert_params.append("pending_analysis")
        if "is_true_sentiment" in columns:
            insert_columns.append('"is_true_sentiment"')
            insert_values.append("%s")
            insert_params.append(False)
        if "section_id" in columns and section:
            insert_columns.append('"section_id"')
            insert_values.append("%s")
            insert_params.append(section.section_id)

        cursor.execute(
            f'INSERT INTO "comment" ({", ".join(insert_columns)}) VALUES ({", ".join(insert_values)})',
            insert_params,
        )
    _COMMENT_CACHE.add(comment_key)


def _persist_student_comment(teacher: Teacher, row: dict) -> None:
    text = _normalize_value(row.get("opinion", ""))
    if not text:
        return

    course, section_code = _resolve_survey_course_and_section(row)
    section = _get_or_create_workload_section(course, section_code, teacher)
    columns = _get_comment_table_columns()

    if "text" in columns:
        _insert_comment_text(section, text)
        return

    academic_load = _get_or_create_academic_load(teacher, section)
    if not academic_load:
        return

    Comment.objects.update_or_create(
        academic_load=academic_load,
        content=text,
        defaults={
            "source_type": "student_feedback",
            "created_at": timezone.now(),
            "status": "active",
            "tag": "student_comment",
        },
    )


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
        opinion_date = row.get("fecha_opinion") or None
        survey_key = _survey_cache_key(
            teacher,
            course,
            section,
            row["autor"],
            row["opinion"],
            opinion_date,
        )
        survey = _STUDENT_SURVEY_CACHE.get(survey_key)
        if not survey:
            filters = {
                "teacher": teacher,
                "course": course,
                "section": section or None,
                "author": row["autor"],
                "opinion": row["opinion"],
            }
            if opinion_date:
                filters["opinion_date"] = opinion_date
            else:
                filters["opinion_date__isnull"] = True

            survey = TeacherStudentSurvey.objects.filter(**filters).first()
            if not survey:
                survey = TeacherStudentSurvey.objects.create(
                    teacher=teacher,
                    course=course,
                    section=section or None,
                    author=row["autor"],
                    opinion=row["opinion"],
                    rating=row["calificacion"],
                    opinion_date=opinion_date,
                    status="active",
                )
            _STUDENT_SURVEY_CACHE[survey_key] = survey

        if survey:
            updated_fields = []
            if survey.rating != row["calificacion"]:
                survey.rating = row["calificacion"]
                updated_fields.append("rating")
            if survey.status != "active":
                survey.status = "active"
                updated_fields.append("status")
            if updated_fields:
                survey.updated_at = timezone.now()
                updated_fields.append("updated_at")
                survey.save(update_fields=updated_fields)

        if course:
            _ensure_teacher_course(teacher, course)
        if row["autor"] == "Sistema de evaluación estudiantil":
            _sync_pending_comment_ratings(teacher, course, section or None, survey.rating)
        elif row["autor"] == "Estudiante":
            _persist_student_comment(teacher, row)

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


def _create_batch(category: str, filename: str, extension: str, total_rows: int) -> BulkUploadBatch:
    batch = BulkUploadBatch.objects.create(
        category=category,
        source_filename=filename,
        source_extension=extension,
        status="processed",
        total_rows=total_rows,
        summary={},
    )
    batch._record_buffer = []
    return batch


def _save_batch_record(
    batch: BulkUploadBatch,
    row_number: int,
    status: str,
    raw_data: dict,
    normalized_data: dict | None = None,
    error_message: str = "",
):
    record = BulkUploadRecord(
        batch=batch,
        row_number=row_number,
        status=status,
        raw_data=raw_data,
        normalized_data=normalized_data or {},
        error_message=error_message,
    )
    record_buffer = getattr(batch, "_record_buffer", None)
    if record_buffer is None:
        record.save()
    else:
        record_buffer.append(record)


def _flush_batch_records(batch: BulkUploadBatch) -> None:
    record_buffer = getattr(batch, "_record_buffer", None)
    if record_buffer:
        BulkUploadRecord.objects.bulk_create(record_buffer)
        batch._record_buffer = []


def _finalize_batch(
    batch: BulkUploadBatch,
    valid_rows: int,
    invalid_rows: int,
    errors: list[dict],
    teacher_ids: set[int],
):
    _flush_batch_records(batch)

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
            code: max(0, min(100, round(sum(values) / len(values))))
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
            code: max(0, min(100, round(sum(values) / len(values))))
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
            code: max(0, min(100, round(sum(values) / len(values))))
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
    survey_creates = []
    survey_updates = []
    pending_rating_syncs = []

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
            teacher = _get_or_create_teacher(survey_row)
            course, section_code = _resolve_survey_course_and_section(survey_row)
            if course:
                _ensure_teacher_course(teacher, course)

            opinion_date = survey_row.get("fecha_opinion") or None
            survey_key = _survey_cache_key(
                teacher,
                course,
                section_code,
                "Sistema de evaluación estudiantil",
                survey_row["opinion"],
                opinion_date,
            )
            survey = _STUDENT_SURVEY_CACHE.get(survey_key)
            if not survey:
                filters = {
                    "teacher": teacher,
                    "course": course,
                    "section": section_code or None,
                    "author": "Sistema de evaluación estudiantil",
                    "opinion": survey_row["opinion"],
                }
                if opinion_date:
                    filters["opinion_date"] = opinion_date
                else:
                    filters["opinion_date__isnull"] = True
                survey = TeacherStudentSurvey.objects.filter(**filters).first()

            if survey:
                updated_fields = False
                if survey.rating != rating:
                    survey.rating = rating
                    updated_fields = True
                if survey.status != "active":
                    survey.status = "active"
                    updated_fields = True
                if updated_fields:
                    survey.updated_at = timezone.now()
                    survey_updates.append(survey)
                _STUDENT_SURVEY_CACHE[survey_key] = survey
            else:
                survey = TeacherStudentSurvey(
                    teacher=teacher,
                    course=course,
                    section=section_code or None,
                    author="Sistema de evaluación estudiantil",
                    opinion=survey_row["opinion"],
                    rating=rating,
                    opinion_date=opinion_date,
                    status="active",
                )
                survey_creates.append(survey)
                _STUDENT_SURVEY_CACHE[survey_key] = survey

            if course and rating is not None:
                pending_rating_syncs.append((teacher.teacher_id, course.course_id, section_code or "", rating))

            teacher_ids.add(teacher.teacher_id)
            valid_rows += 1
            _save_batch_record(batch, row_number, "valid", row, survey_row, "")
        except Exception as exc:
            invalid_rows += 1
            error_message = f"No se pudo persistir en tablas de dominio: {str(exc)}"
            errors.append({"row_number": row_number, "error": error_message})
            _save_batch_record(batch, row_number, "invalid", row, {}, error_message)

    if survey_creates:
        TeacherStudentSurvey.objects.bulk_create(survey_creates)
    if survey_updates:
        TeacherStudentSurvey.objects.bulk_update(survey_updates, ["rating", "status", "updated_at"])
    _bulk_sync_pending_comment_ratings(pending_rating_syncs)

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
    survey_creates = []
    comment_creates = []
    survey_updates = []
    survey_scope_cache = {}
    now = timezone.now()

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
            teacher = _get_or_create_teacher(survey_row)
            course, section_code = _resolve_survey_course_and_section(survey_row)
            section = _get_or_create_workload_section(course, section_code, teacher)
            if course:
                _ensure_teacher_course(teacher, course)

            opinion_date = survey_row.get("fecha_opinion") or None
            survey_scope_key = (
                teacher.teacher_id,
                course.course_id if course else None,
                section_code or "",
                "Estudiante",
                opinion_date or "",
            )
            existing_opinions = survey_scope_cache.get(survey_scope_key)
            if existing_opinions is None:
                filters = {
                    "teacher": teacher,
                    "course": course,
                    "section": section_code or None,
                    "author": "Estudiante",
                }
                if opinion_date:
                    filters["opinion_date"] = opinion_date
                else:
                    filters["opinion_date__isnull"] = True
                existing_opinions = {
                    opinion
                    for opinion in TeacherStudentSurvey.objects.filter(**filters).values_list("opinion", flat=True)
                }
                survey_scope_cache[survey_scope_key] = existing_opinions

            survey_key = _survey_cache_key(teacher, course, section_code, "Estudiante", comment, opinion_date)
            existing_survey = _STUDENT_SURVEY_CACHE.get(survey_key)
            if existing_survey and existing_survey.rating != rating:
                existing_survey.rating = rating
                existing_survey.status = "active"
                existing_survey.updated_at = now
                survey_updates.append(existing_survey)
            elif comment not in existing_opinions:
                survey = TeacherStudentSurvey(
                    teacher=teacher,
                    course=course,
                    section=section_code or None,
                    author="Estudiante",
                    opinion=comment,
                    rating=rating,
                    opinion_date=opinion_date,
                    status="active",
                )
                survey_creates.append(survey)
                _STUDENT_SURVEY_CACHE[survey_key] = survey
                existing_opinions.add(comment)

            columns = _get_comment_table_columns()
            if "text" in columns and section:
                section_id = section.section_id
                if section_id not in _COMMENT_SECTIONS_LOADED:
                    with connection.cursor() as cursor:
                        cursor.execute('SELECT "text" FROM "comment" WHERE "section_id" = %s', [section_id])
                        for (existing_text,) in cursor.fetchall():
                            _COMMENT_CACHE.add((section_id, existing_text))
                    _COMMENT_SECTIONS_LOADED.add(section_id)

                comment_key = (section_id, comment)
                if comment_key not in _COMMENT_CACHE:
                    comment_creates.append(
                        Comment(
                            section=section,
                            text=comment,
                            sentiment_type="pending_analysis",
                            is_true_sentiment=False,
                            created_at=now,
                        )
                    )
                    _COMMENT_CACHE.add(comment_key)

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

    if survey_creates:
        TeacherStudentSurvey.objects.bulk_create(survey_creates)
    if survey_updates:
        TeacherStudentSurvey.objects.bulk_update(survey_updates, ["rating", "status", "updated_at"])
    if comment_creates:
        Comment.objects.bulk_create(comment_creates)

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

    batch = _create_batch(category, filename, extension, len(raw_rows))

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

        _save_batch_record(batch, row_number, status, normalized_row, normalized_data, error_to_save)

    _flush_batch_records(batch)
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



class BulkUploadServiceError(ValueError):
    pass


def _validate_upload_file(file_obj):
    filename = file_obj.name
    extension = f".{filename.split('.')[-1].lower()}" if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise BulkUploadServiceError(
            f"Archivo no permitido: {filename}. Solo .csv, .xlsx o .xls."
        )

    if file_obj.size > MAX_FILE_SIZE_BYTES:
        raise BulkUploadServiceError(
            f"Archivo demasiado grande: {filename}. Maximo 10MB."
        )

    return filename, extension


def _build_file_descriptor(file_obj) -> dict:
    filename, extension = _validate_upload_file(file_obj)
    try:
        rows = _parse_file_rows(file_obj, extension)
    except Exception as exc:
        raise BulkUploadServiceError(f"No se pudo leer {filename}: {str(exc)}") from exc

    return {
        "file": file_obj,
        "filename": filename,
        "extension": extension,
        "rows": rows,
        "kind": _detect_file_kind(filename, rows),
    }


def _process_group_descriptor(category: str, descriptor: dict, evaluation_context: dict) -> dict:
    kind = descriptor["kind"]

    if category == "credenciales":
        if kind == "nomina":
            _, result = _process_file("titulos", descriptor["file"])
            result["detected_type"] = "nomina"
            result["saved_as"] = "titulos"
            return result
        if kind == "ceat":
            return _process_ceat_descriptor(descriptor)
        if kind == "control_docente":
            return _unsupported_group_result(
                descriptor["file"],
                kind,
                "Control docente no tiene tabla de dominio destino en la DB actual.",
            )
        if kind == "pensum":
            return _unsupported_group_result(
                descriptor["file"],
                kind,
                "Pensum no pertenece al flujo de portafolio docente.",
            )
        return _unsupported_group_result(
            descriptor["file"],
            kind,
            "El archivo no corresponde al grupo de portafolio profesional.",
        )

    if kind == "evaluacion_docente":
        return _process_evaluacion_docente_descriptor(descriptor)
    if kind == "comentarios":
        return _process_comentarios_descriptor(descriptor, evaluation_context)
    return _unsupported_group_result(
        descriptor["file"],
        kind,
        "El archivo no corresponde al grupo de evaluaciones estudiantiles.",
    )


def _process_single_descriptor(category: str, descriptor: dict) -> dict:
    with transaction.atomic():
        if category == "encuestas" and descriptor["kind"] == "evaluacion_docente":
            return _process_evaluacion_docente_descriptor(descriptor)
        if category == "encuestas" and descriptor["kind"] == "comentarios":
            return _process_comentarios_descriptor(
                descriptor,
                _merge_evaluation_context(_build_evaluation_context_from_db(), {}),
            )
        if category == "meritos" and descriptor["kind"] == "ceat":
            return _process_ceat_descriptor(descriptor)
        _, result = _process_file(category, descriptor["file"])
        return result


def process_bulk_upload(category: str, files) -> dict:
    _reset_request_caches()

    if category not in ALLOWED_CATEGORIES and category not in GROUP_CATEGORIES:
        raise BulkUploadServiceError(
            "Categoria invalida. Usa: titulos, meritos, opiniones, encuestas, credenciales o evaluaciones."
        )

    if not files:
        raise BulkUploadServiceError("No se recibieron archivos.")

    descriptors = [_build_file_descriptor(file_obj) for file_obj in files]
    _preload_descriptor_lookups(descriptors)
    results = []

    if category in GROUP_CATEGORIES:
        evaluation_context = _merge_evaluation_context(
            _build_evaluation_context_from_db(),
            _build_evaluation_context(
                [descriptor for descriptor in descriptors if descriptor["kind"] == "evaluacion_docente"]
            ),
        )

        for descriptor in descriptors:
            try:
                results.append(_process_group_descriptor(category, descriptor, evaluation_context))
            except Exception as exc:
                raise BulkUploadServiceError(
                    f"No se pudo procesar {descriptor['filename']}: {str(exc)}"
                ) from exc
    else:
        for descriptor in descriptors:
            try:
                results.append(_process_single_descriptor(category, descriptor))
            except Exception as exc:
                raise BulkUploadServiceError(
                    f"No se pudo procesar {descriptor['filename']}: {str(exc)}"
                ) from exc

    return {
        "ok": True,
        "message": "Carga masiva procesada.",
        "category": category,
        "total_files": len(results),
        "results": results,
    }
