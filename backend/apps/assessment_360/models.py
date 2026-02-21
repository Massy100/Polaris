from django.db import models


class Evaluationcriterion(models.Model):
    criterion_id = models.BigAutoField(primary_key=True)
    name = models.CharField(unique=True, max_length=80, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    display_order = models.IntegerField(blank=True, null=True)

    class Meta:
        db_table = 'evaluationcriterion'


class Weightconfig(models.Model):
    weight_config_id = models.BigAutoField(primary_key=True)
    period = models.ForeignKey('academic_workload.Period', models.DO_NOTHING)
    name = models.CharField(max_length=120, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'weightconfig'


class WeightconfigCriterion(models.Model):
    weight_config = models.OneToOneField(
        Weightconfig,
        models.DO_NOTHING,
        primary_key=True,
    )  # Composite PK (weight_config_id, criterion_id): inspectdb keeps first column.
    criterion = models.ForeignKey(Evaluationcriterion, models.DO_NOTHING)
    percentage = models.DecimalField(max_digits=6, decimal_places=2, blank=True, null=True)

    class Meta:
        db_table = 'weightconfig_criterion'
        unique_together = (('weight_config', 'criterion'),)
