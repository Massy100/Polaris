# apps/accounts/services.py
from .models import Coordinator, User
from django.db import transaction
from django.core.exceptions import ObjectDoesNotExist

class CoordinatorService:
    
    @staticmethod
    def get_all_coordinators(include_inactive=False):
        queryset = Coordinator.objects.select_related('user')
        if not include_inactive:
            queryset = queryset.filter(status='active')
        return queryset
    
    @staticmethod
    def get_coordinator_by_id(coordinator_id):
        try:
            return Coordinator.objects.select_related('user').get(coordinator_id=coordinator_id)
        except Coordinator.DoesNotExist:
            return None
    
    @staticmethod
    @transaction.atomic
    def create_coordinator(data):
        if User.objects.filter(username=data.get('username')).exists():
            raise ValueError('El nombre de usuario ya existe')
        
        user = User.objects.create(
            username=data['username'],
            email=data.get('email', ''),
            status='active'
        )
        user.set_password(data.get('password', ''))
        user.save()
        
        coordinator = Coordinator.objects.create(
            user=user,
            first_name=data.get('first_name', ''),
            last_name=data.get('last_name', ''),
            code=data.get('code', ''),
            phone=data.get('phone', ''),
            department=data.get('department', ''),
            role=data.get('role', 'Coordinador'),
            status='active'
        )
        
        return coordinator
    
    @staticmethod
    @transaction.atomic
    def update_coordinator(coordinator_id, data):
        coordinator = CoordinatorService.get_coordinator_by_id(coordinator_id)
        if not coordinator:
            raise ValueError('Coordinador no encontrado')
        
        for field in ['first_name', 'last_name', 'code', 'phone', 'department', 'role']:
            if field in data:
                setattr(coordinator, field, data[field])
        coordinator.save()
        
        if 'username' in data:
            coordinator.user.username = data['username']
            coordinator.user.save()
        
        if 'email' in data:
            coordinator.user.email = data['email']
            coordinator.user.save()
        
        return coordinator
    
    @staticmethod
    @transaction.atomic
    def delete_coordinator(coordinator_id):
        coordinator = CoordinatorService.get_coordinator_by_id(coordinator_id)
        if not coordinator:
            raise ValueError('Coordinador no encontrado')
        
        coordinator.status = 'inactive'
        coordinator.save()
        
        coordinator.user.status = 'inactive'
        coordinator.user.save()
        
        return True
    
    @staticmethod
    @transaction.atomic
    def toggle_status(coordinator_id):
        coordinator = CoordinatorService.get_coordinator_by_id(coordinator_id)
        if not coordinator:
            raise ValueError('Coordinador no encontrado')
        
        coordinator.status = 'inactive' if coordinator.status == 'active' else 'active'
        coordinator.save()
        
        coordinator.user.status = coordinator.status
        coordinator.user.save()
        
        return coordinator
    
    @staticmethod
    @transaction.atomic
    def reset_password(coordinator_id, new_password=None):
        coordinator = CoordinatorService.get_coordinator_by_id(coordinator_id)
        if not coordinator:
            raise ValueError('Coordinador no encontrado')
        
        if not new_password:
            import random
            import string
            new_password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(10))
        
        coordinator.user.set_password(new_password)
        coordinator.user.save()
        
        return new_password