from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth import update_session_auth_hash
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.db import transaction, connection
from .models import Coordinator
from .serializers import CoordinatorPersonalSerializer, CoordinatorPreferencesSerializer, ChangePasswordSerializer

User = get_user_model()

class ProfileListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        coordinators = Coordinator.objects.select_related('user').all()
        serializer = CoordinatorPersonalSerializer(coordinators, many=True)
        return Response(serializer.data)

class CreateProfileView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"error": "El correo es obligatorio."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=email).exists() or Coordinator.objects.filter(email=email).exists():
            return Response({"error": "Ya existe un usuario o coordinador con este correo."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    password='PolarisPassword123!',
                    first_name=request.data.get('first_name', ''),
                    last_name=request.data.get('last_name', '')
                )

                with connection.cursor() as cursor:
                    cursor.execute('SELECT user_id FROM "User" WHERE user_id = %s', [user.id])
                    if not cursor.fetchone():
                        cursor.execute(
                            'INSERT INTO "User" (user_id, username, status) VALUES (%s, %s, %s)',
                            [user.id, email, 'ACTIVE']
                        )

                serializer = CoordinatorPersonalSerializer(data=request.data)
                if serializer.is_valid():
                    role = request.data.get('role', 'Coordinador')
                    serializer.save(user=user, role=role)
                    return Response(serializer.data, status=status.HTTP_201_CREATED)

                error_msg = next(iter(serializer.errors.values()))[0]
                raise ValueError(error_msg)
        except Exception as e:
            return Response({"error": str(e).strip("[]'")}, status=status.HTTP_400_BAD_REQUEST)

class ProfileDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, user, pk=None):
        if pk:
            return get_object_or_404(Coordinator.objects.select_related('user'), pk=pk)
        if user.is_anonymous:
            return Coordinator.objects.select_related('user').first()
        return get_object_or_404(Coordinator.objects.select_related('user'), user=user)

    def get(self, request, pk=None):
        coordinator = self.get_object(request.user, pk)
        if not coordinator:
            return Response({"error": "No hay coordinadores"}, status=status.HTTP_404_NOT_FOUND)

        personal_data = CoordinatorPersonalSerializer(coordinator).data
        prefs_data = CoordinatorPreferencesSerializer(coordinator).data
        return Response({
            'personal': personal_data,
            'preferences': prefs_data
        })

class UpdatePersonalView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk=None):
        if pk:
            coordinator = get_object_or_404(Coordinator, pk=pk)
        elif request.user.is_anonymous:
            coordinator = Coordinator.objects.first()
        else:
            coordinator = get_object_or_404(Coordinator, user=request.user)

        serializer = CoordinatorPersonalSerializer(coordinator, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk=None):
        return self.patch(request, pk)

class UpdatePreferencesView(APIView):
    permission_classes = [AllowAny]

    def patch(self, request, pk=None):
        if pk:
            coordinator = get_object_or_404(Coordinator, pk=pk)
        elif request.user.is_anonymous:
            coordinator = Coordinator.objects.first()
        else:
            coordinator = get_object_or_404(Coordinator, user=request.user)

        serializer = CoordinatorPreferencesSerializer(coordinator, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ChangePasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, pk=None):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            if pk:
                coordinator = get_object_or_404(Coordinator, pk=pk)
                user = coordinator.user
            elif request.user.is_anonymous:
                coordinator = Coordinator.objects.first()
                user = coordinator.user
            else:
                user = request.user

            if not pk and not request.user.is_anonymous and not user.check_password(serializer.validated_data['current_password']):
                return Response({'current_password': ['La contraseña actual es incorrecta.']}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(serializer.validated_data['new_password'])
            user.save()

            if user == request.user:
                update_session_auth_hash(request, user)
            return Response({'detail': 'Contraseña actualizada.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
