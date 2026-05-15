from rest_framework import permissions


class IsAuthenticated(permissions.BasePermission):
    """Requiere que el usuario esté autenticado"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsSuperAdmin(permissions.BasePermission):
    """Requiere que el usuario sea super_admin"""
    
    def has_permission(self, request, view):
        return (request.user and 
                request.user.is_authenticated and 
                request.user.role == 'super_admin')


class IsAuthenticated(permissions.BasePermission):
    """Requiere autenticación"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class CanManageAccessRequests(permissions.BasePermission):
    """Permite que solo super_admin maneje solicitudes de acceso"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Super admin puede todo
        if request.user.role == 'super_admin':
            return True
        
        return False


class CanViewOwnProfile(permissions.BasePermission):
    """Permite ver perfil propio o permitir que super_admin vea cualquiera"""
    
    def has_object_permission(self, request, view, obj):
        # Super admin puede ver todo
        if request.user.role == 'super_admin':
            return True
        
        # Usuario normal solo ve su propio perfil
        return obj.user_id == request.user.user_id