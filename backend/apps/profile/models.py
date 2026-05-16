from django.db import models

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
    
    def __str__(self):
        return self.username or str(self.user_id)
