from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff


class IsCoordinatorOrAdmin(permissions.BasePermission):
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        if request.user.is_staff:
            return True
        
        try:
            coordinator = request.user.coordinator
            return coordinator.status == 'active'
        except:
            return False


class CanManageCoordinators(permissions.BasePermission):
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_staff