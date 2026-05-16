from django.db import models
from django.contrib.auth import get_user_model

UserAuth = get_user_model()

class Coordinator(models.Model):
    coordinator_id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=120, null=True, blank=True)
    last_name = models.CharField(max_length=120, null=True, blank=True)
    status = models.CharField(max_length=20, default='ACTIVE')
    user = models.OneToOneField(UserAuth, on_delete=models.CASCADE, db_column='user_id')
    code = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    department = models.CharField(max_length=200, null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(max_length=100, null=True, blank=True)
    since = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    email = models.EmailField(max_length=120, unique=True)
    email_notifications = models.BooleanField(default=True)
    system_alerts = models.BooleanField(default=True)
    weekly_report = models.BooleanField(default=False)
    two_factor = models.BooleanField(default=False)

    class Meta:
        db_table = 'coordinator'
        managed = False
