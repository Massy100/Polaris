from rest_framework import serializers
import random
import string

from .models import User, Coordinator

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'status', 'created_at', 'updated_at', 'email']
        read_only_fields = ['user_id', 'created_at', 'updated_at']


class CoordinatorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=6, allow_blank=True, allow_null=True)
    email = serializers.EmailField(write_only=True, required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = Coordinator
        fields = [
            'coordinator_id', 'first_name', 'last_name', 'status', 
            'code', 'phone', 'department', 'role', 'since',
            'created_at', 'updated_at', 'user', 'username', 'password', 'email'
        ]
        read_only_fields = ['coordinator_id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        email = validated_data.pop('email', None)
        
        if username:
            if not password:
                password = self.generate_random_password()
            
            user = User.objects.create(
                username=username,
                email=email or '',
                status='active'
            )
            user.set_password(password)
            user.save()
        else:
            raise serializers.ValidationError({'username': 'El nombre de usuario es requerido'})
        
        coordinator = Coordinator.objects.create(
            user=user,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            code=validated_data.get('code', ''),
            phone=validated_data.get('phone', ''),
            department=validated_data.get('department', ''),
            role=validated_data.get('role', 'Coordinador'),
            status='active'
        )
        
        coordinator.temp_password = password
        
        return coordinator
    
    def update(self, instance, validated_data):
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.code = validated_data.get('code', instance.code)
        instance.phone = validated_data.get('phone', instance.phone)
        instance.department = validated_data.get('department', instance.department)
        instance.role = validated_data.get('role', instance.role)
        instance.since = validated_data.get('since', instance.since)
        instance.save()
        
        if 'username' in validated_data:
            instance.user.username = validated_data['username']
            instance.user.save()
        
        if 'email' in validated_data:
            instance.user.email = validated_data['email']
            instance.user.save()
        
        return instance
    
    def generate_random_password(self, length=10):
        characters = string.ascii_letters + string.digits
        return ''.join(random.choice(characters) for _ in range(length))
    
    def to_representation(self, instance):
        representation = super().to_representation(instance)
        if hasattr(instance, 'temp_password'):
            representation['temp_password'] = instance.temp_password
        return representation


class CoordinatorListSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Coordinator
        fields = [
            'coordinator_id', 'first_name', 'last_name', 'status', 
            'code', 'phone', 'department', 'role', 'user'
        ]


class CoordinatorDetailSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Coordinator
        fields = '__all__'


class ResetPasswordSerializer(serializers.Serializer):
    new_password = serializers.CharField(min_length=6, required=False, allow_blank=True, allow_null=True)
    
    def validate(self, data):
        if not data.get('new_password'):
            import random
            import string
            data['new_password'] = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(10))
        return data


class ToggleStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['active', 'inactive'])