# apps/assessment_360/models.py
from django.db import models


# 🔹 Base para reutilizar timestamps y soft delete
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True


class Evaluationcriterion(BaseModel):
    criterion_id = models.BigAutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=80, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'evaluationcriterion'


class Weightconfig(BaseModel):
    weight_config_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, default="active", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)

    class Meta:
        db_table = 'weightconfig'


class WeightconfigCriterion(BaseModel):
    weight_config = models.ForeignKey(Weightconfig, models.CASCADE)
    criterion = models.ForeignKey(Evaluationcriterion, models.CASCADE)
    percentage = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = 'weightconfig_criterion'
        unique_together = (('weight_config', 'criterion'),)