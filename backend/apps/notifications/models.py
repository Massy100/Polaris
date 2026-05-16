from django.db import models


class Event(models.Model):
    event_id = models.BigAutoField(primary_key=True)
    event_type = models.CharField(max_length=60, blank=True, null=True)
    occurred_at = models.DateTimeField(blank=True, null=True)
    related_comment = models.ForeignKey('academic_workload.Comment', models.DO_NOTHING, blank=True, null=True)
    related_load = models.ForeignKey('academic_workload.Academicload', models.DO_NOTHING, blank=True, null=True)
    processing_status = models.CharField(max_length=20, blank=True, null=True)
    details = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'event'


class Eventsubscription(models.Model):
    subscription_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey('accounts.User', models.DO_NOTHING)
    event_type = models.CharField(max_length=60)
    channel = models.CharField(max_length=30)
    status = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        db_table = 'eventsubscription'
        unique_together = (('user', 'event_type', 'channel'),)


class Eventdelivery(models.Model):
    delivery_id = models.BigAutoField(primary_key=True)
    event = models.ForeignKey(Event, models.DO_NOTHING)
    subscription = models.ForeignKey(Eventsubscription, models.DO_NOTHING)
    delivered_at = models.DateTimeField(blank=True, null=True)
    result = models.CharField(max_length=20, blank=True, null=True)
    result_detail = models.TextField(blank=True, null=True)

    class Meta:
        db_table = 'eventdelivery'
