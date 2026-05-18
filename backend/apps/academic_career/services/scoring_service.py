from django.db.models import Avg
from apps.academic_career.models import Teacher
from apps.assessment_360.models import Weightconfig, WeightconfigCriterion
from apps.academic_workload.models import TeacherCourseScore
from apps.templates.models import TeacherEvaluation

def update_teacher_global_score(teacher_id: int):
    teacher = Teacher.objects.filter(pk=teacher_id).first()
    if not teacher:
        return 0.0

    active_config = Weightconfig.objects.filter(status='active', is_deleted=False).first()
    
    avg_alumnos = TeacherCourseScore.objects.filter(teacher=teacher).aggregate(Avg('final_score'))['final_score__avg'] or 0.0
    
    avg_obs_raw = TeacherEvaluation.objects.filter(teacher=teacher).aggregate(Avg('final_score'))['final_score__avg'] or 0.0
    avg_observaciones = (float(avg_obs_raw) / 5.0) * 100.0

    if not active_config:
        teacher.score = round(avg_alumnos, 2)
        teacher.save(update_fields=['score'])
        return teacher.score

    total_global_score = 0.0
    criteria_weights = WeightconfigCriterion.objects.filter(
        weight_config=active_config, 
        is_deleted=False
    ).select_related('criterion')

    for cw in criteria_weights:
        c_name = cw.criterion.name.lower()
        percentage = float(cw.percentage) / 100.0

        if 'alumno' in c_name or 'estudiante' in c_name:
            total_global_score += float(avg_alumnos) * percentage
        elif 'observacion' in c_name or 'pares' in c_name or 'directiv' in c_name:
            total_global_score += float(avg_observaciones) * percentage

    teacher.score = round(total_global_score, 2)
    teacher.save(update_fields=['score'])
    return teacher.score
