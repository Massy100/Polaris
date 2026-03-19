import csv
import io
import json
import os
import unicodedata
from datetime import datetime

from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt

from .models import BulkUploadBatch, BulkUploadRecord

try:
    from openpyxl import load_workbook
except ImportError:  # pragma: no cover - dependency validation happens at runtime
    load_workbook = None

try:
    import xlrd
except ImportError:  # pragma: no cover - dependency validation happens at runtime
    xlrd = None


MAX_FILE_SIZE = 10 * 1024 * 1024
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
ALLOWED_CATEGORIES = {
    BulkUploadBatch.CATEGORY_TITLES: {
        "required_fields": [
            "nombre_profesor",
            "email",
            "telefono",
            "especialidad",
            "grado_academico",
            "experiencia_anos",
            "institucion_actual",
        ],
    },
    BulkUploadBatch.CATEGORY_MERITS: {
        "required_fields": [
            "nombre_profesor",
            "email",
            "tipo_merito",
            "descripcion",
            "fecha_obtencion",
            "institucion_otorgante",
        ],
    },
    BulkUploadBatch.CATEGORY_OPINIONS: {
        "required_fields": [
            "nombre_profesor",
            "email",
            "opinion",
            "calificacion",
            "fecha_opinion",
            "autor",
        ],
    },
}


def _add_cors_headers(response):
    response["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response


def _json_response(payload, status=200):
    response = JsonResponse(payload, status=status, json_dumps_params={"ensure_ascii": False})
    return _add_cors_headers(response)


def _normalize_key(value):
    value = "" if value is None else str(value)
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = value.strip().lower().replace(" ", "_")
    return value


def _normalize_value(value):
    if value is None:
        return ""
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value).strip()


def _normalize_row(row):
    normalized = {}
    for key, value in row.items():
        normalized[_normalize_key(key)] = _normalize_value(value)
    return normalized


def _parse_csv_rows(file_obj):
    file_obj.seek(0)
    content = file_obj.read().decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    return [dict(row) for row in reader]


def _parse_xlsx_rows(file_obj):
    if load_workbook is None:
        raise ValueError("Falta dependencia openpyxl para procesar .xlsx")

    file_obj.seek(0)
    workbook = load_workbook(filename=io.BytesIO(file_obj.read()), data_only=True)
    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    headers = ["" if value is None else str(value) for value in rows[0]]
    parsed = []
    for values in rows[1:]:
        if not any(value not in (None, "") for value in values):
            continue
        parsed.append(dict(zip(headers, values)))
    return parsed


def _parse_xls_rows(file_obj):
    if xlrd is None:
        raise ValueError("Falta dependencia xlrd para procesar .xls")

    file_obj.seek(0)
    workbook = xlrd.open_workbook(file_contents=file_obj.read())
    sheet = workbook.sheet_by_index(0)
    if sheet.nrows == 0:
        return []

    headers = [str(sheet.cell_value(0, column)) for column in range(sheet.ncols)]
    parsed = []
    for row_index in range(1, sheet.nrows):
        values = [sheet.cell_value(row_index, column) for column in range(sheet.ncols)]
        if not any(value not in ("", None) for value in values):
            continue
        parsed.append(dict(zip(headers, values)))
    return parsed


def _parse_rows(file_obj, extension):
    if extension == ".csv":
        return _parse_csv_rows(file_obj)
    if extension == ".xlsx":
        return _parse_xlsx_rows(file_obj)
    if extension == ".xls":
        return _parse_xls_rows(file_obj)
    raise ValueError("Formato de archivo no soportado.")


def _parse_date(value):
    if not value:
        raise ValueError("Fecha vacía.")

    formats = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y")
    for fmt in formats:
        try:
            return datetime.strptime(value, fmt).date().isoformat()
        except ValueError:
            continue
    raise ValueError("Formato de fecha inválido.")


def _validate_row(category, normalized_row):
    required_fields = ALLOWED_CATEGORIES[category]["required_fields"]
    missing_fields = [field for field in required_fields if not normalized_row.get(field)]
    if missing_fields:
        return False, f"Faltan columnas o valores requeridos: {', '.join(missing_fields)}", normalized_row

    if category == BulkUploadBatch.CATEGORY_TITLES:
        try:
            experience = float(normalized_row["experiencia_anos"])
        except ValueError as exc:
            raise ValueError("experiencia_anos debe ser numérico.") from exc
        if experience < 0:
            raise ValueError("experiencia_anos no puede ser negativo.")
        normalized_row["experiencia_anos"] = str(int(experience) if experience.is_integer() else experience)

    if category == BulkUploadBatch.CATEGORY_MERITS:
        normalized_row["fecha_obtencion"] = _parse_date(normalized_row["fecha_obtencion"])

    if category == BulkUploadBatch.CATEGORY_OPINIONS:
        try:
            rating = float(normalized_row["calificacion"])
        except ValueError as exc:
            raise ValueError("calificacion debe ser numérica.") from exc
        if rating < 1 or rating > 10:
            raise ValueError("calificacion debe estar entre 1 y 10.")
        normalized_row["calificacion"] = str(int(rating) if rating.is_integer() else rating)
        normalized_row["fecha_opinion"] = _parse_date(normalized_row["fecha_opinion"])

    return True, "", normalized_row


def _serialize_batch(batch):
    return {
        "batch_id": batch.batch_id,
        "category": batch.category,
        "source_filename": batch.source_filename,
        "total_rows": batch.total_rows,
        "valid_rows": batch.valid_rows,
        "invalid_rows": batch.invalid_rows,
        "status": batch.status,
        "summary": batch.summary,
        "created_at": batch.created_at.isoformat(),
        "processed_at": batch.processed_at.isoformat() if batch.processed_at else None,
    }


def _serialize_record(record):
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


def _process_uploaded_file(category, uploaded_file):
    extension = os.path.splitext(uploaded_file.name)[1].lower()
    rows = _parse_rows(uploaded_file, extension)

    batch = BulkUploadBatch.objects.create(
        category=category,
        source_filename=uploaded_file.name,
        total_rows=0,
        valid_rows=0,
        invalid_rows=0,
        status=BulkUploadBatch.STATUS_PENDING,
        summary={},
    )

    valid_rows = 0
    invalid_rows = 0

    with transaction.atomic():
        for row_number, row in enumerate(rows, start=2):
            normalized_row = _normalize_row(row)
            try:
                is_valid, error_message, normalized_row = _validate_row(category, normalized_row)
            except ValueError as exc:
                is_valid = False
                error_message = str(exc)

            BulkUploadRecord.objects.create(
                batch=batch,
                row_number=row_number,
                status=BulkUploadRecord.STATUS_VALID if is_valid else BulkUploadRecord.STATUS_INVALID,
                raw_data=row,
                normalized_data=normalized_row,
                error_message=error_message,
            )

            if is_valid:
                valid_rows += 1
            else:
                invalid_rows += 1

    batch.total_rows = len(rows)
    batch.valid_rows = valid_rows
    batch.invalid_rows = invalid_rows
    batch.status = (
        BulkUploadBatch.STATUS_PROCESSED
        if invalid_rows == 0
        else BulkUploadBatch.STATUS_PROCESSED_WITH_ERRORS
    )
    batch.summary = {
        "message": "Archivo procesado correctamente." if invalid_rows == 0 else "Archivo procesado con errores.",
        "rows_processed": len(rows),
    }
    batch.processed_at = timezone.now()
    batch.save(update_fields=["total_rows", "valid_rows", "invalid_rows", "status", "summary", "processed_at"])
    return batch


@csrf_exempt
def bulk_upload(request):
    if request.method == "OPTIONS":
        return _json_response({"ok": True})

    if request.method == "GET":
        return _json_response(
            {
                "ok": True,
                "endpoint": "/api/integrations/bulk-upload/",
                "allowed_methods": ["GET", "POST", "OPTIONS"],
                "allowed_extensions": sorted(ALLOWED_EXTENSIONS),
                "categories": {
                    category: config["required_fields"]
                    for category, config in ALLOWED_CATEGORIES.items()
                },
            }
        )

    if request.method != "POST":
        return _json_response({"ok": False, "error": "Método no permitido."}, status=405)

    category = request.POST.get("category", "").strip().lower()
    if category not in ALLOWED_CATEGORIES:
        return _json_response(
            {
                "ok": False,
                "error": "La categoría es obligatoria y debe ser titulos, meritos u opiniones.",
            },
            status=400,
        )

    files = request.FILES.getlist("files")
    if not files:
        return _json_response({"ok": False, "error": "No se recibieron archivos."}, status=400)

    processed_batches = []
    for uploaded_file in files:
        extension = os.path.splitext(uploaded_file.name)[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            return _json_response(
                {"ok": False, "error": f"Formato no soportado para {uploaded_file.name}."},
                status=400,
            )
        if uploaded_file.size > MAX_FILE_SIZE:
            return _json_response(
                {"ok": False, "error": f"{uploaded_file.name} excede el límite de 10 MB."},
                status=400,
            )

        try:
            batch = _process_uploaded_file(category, uploaded_file)
        except Exception as exc:  # pragma: no cover - defensive API handling
            return _json_response(
                {"ok": False, "error": f"No se pudo procesar {uploaded_file.name}: {exc}"},
                status=400,
            )
        processed_batches.append(_serialize_batch(batch))

    return _json_response(
        {
            "ok": True,
            "message": f"Se procesaron {len(processed_batches)} archivo(s).",
            "batches": processed_batches,
        }
    )


def bulk_upload_batches(request):
    if request.method == "OPTIONS":
        return _json_response({"ok": True})
    if request.method != "GET":
        return _json_response({"ok": False, "error": "Método no permitido."}, status=405)

    try:
        limit = int(request.GET.get("limit", 20))
    except ValueError:
        limit = 20

    batches = BulkUploadBatch.objects.all()[: max(limit, 1)]
    return _json_response({"ok": True, "count": len(batches), "results": [_serialize_batch(batch) for batch in batches]})


def bulk_upload_batch_records(request, batch_id):
    if request.method == "OPTIONS":
        return _json_response({"ok": True})
    if request.method != "GET":
        return _json_response({"ok": False, "error": "Método no permitido."}, status=405)

    try:
        batch = BulkUploadBatch.objects.get(batch_id=batch_id)
    except BulkUploadBatch.DoesNotExist:
        return _json_response({"ok": False, "error": "Batch no encontrado."}, status=404)

    try:
        limit = int(request.GET.get("limit", 50))
    except ValueError:
        limit = 50

    records = batch.records.all()[: max(limit, 1)]
    return _json_response(
        {
            "ok": True,
            "batch": _serialize_batch(batch),
            "count": len(records),
            "results": [_serialize_record(record) for record in records],
        }
    )
