from .models import BulkUploadBatch, BulkUploadRecord


def serialize_batch(batch: BulkUploadBatch) -> dict:
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


def serialize_record(record: BulkUploadRecord) -> dict:
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
