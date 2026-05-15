from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db import transaction
from django.utils import timezone
from django.core.cache import cache
from django.conf import settings
import requests
import logging

from .models import Coordinator, User, AccessRequest
from .serializers import (
    CoordinatorSerializer, CoordinatorListSerializer,
    CoordinatorDetailSerializer, ResetPasswordSerializer,
    AccessRequestSerializer, AccessRequestDetailSerializer,
    UserSerializer
)
from .permissions import IsSuperAdmin, IsAuthenticated, CanManageAccessRequests, CanViewOwnProfile

logger = logging.getLogger(__name__)

class ClerkLoginView(viewsets.ViewSet):
    """
    Endpoint para login inicial con Clerk.
    """
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['post'], url_path='clerk-login')
    def clerk_login(self, request):
        clerk_id = request.data.get('clerk_id')
        email = request.data.get('email')
        username = request.data.get('username')
        
        if not clerk_id or not email:
            return Response(
                {'error': 'clerk_id y email requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(clerk_id=clerk_id)
            if user.status == 'active':
                return Response({
                    'status': 'approved',
                    'user': UserSerializer(user).data,
                    'message': 'Usuario autenticado'
                })
            elif user.status == 'inactive':
                return Response({
                    'status': 'inactive',
                    'message': 'Usuario desactivado'
                }, status=status.HTTP_403_FORBIDDEN)
            
        except User.DoesNotExist:
            try:
                access_req = AccessRequest.objects.get(
                    clerk_id=clerk_id,
                    status='approved'
                )
                user = User.objects.create(
                    clerk_id=clerk_id,
                    email=email,
                    username=username or email.split('@')[0],
                    role=access_req.requested_role,
                    status='active',
                    clerk_synced_at=timezone.now()
                )
                return Response({
                    'status': 'approved',
                    'user': UserSerializer(user).data,
                    'message': 'Usuario creado correctamente'
                }, status=status.HTTP_201_CREATED)
                
            except AccessRequest.DoesNotExist:
                access_req, created = AccessRequest.objects.get_or_create(
                    clerk_id=clerk_id,
                    defaults={
                        'email': email,
                        'username': username or email.split('@')[0],
                        'status': 'pending',
                        'requested_role': 'user'
                    }
                )
                return Response({
                    'status': 'pending',
                    'request_id': access_req.request_id,
                    'message': 'Solicitud de acceso creada. Esperando aprobación del administrador.'
                }, status=status.HTTP_202_ACCEPTED)

class AccessRequestViewSet(viewsets.ModelViewSet):
    queryset = AccessRequest.objects.all()
    serializer_class = AccessRequestSerializer
    permission_classes = [CanManageAccessRequests]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        access_request = self.get_object()
        if access_request.status != 'pending':
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                user = access_request.approve(request.user)
                return Response({'message': 'Aprobado', 'user': UserSerializer(user).data})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        access_request = self.get_object()
        access_request.reject(request.user)
        return Response({'message': 'Rechazado'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        stats = {
            'total': AccessRequest.objects.count(),
            'pending': AccessRequest.objects.filter(status='pending').count(),
            'approved': AccessRequest.objects.filter(status='approved').count(),
            'rejected': AccessRequest.objects.filter(status='rejected').count(),
        }
        return Response(stats)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        return Response(self.get_serializer(request.user).data)

    @action(detail=True, methods=['patch'])
    def update_profile(self, request, pk=None):
        user = self.get_object()
        if user.user_id != request.user.user_id and not request.user.is_super_admin():
            return Response({'error': 'No permitido'}, status=status.HTTP_403_FORBIDDEN)
        
        username = request.data.get('username')
        if username:
            user.username = username
        
        user.save()
        
        # Sincronizar con Clerk
        if user.clerk_id and username:
            try:
                requests.patch(
                    f"https://api.clerk.com/v1/users/{user.clerk_id}",
                    json={"username": username},
                    headers={"Authorization": f"Bearer {settings.CLERK_SECRET_KEY}"},
                    timeout=5
                )
                user.clerk_synced_at = timezone.now()
                user.save()
            except Exception as e:
                logger.error(f"Clerk sync error: {e}")

        return Response(self.get_serializer(user).data)

class CoordinatorViewSet(viewsets.ModelViewSet):
    queryset = Coordinator.objects.select_related('user').all()
    serializer_class = CoordinatorSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        include_inactive = self.request.query_params.get('include_inactive', 'false').lower() == 'true'
        if include_inactive:
            return self.queryset
        return self.queryset.filter(status='active')

    @action(detail=True, methods=['patch'], url_path='toggle-status')
    def toggle_status(self, request, pk=None):
        coordinator = self.get_object()
        new_status = 'inactive' if coordinator.status == 'active' else 'active'
        coordinator.status = new_status
        coordinator.save()
        if coordinator.user:
            coordinator.user.status = new_status
            coordinator.user.save()
        return Response({'status': new_status})
