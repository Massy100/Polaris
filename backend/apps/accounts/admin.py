from django.contrib import admin
from .models import User, Coordinator, CoordinatorCareer, CoordinatorFaculty

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['user_id', 'username', 'email', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['username', 'email']
    readonly_fields = ['user_id', 'created_at', 'updated_at']

@admin.register(Coordinator)
class CoordinatorAdmin(admin.ModelAdmin):
    list_display = ['coordinator_id', 'first_name', 'last_name', 'code', 'status', 'user']
    list_filter = ['status', 'department', 'role']
    search_fields = ['first_name', 'last_name', 'code', 'user__username']
    readonly_fields = ['coordinator_id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('first_name', 'last_name', 'code', 'phone')
        }),
        ('Información Laboral', {
            'fields': ('department', 'role', 'since', 'status')
        }),
        ('Relaciones', {
            'fields': ('user',)
        }),
        ('Auditoría', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

@admin.register(CoordinatorCareer)
class CoordinatorCareerAdmin(admin.ModelAdmin):
    list_display = ['coordinator', 'career']
    search_fields = ['coordinator__first_name', 'career__name']

@admin.register(CoordinatorFaculty)
class CoordinatorFacultyAdmin(admin.ModelAdmin):
    list_display = ['coordinator', 'faculty']
    search_fields = ['coordinator__first_name', 'faculty__name']