# apps/assessment_360/models.py
from django.db import models


class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True


class Evaluationcriterion(BaseModel):
    criterion_id = models.BigAutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=80)
    description = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(default=0)

    class Meta:
        db_table = 'evaluationcriterion'
        ordering = ['display_order', 'criterion_id']

    def __str__(self):
        return self.name or f'Criterio {self.criterion_id}'


class Weightconfig(BaseModel):
    weight_config_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Activo'
        INACTIVE = 'inactive', 'Inactivo'

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.INACTIVE, 
    )

    class Meta:
        db_table = 'weightconfig'
        ordering = ['-created_at']

    def __str__(self):
        return self.name or f'Configuración {self.weight_config_id}'


class WeightconfigCriterion(BaseModel):
    weight_config = models.ForeignKey(
        Weightconfig,
        on_delete=models.CASCADE,
        related_name='criteria_weights',  
    )
    criterion = models.ForeignKey(
        Evaluationcriterion,
        on_delete=models.PROTECT,  
        related_name='weight_configs',
    )
    percentage = models.DecimalField(max_digits=6, decimal_places=2)

    class Meta:
        db_table = 'weightconfig_criterion'
        unique_together = (('weight_config', 'criterion'),)
  

    def __str__(self):
        return f'{self.weight_config} - {self.criterion}: {self.percentage}%'