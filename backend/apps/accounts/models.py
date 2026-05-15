from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone

class User(models.Model):
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('suspended', 'Suspendido'),
    ]
    
    ROLE_CHOICES = [
        ('super_admin', 'Super Administrador'),
        ('user', 'Usuario'),
    ]
    
    user_id = models.BigAutoField(primary_key=True)
    clerk_id = models.CharField(max_length=255, unique=True, blank=True, null=True, db_index=True)
    username = models.CharField(unique=True, max_length=80, blank=True, null=True, db_index=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True, unique=True, db_index=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', blank=True, null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user', blank=True, null=True)
    
    # Campos de auditoría
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    last_login = models.DateTimeField(blank=True, null=True)
    
    # Sincronización con Clerk
    clerk_synced_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'User'
        managed = True
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        indexes = [
            models.Index(fields=['clerk_id']),
            models.Index(fields=['email']),
            models.Index(fields=['username']),
        ]
    
    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)
    
    def update_last_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])
    
    def is_super_admin(self):
        return self.role == 'super_admin'
    
    def __str__(self):
        return self.username or str(self.user_id)


class AccessRequest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('approved', 'Aprobado'),
        ('rejected', 'Rechazado'),
    ]
    
    request_id = models.BigAutoField(primary_key=True)
    clerk_id = models.CharField(max_length=255, db_index=True)
    email = models.EmailField(max_length=255, db_index=True)
    username = models.CharField(max_length=80, blank=True, null=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', db_index=True)
    requested_role = models.CharField(
        max_length=20,
        choices=User.ROLE_CHOICES,
        default='user'
    )
    
    # Usuario que aprobó/rechazó
    processed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='access_decisions'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    processed_at = models.DateTimeField(blank=True, null=True)
    
    class Meta:
        db_table = 'access_request'
        managed = True
        verbose_name = 'Solicitud de Acceso'
        verbose_name_plural = 'Solicitudes de Acceso'
        indexes = [
            models.Index(fields=['clerk_id', 'status']),
            models.Index(fields=['email', 'status']),
            models.Index(fields=['created_at']),
        ]
        unique_together = [['clerk_id', 'email']]
    
    def approve(self, approved_by_user):
        """Aprueba la solicitud de acceso y crea el usuario"""
        # Crear usuario
        user = User.objects.create(
            clerk_id=self.clerk_id,
            email=self.email,
            username=self.username or self.email.split('@')[0],
            role=self.requested_role,
            status='active'
        )
        
        # Marcar solicitud como aprobada
        self.status = 'approved'
        self.processed_by = approved_by_user
        self.processed_at = timezone.now()
        self.save()
        
        return user
    
    def reject(self, rejected_by_user):
        """Rechaza la solicitud de acceso"""
        self.status = 'rejected'
        self.processed_by = rejected_by_user
        self.processed_at = timezone.now()
        self.save()
    
    def reactivate(self):
        """Reactiva una solicitud rechazada"""
        self.status = 'pending'
        self.processed_by = None
        self.processed_at = None
        self.save()
    
    def __str__(self):
        return f"{self.email} - {self.status}"


class Coordinator(models.Model):
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
    ]
    
    coordinator_id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=120, blank=True, null=True)
    last_name = models.CharField(max_length=120, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', blank=True, null=True)
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='coordinator'
    )
    
    code = models.CharField(max_length=50, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    department = models.CharField(max_length=200, blank=True, null=True)
    role = models.CharField(max_length=100, blank=True, null=True)
    since = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    
    class Meta:
        db_table = 'coordinator'
        verbose_name = 'Coordinador'
        verbose_name_plural = 'Coordinadores'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def username(self):
        return self.user.username if self.user else None
    
    @property
    def email(self):
        return self.user.email if self.user else None


class CoordinatorCareer(models.Model):
    coordinator = models.OneToOneField(
        Coordinator,
        on_delete=models.CASCADE,
        primary_key=True,
    )
    career = models.ForeignKey('academic_career.Career', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'coordinator_career'
        unique_together = (('coordinator', 'career'),)
        verbose_name = 'Coordinador - Carrera'
        verbose_name_plural = 'Coordinadores - Carreras'
    
    def __str__(self):
        return f"{self.coordinator} - {self.career}"


class CoordinatorFaculty(models.Model):
    coordinator = models.OneToOneField(
        Coordinator,
        on_delete=models.CASCADE,
        primary_key=True,
    )
    faculty = models.ForeignKey('academic_career.Faculty', on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'coordinator_faculty'
        unique_together = (('coordinator', 'faculty'),)
        verbose_name = 'Coordinador - Facultad'
        verbose_name_plural = 'Coordinadores - Facultades'
    
    def __str__(self):
        return f"{self.coordinator} - {self.faculty}"