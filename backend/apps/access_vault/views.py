import json
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import IdentityCredential, VaultProfile
from .serializers import VaultIdentitySerializer, VaultProfileSerializer, AccessDecisionSerializer

@csrf_exempt
def clerk_sync_webhook(request):
    if request.method != 'POST':
        return HttpResponse(status=405)
    
    try:
        payload = json.loads(request.body)
        event_type = payload.get('type')
        data = payload.get('data', {})
        
        if event_type == 'user.created':
            email = data['email_addresses'][0]['email_address']
            clerk_id = data['id']
            full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            
            cred, created = IdentityCredential.objects.get_or_create(
                email=email,
                defaults={'clerk_id': clerk_id, 'full_identity_name': full_name}
            )
            if not created:
                cred.clerk_id = clerk_id
                cred.full_identity_name = full_name
                cred.save()
            
            VaultProfile.objects.get_or_create(credential=cred)
            
        elif event_type == 'user.updated':
            clerk_id = data['id']
            email = data['email_addresses'][0]['email_address']
            full_name = f"{data.get('first_name', '')} {data.get('last_name', '')}".strip()
            
            cred = IdentityCredential.objects.filter(clerk_id=clerk_id).first()
            if cred:
                cred.email = email
                cred.full_identity_name = full_name
                cred.save()

        elif event_type == 'user.deleted':
            clerk_id = data['id']
            IdentityCredential.objects.filter(clerk_id=clerk_id).delete()
            
        return JsonResponse({'status': 'vault_synchronized'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

class VaultSecurityGuardViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    serializer_class = AccessDecisionSerializer

    def get_queryset(self):
        filter_status = self.request.query_params.get('flow', 'WAITING')
        return IdentityCredential.objects.filter(registration_status=filter_status)

    @action(detail=True, methods=['post'], url_path='grant-entry')
    def grant_entry(self, request, pk=None):
        cred = self.get_object()
        if str(cred.vault_id) == str(request.headers.get('X-Vault-ID')):
            return Response({'error': 'no_self_modification'}, status=400)
        cred.registration_status = 'APPROVED'
        cred.access_level = request.data.get('assigned_role', 'STAFF_COORDINATOR')
        cred.save()
        return Response({'vault_status': 'access_granted'})

    @action(detail=True, methods=['post'], url_path='deny-entry')
    def deny_entry(self, request, pk=None):
        cred = self.get_object()
        if str(cred.vault_id) == str(request.headers.get('X-Vault-ID')):
            return Response({'error': 'no_self_modification'}, status=400)
        cred.registration_status = 'DENIED'
        cred.save()
        return Response({'vault_status': 'access_denied'})

    @action(detail=True, methods=['post'], url_path='re-evaluate')
    def re_evaluate(self, request, pk=None):
        cred = self.get_object()
        cred.registration_status = 'WAITING'
        cred.save()
        return Response({'vault_status': 'back_to_queue'})

    @action(detail=False, methods=['get'], url_path='active-vault-users')
    def active_vault_users(self, request):
        active_creds = IdentityCredential.objects.filter(registration_status='APPROVED')
        serializer = self.get_serializer(active_creds, many=True)
        return Response(serializer.data)

class PersonalVaultView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        print(">>> VAULT: Accediendo a la vista de identidad")
        clerk_id = request.headers.get('X-Clerk-ID')
        email_hint = request.headers.get('X-Clerk-Email')
        name_hint = request.headers.get('X-Clerk-Name')
        
        print(f">>> VAULT: Headers recibidos - ID: {clerk_id}, Email: {email_hint}")

        if not clerk_id:
            cred = IdentityCredential.objects.first()
            if not cred:
                return Response({'error': 'vault_empty'}, status=404)
        else:
            cred = IdentityCredential.objects.filter(clerk_id=clerk_id).first()
            
            # Auto-registro si no existe en la base de datos local
            if not cred and email_hint:
                cred = IdentityCredential.objects.create(
                    clerk_id=clerk_id,
                    email=email_hint,
                    full_identity_name=name_hint or email_hint.split('@')[0],
                    registration_status='WAITING',
                    access_level='STAFF_COORDINATOR'
                )
                VaultProfile.objects.create(credential=cred)
            
            if not cred:
                return Response({'error': 'vault_not_found'}, status=404)
            
        profile = VaultProfile.objects.get(credential=cred)
        return Response({
            'identity': VaultIdentitySerializer(cred).data,
            'profile': VaultProfileSerializer(profile).data
        })

    def patch(self, request):
        clerk_id = request.headers.get('X-Clerk-ID')
        if not clerk_id:
            cred = IdentityCredential.objects.first()
        else:
            cred = IdentityCredential.objects.filter(clerk_id=clerk_id).first()
            
        profile = VaultProfile.objects.get(credential=cred)
        
        if 'full_identity_name' in request.data:
            cred.full_identity_name = request.data['full_identity_name']
            cred.save()
            
        serializer = VaultProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)
