import csv
import io
import unicodedata
from datetime import datetime

from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import BulkUploadBatch, BulkUploadRecord

try:
    import openpyxl
except Exception:
    openpyxl = None

try:
    import xlrd
except Exception:
    xlrd = None


ALLOWED_CATEGORIES = {"titulos", "meritos", "opiniones"}
ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
REQUIRED_FIELDS_BY_CATEGORY = {
    "titulos": {
        "nombre_profesor",
        "email",
        "telefono",
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
}


def _normalize_key(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", (value or "").strip().lower())
    normalized = normalized.encode("ascii", "ignore").decode("ascii")
    return normalized.replace(" ", "_")


def _normalize_row(row: dict) -> dict:
    return {
        _normalize_key(str(key)): ("" if value is None else str(value).strip())
        for key, value in row.items()
    }


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
    rows_iter = sheet.iter_rows(values_only=True)
    headers = next(rows_iter, None)
    if not headers:
        return []
    parsed_headers = [str(value).strip() if value is not None else "" for value in headers]
    rows = []
    for values in rows_iter:
        row = {}
        for idx, header in enumerate(parsed_headers):
            if not header:
                continue
            cell_value = values[idx] if idx < len(values) else ""
            row[header] = "" if cell_value is None else str(cell_value)
        rows.append(row)
    workbook.close()
    return rows


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

    if category == "opiniones":
        try:
            normalized["calificacion"] = int(float(row.get("calificacion", "0")))
            if normalized["calificacion"] < 1 or normalized["calificacion"] > 10:
                raise ValueError
        except Exception:
            return False, "calificacion debe estar entre 1 y 10.", {}

    if category in {"meritos", "opiniones"}:
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

    for row_number, raw_row in enumerate(raw_rows, start=2):
        normalized_row = _normalize_row(raw_row)
        is_valid, error_message, clean_row = _validate_row(category, normalized_row)
        if is_valid:
            valid_rows += 1
            status = "valid"
            normalized_data = clean_row
            error_to_save = ""
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
    batch.summary = {"errors": errors[:50]}
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
                "required_fields_by_category": {
                    key: sorted(value) for key, value in REQUIRED_FIELDS_BY_CATEGORY.items()
                },
            }
        )

    if request.method == "OPTIONS":
        return JsonResponse({"detail": "ok"})

    category = request.POST.get("category", "").strip().lower()
    if category not in ALLOWED_CATEGORIES:
        return JsonResponse(
            {"ok": False, "message": "Categoria invalida. Usa: titulos, meritos u opiniones."},
            status=400,
        )

    files = request.FILES.getlist("files")
    if not files:
        return JsonResponse({"ok": False, "message": "No se recibieron archivos."}, status=400)

    results = []
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
            with transaction.atomic():
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
