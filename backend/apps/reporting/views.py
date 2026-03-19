from django.db.models import Count, Prefetch, Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from apps.academic_career.models import Teacher
from apps.academic_workload.models import Academicload


def _build_teacher_name(teacher):
    first_name = (teacher.first_name or "").strip()
    last_name = (teacher.last_name or "").strip()
    full_name = f"{first_name} {last_name}".strip()
    return full_name or f"Docente {teacher.teacher_id}"


@require_GET
def institutional_ranking(request):
    loads_queryset = Academicload.objects.select_related(
        "section__course__career",
    )

    teachers = (
        Teacher.objects.annotate(
            student_feedback_count=Count(
                "academicload__comment",
                filter=Q(academicload__comment__source_type__iexact="student"),
                distinct=True,
            ),
            total_feedback_count=Count("academicload__comment", distinct=True),
        )
        .prefetch_related(
            Prefetch("academicload_set", queryset=loads_queryset, to_attr="prefetched_loads")
        )
        .order_by("teacher_id")
    )

    teacher_rows = []
    max_feedback = 0

    for teacher in teachers:
        specialties = []
        specialty_seen = set()

        for load in getattr(teacher, "prefetched_loads", []):
            course = getattr(load.section, "course", None)
            if course and course.name:
                specialty_name = course.name.strip()
                if specialty_name and specialty_name not in specialty_seen:
                    specialty_seen.add(specialty_name)
                    specialties.append(specialty_name)

        students_count = teacher.student_feedback_count or teacher.total_feedback_count or 0
        max_feedback = max(max_feedback, students_count)

        teacher_rows.append(
            {
                "teacher_id": teacher.teacher_id,
                "name": _build_teacher_name(teacher),
                "students_count": students_count,
                "specialties": specialties,
            }
        )

    for row in teacher_rows:
        if max_feedback > 0:
            row["rating"] = round((row["students_count"] / max_feedback) * 5, 2)
        else:
            row["rating"] = None

    teacher_rows.sort(
        key=lambda item: (
            item["rating"] is not None,
            item["rating"] or 0,
            item["students_count"],
            item["name"],
        ),
        reverse=True,
    )

    for index, row in enumerate(teacher_rows, start=1):
        row["rank_position"] = index

    response = JsonResponse(
        {
            "ok": True,
            "score_mode": "provisional_feedback_volume",
            "score_note": (
                "La calificación es provisional y se normaliza según la cantidad "
                "de evaluaciones/comentarios registrados por docente en la base local."
            ),
            "count": len(teacher_rows),
            "results": teacher_rows,
        },
        json_dumps_params={"ensure_ascii": False},
    )
    response["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    response["Access-Control-Allow-Headers"] = "Content-Type"
    return response
