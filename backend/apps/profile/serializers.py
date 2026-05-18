from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import Coordinator

class CoordinatorPersonalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coordinator
        # Añadimos coordinator_id aquí
        fields = ['coordinator_id', 'first_name', 'last_name', 'email', 'phone', 'department', 'role']
        read_only_fields = ['role', 'coordinator_id']

class CoordinatorPreferencesSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coordinator
        fields = ['email_notifications', 'system_alerts', 'weekly_report', 'two_factor']

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
