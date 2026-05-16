from apps.academic_workload.models import Academicload, Comment, Section, TeacherCourseScore


def _score_map(teacher_ids, course_ids, period_ids):
    if not teacher_ids or not course_ids or not period_ids:
        return {}

    return {
        (score.teacher_id, score.course_id, score.period_id): score
        for score in TeacherCourseScore.objects.filter(
            teacher_id__in=teacher_ids,
            course_id__in=course_ids,
            period_id__in=period_ids,
        )
    }


def _comment_count_map(section_ids):
    if not section_ids:
        return {}

    counts = {}
    for row in Comment.objects.filter(section_id__in=section_ids).values('section_id'):
        section_id = row['section_id']
        counts[section_id] = counts.get(section_id, 0) + 1
    return counts


def _academic_load_map(teacher_ids, section_ids):
    if not teacher_ids or not section_ids:
        return {}

    return {
        (load.teacher_id, load.section_id): load
        for load in Academicload.objects.filter(
            teacher_id__in=teacher_ids,
            section_id__in=section_ids,
        )
    }


def _section_payload(section, teacher, score=None, academic_load=None, comments_count=0):
    course = section.course
    period = section.period
    return {
        'course_id': course.course_id,
        'name': course.name,
        'credits': course.credits,
        'status': course.status,
        'teacher_id': teacher.teacher_id,
        'teacher_name': teacher.full_name,
        'section_id': section.section_id,
        'section_code': section.section_code,
        'period_id': period.period_id,
        'period_name': period.name,
        'term': period.name or 'Sin periodo',
        'modality': section.modality,
        'assigned_hours': academic_load.assigned_hours if academic_load else None,
        'final_score': score.final_score if score else None,
        'comments_count': comments_count,
    }


def build_teacher_history(teacher):
    direct_sections = Section.objects.filter(teacher=teacher)
    load_sections = Section.objects.filter(academicload__teacher=teacher)
    sections = list(
        (direct_sections | load_sections)
        .select_related('course', 'period')
        .distinct()
        .order_by('-period__start_date', 'course__name', 'section_code')
    )

    if not sections:
        return [
            {
                'course_id': course.course_id,
                'name': course.name,
                'credits': course.credits,
                'status': course.status,
                'term': 'Histórico',
                'final_score': None,
                'comments_count': 0,
            }
            for course in teacher.courses.all()
        ]

    teacher_ids = [teacher.teacher_id]
    course_ids = [section.course_id for section in sections]
    period_ids = [section.period_id for section in sections]
    section_ids = [section.section_id for section in sections]
    scores = _score_map(teacher_ids, course_ids, period_ids)
    comment_counts = _comment_count_map(section_ids)
    academic_loads = _academic_load_map(teacher_ids, section_ids)

    return [
        _section_payload(
            section=section,
            teacher=teacher,
            score=scores.get((teacher.teacher_id, section.course_id, section.period_id)),
            academic_load=academic_loads.get((teacher.teacher_id, section.section_id)),
            comments_count=comment_counts.get(section.section_id, 0),
        )
        for section in sections
    ]


def build_course_history(course):
    sections = list(
        Section.objects
        .filter(course=course)
        .select_related('teacher', 'period', 'course')
        .prefetch_related('academicload_set__teacher')
        .order_by('-period__start_date', 'teacher__last_name', 'teacher__first_name', 'section_code')
    )

    if not sections:
        return [
            {
                'teacher_id': teacher.teacher_id,
                'first_name': teacher.first_name,
                'last_name': teacher.last_name,
                'full_name': teacher.full_name,
                'email': teacher.email,
                'status': teacher.status,
                'term': 'Histórico',
                'final_score': None,
                'comments_count': 0,
            }
            for teacher in course.teacher_set.all()
        ]

    rows = []
    teacher_ids = set()
    section_ids = [section.section_id for section in sections]
    period_ids = [section.period_id for section in sections]

    for section in sections:
        if section.teacher_id:
            teacher_ids.add(section.teacher_id)
        for load in section.academicload_set.all():
            teacher_ids.add(load.teacher_id)

    scores = _score_map(list(teacher_ids), [course.course_id], period_ids)
    comment_counts = _comment_count_map(section_ids)

    for section in sections:
        section_teachers = []
        if section.teacher:
            section_teachers.append((section.teacher, None))
        section_teachers.extend((load.teacher, load) for load in section.academicload_set.all())

        seen_teachers = set()
        for teacher, academic_load in section_teachers:
            if teacher.teacher_id in seen_teachers:
                continue
            seen_teachers.add(teacher.teacher_id)

            score = scores.get((teacher.teacher_id, course.course_id, section.period_id))
            row = _section_payload(
                section=section,
                teacher=teacher,
                score=score,
                academic_load=academic_load,
                comments_count=comment_counts.get(section.section_id, 0),
            )
            row.update({
                'first_name': teacher.first_name,
                'last_name': teacher.last_name,
                'full_name': teacher.full_name,
                'email': teacher.email,
                'status': teacher.status,
            })
            rows.append(row)

    return rows
