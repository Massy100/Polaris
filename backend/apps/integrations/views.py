from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import BulkUploadBatch, BulkUploadRecord
from .serializers import serialize_batch, serialize_record
from .services import (
    ALLOWED_EXTENSIONS,
    GROUP_CATEGORIES,
    REQUIRED_FIELDS_BY_CATEGORY,
    BulkUploadServiceError,
    process_bulk_upload,
)


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
    files = request.FILES.getlist("files")

    try:
        return JsonResponse(process_bulk_upload(category, files))
    except BulkUploadServiceError as exc:
        return JsonResponse({"ok": False, "message": str(exc)}, status=400)


@require_http_methods(["GET"])
def bulk_upload_batches(request):
    limit = request.GET.get("limit", "20")
    try:
        limit_value = max(1, min(int(limit), 100))
    except ValueError:
        limit_value = 20

    batches = BulkUploadBatch.objects.all()[:limit_value]
    return JsonResponse(
        {"ok": True, "count": len(batches), "results": [serialize_batch(batch) for batch in batches]}
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
            "results": [serialize_record(record) for record in records],
        }
    )
