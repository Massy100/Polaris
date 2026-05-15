from rest_framework.authentication import TokenAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings
from django.utils import timezone
from .models import User
import requests
import logging
from typing import Optional, Tuple

logger = logging.getLogger(__name__)


class ClerkAuthentication(TokenAuthentication):
    """
    Autentica usando tokens JWT de Clerk
    
    Flujo:
    1. Frontend envía: Authorization: Bearer <clerk_token>
    2. Se valida el token con Clerk API
    3. Se obtiene o crea el usuario local basado en clerk_id
    4. Se retorna el usuario autenticado
    """
    
    keyword = 'Bearer'
    
    def authenticate(self, request) -> Optional[Tuple]:
        """Autentica la petición usando token de Clerk"""
        auth = self._get_authorization_header(request)
        
        if not auth:
            return None
        
        if isinstance(auth, bytes):
            auth = auth.decode(settings.DEFAULT_CHARSET)
        
        auth_parts = auth.split()
        
        if len(auth_parts) != 2 or auth_parts[0].lower() != self.keyword.lower():
            return None
        
        token = auth_parts[1]
        
        try:
            clerk_user_data = self._verify_clerk_token(token)
            
            if not clerk_user_data:
                raise AuthenticationFailed('Token de Clerk inválido')
            
            clerk_id = clerk_user_data.get('sub')  # Clerk pone el user_id en 'sub'
            
            if not clerk_id:
                raise AuthenticationFailed('clerk_id no encontrado en token')
            
            # Obtener usuario local
            user = self._get_or_sync_user(clerk_user_data)
            
            if not user:
                # No lanzamos excepción aquí para permitir que endpoints como clerk-login
                # procesen a usuarios que aún no están en la base de datos local.
                return None
            
            # Actualizar último login
            user.update_last_login()
            
            return (user, token)
            
        except AuthenticationFailed:
            raise
        except Exception as e:
            logger.error(f"Clerk authentication error: {str(e)}")
            raise AuthenticationFailed('Autenticación fallida')
    
    @staticmethod
    def _get_authorization_header(request) -> Optional[str]:
        """Obtiene el header Authorization"""
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        return auth if auth else None
    
    @staticmethod
    def _verify_clerk_token(token: str) -> Optional[dict]:
        """Verifica el token con Clerk API"""
        try:
            if not hasattr(settings, 'CLERK_SECRET_KEY') or not settings.CLERK_SECRET_KEY:
                logger.error("CLERK_SECRET_KEY no configurada")
                return None
            
            response = requests.post(
                "https://api.clerk.com/v1/tokens/verify",
                json={"token": token},
                headers={
                    "Authorization": f"Bearer {settings.CLERK_SECRET_KEY}",
                    "Content-Type": "application/json"
                },
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            
            logger.warning(f"Clerk verification failed: {response.status_code} - {response.text}")
            return None
            
        except requests.RequestException as e:
            logger.error(f"Clerk API request error: {str(e)}")
            return None
    
    @staticmethod
    def _get_or_sync_user(clerk_user_data: dict) -> Optional[User]:
        """
        Obtiene o sincroniza usuario local con datos de Clerk
        
        Si el usuario no existe pero está aprobado, se crea.
        Si existe, se actualiza su información.
        """
        clerk_id = clerk_user_data.get('sub')
        email = clerk_user_data.get('email', '')
        username = clerk_user_data.get('username') or email.split('@')[0]
        
        try:
            # Intentar obtener usuario existente
            user = User.objects.get(clerk_id=clerk_id)
            
            # Sincronizar campos si han cambiado
            updated = False
            if user.email != email:
                user.email = email
                updated = True
            if user.username != username:
                user.username = username
                updated = True
            
            if updated:
                user.clerk_synced_at = timezone.now()
                user.save()
            
            return user
            
        except User.DoesNotExist:
            # Usuario no existe, verificar si fue aprobado
            from .models import AccessRequest
            
            try:
                access_req = AccessRequest.objects.get(
                    clerk_id=clerk_id,
                    status='approved'
                )
                
                # Crear usuario nuevo con datos de Clerk
                user = User.objects.create(
                    clerk_id=clerk_id,
                    email=email,
                    username=username,
                    role=access_req.requested_role,
                    status='active',
                    clerk_synced_at=timezone.now()
                )
                
                logger.info(f"New user created from Clerk approval: {clerk_id}")
                return user
                
            except AccessRequest.DoesNotExist:
                logger.warning(f"User {clerk_id} no tiene acceso aprobado")
                return None