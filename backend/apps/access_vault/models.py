from django.db import models

class IdentityCredential(models.Model):
    STATUS_OPTIONS = [
        ('WAITING', 'En Espera'),
        ('APPROVED', 'Acceso Concedido'),
        ('DENIED', 'Acceso Denegado'),
    ]
    
    ROLE_OPTIONS = [
        ('GATEKEEPER_ADMIN', 'Administrador Maestro'),
        ('STAFF_COORDINATOR', 'Coordinador de Staff'),
    ]

    vault_id = models.BigAutoField(primary_key=True)
    clerk_id = models.CharField(max_length=255, unique=True, null=True, blank=True)
    email = models.EmailField(unique=True, max_length=255)
    full_identity_name = models.CharField(max_length=200, blank=True, null=True)
    registration_status = models.CharField(max_length=20, choices=STATUS_OPTIONS, default='WAITING')
    access_level = models.CharField(max_length=30, choices=ROLE_OPTIONS, default='STAFF_COORDINATOR')
    moment_created = models.DateTimeField(auto_now_add=True)
    moment_updated = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vault_identity_credentials'

    def __str__(self):
        return self.email

class VaultProfile(models.Model):
    profile_id = models.BigAutoField(primary_key=True)
    credential = models.OneToOneField(IdentityCredential, on_delete=models.CASCADE, related_name='profile')
    contact_phone = models.CharField(max_length=25, blank=True, null=True)
    org_unit = models.CharField(max_length=150, blank=True, null=True)
    identification_code = models.CharField(max_length=50, blank=True, null=True)
    start_date = models.DateField(blank=True, null=True)
    
    class Meta:
        db_table = 'vault_user_profiles'

    def __str__(self):
        return self.credential.email
