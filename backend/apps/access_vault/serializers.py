from rest_framework import serializers
from .models import IdentityCredential, VaultProfile

class VaultIdentitySerializer(serializers.ModelSerializer):
    class Meta:
        model = IdentityCredential
        fields = ['vault_id', 'clerk_id', 'email', 'full_identity_name', 'registration_status', 'access_level', 'moment_created']

class VaultProfileSerializer(serializers.ModelSerializer):
    credential_data = VaultIdentitySerializer(source='credential', read_only=True)
    class Meta:
        model = VaultProfile
        fields = ['profile_id', 'credential_data', 'contact_phone', 'org_unit', 'identification_code', 'start_date']

class AccessDecisionSerializer(serializers.ModelSerializer):
    class Meta:
        model = IdentityCredential
        fields = ['vault_id', 'email', 'full_identity_name', 'registration_status', 'access_level']
