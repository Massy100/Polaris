from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from rest_framework.permissions import AllowAny
from .models import Coordinator
from .serializers import (
    CoordinatorSerializer, CoordinatorListSerializer, 
    CoordinatorDetailSerializer, ResetPasswordSerializer
)
from django.contrib.auth.hashers import make_password

class CoordinatorViewSet(viewsets.ModelViewSet):
    queryset = Coordinator.objects.select_related('user').all()
    permission_classes = [AllowAny] 
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CoordinatorListSerializer
        elif self.action == 'retrieve':
            return CoordinatorDetailSerializer
        return CoordinatorSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        include_inactive = self.request.query_params.get('include_inactive', 'false').lower() == 'true'
        
        if not include_inactive:
            queryset = queryset.filter(status='active')
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                coordinator = serializer.save()
                
                response_data = CoordinatorDetailSerializer(coordinator).data
                if hasattr(coordinator, 'temp_password'):
                    response_data['temp_password'] = coordinator.temp_password
                
                return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        try:
            with transaction.atomic():
                self.perform_update(serializer)
                return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        try:
            instance.status = 'inactive'
            instance.save()
            
            instance.user.status = 'inactive'
            instance.user.save()
            
            return Response(
                {'message': 'Coordinador desactivado exitosamente'},
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        coordinator = self.get_object()
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            new_password = serializer.validated_data['new_password']
            coordinator.user.set_password(new_password)
            coordinator.user.save()
            
            return Response({
                'message': 'Contraseña resetada exitosamente',
                'new_password': new_password
            })
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        coordinator = self.get_object()
        
        try:
            coordinator.status = 'inactive' if coordinator.status == 'active' else 'active'
            coordinator.save()
            
            coordinator.user.status = coordinator.status
            coordinator.user.save()
            
            serializer = CoordinatorDetailSerializer(coordinator)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], url_path='stats')
    def get_stats(self, request):
        """Obtener estadísticas de coordinadores"""
        total = Coordinator.objects.count()
        active = Coordinator.objects.filter(status='active').count()
        inactive = Coordinator.objects.filter(status='inactive').count()
        
        return Response({
            'total': total,
            'active': active,
            'inactive': inactive
        })