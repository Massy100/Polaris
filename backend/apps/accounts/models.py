from django.db import models
from django.contrib.auth.hashers import make_password, check_password

class User(models.Model):
    STATUS_CHOICES = [
        ('active', 'Activo'),
        ('inactive', 'Inactivo'),
        ('suspended', 'Suspendido'),
    ]

    user_id = models.BigAutoField(primary_key=True)
    username = models.CharField(unique=True, max_length=80, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, blank=True, null=True)
    email = models.EmailField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'User'
        managed = True
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def set_password(self, raw_password):
        self.password_hash = make_password(raw_password)

    def check_password(self, raw_password):
        return check_password(raw_password, self.password_hash)

    def __str__(self):
        return self.username or str(self.user_id)


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
