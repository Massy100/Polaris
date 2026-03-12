from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.hashers import make_password, check_password
from django.core import serializers
import json
from .models import User, Coordinator


@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        try:
            user = User.objects.get(username=username)
            if check_password(password, user.password_hash):
                return JsonResponse({
                    'success': True,
                    'user_id': user.user_id,
                    'username': user.username
                })
            else:
                return JsonResponse({'error': 'Contraseña incorrecta'}, status=401)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Usuario no existe'}, status=404)
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)

@csrf_exempt
def register_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        
        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Usuario ya existe'}, status=400)
        
        user = User.objects.create(
            username=username,
            password_hash=make_password(password)
        )
        
        return JsonResponse({
            'success': True,
            'user_id': user.user_id,
            'username': user.username
        })
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)


def users_list(request):
    """GET todos los usuarios"""
    if request.method == 'GET':
        users = User.objects.all().values('user_id', 'username','password_hash', 'status', 'created_at')
        return JsonResponse(list(users), safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

def user_detail(request, user_id):
    """GET un usuario específico por ID"""
    if request.method == 'GET':
        try:
            user = User.objects.values('user_id', 'username', 'status', 'created_at').get(user_id=user_id)
            return JsonResponse(user)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Usuario no encontrado'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

def coordinators_list(request):
    """GET todos los coordinadores"""
    if request.method == 'GET':
        coords = Coordinator.objects.select_related('user').all().values(
            'coordinator_id', 'first_name', 'last_name', 'status',
            'user__user_id', 'user__username'
        )
        return JsonResponse(list(coords), safe=False)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

def coordinator_detail(request, coordinator_id):
    """GET un coordinador específico por ID"""
    if request.method == 'GET':
        try:
            coord = Coordinator.objects.select_related('user').values(
                'coordinator_id', 'first_name', 'last_name', 'status',
                'user__user_id', 'user__username'
            ).get(coordinator_id=coordinator_id)
            return JsonResponse(coord)
        except Coordinator.DoesNotExist:
            return JsonResponse({'error': 'Coordinador no encontrado'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

def coordinator_by_user(request, user_id):
    """GET coordinador por user_id"""
    if request.method == 'GET':
        try:
            coord = Coordinator.objects.select_related('user').values(
                'coordinator_id', 'first_name', 'last_name', 'status',
                'user__user_id', 'user__username'
            ).get(user_id=user_id)
            return JsonResponse(coord)
        except Coordinator.DoesNotExist:
            return JsonResponse({'error': 'Coordinador no encontrado'}, status=404)
    return JsonResponse({'error': 'Método no permitido'}, status=405)

def health_check(request):
    """Para probar que la API responde"""
    return JsonResponse({
        'status': 'ok',
        'message': 'API funcionando correctamente'
    })