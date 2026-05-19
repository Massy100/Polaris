# backend/apps/accounts/tests/test_serializers.py
"""
Unit tests for accounts serializers
"""

from django.test import TestCase
from ..serializers import (
    UserSerializer, CoordinatorSerializer, CoordinatorListSerializer,
    CoordinatorDetailSerializer, ResetPasswordSerializer, ToggleStatusSerializer
)
from .factories import UserFactory, CoordinatorFactory


class UserSerializerTest(TestCase):
    """Test UserSerializer"""

    def test_user_serializer_fields(self):
        """Test 21: User serializer includes expected read-only fields"""
        user = UserFactory()
        serializer = UserSerializer(user)
        data = serializer.data
        
        expected_fields = ['user_id', 'username', 'status', 'created_at', 'updated_at', 'email']
        for field in expected_fields:
            self.assertIn(field, data)
        
        # Password hash should not be exposed
        self.assertNotIn('password_hash', data)

    def test_user_serializer_read_only_fields(self):
        """Test 22: user_id, created_at, updated_at are read-only"""
        user = UserFactory()
        serializer = UserSerializer(user, data={'user_id': 999, 'username': 'new_name'}, partial=True)
        self.assertTrue(serializer.is_valid())
        # user_id should be ignored
        self.assertNotEqual(serializer.validated_data.get('user_id'), 999)


class CoordinatorSerializerTest(TestCase):
    """Test CoordinatorSerializer (create/update)"""

    def test_coordinator_serializer_create_with_username_password(self):
        """Test 23: Creating coordinator with username and password works"""
        data = {
            'first_name': 'Luis',
            'last_name': 'Fernandez',
            'username': 'luisf',
            'password': 'testpass123',
            'email': 'luis@example.com',
            'code': 'C123',
            'phone': '123456789',
            'department': 'CS',
            'role': 'Coordinador'
        }
        serializer = CoordinatorSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        coordinator = serializer.save()
        
        self.assertEqual(coordinator.first_name, 'Luis')
        self.assertEqual(coordinator.last_name, 'Fernandez')
        self.assertEqual(coordinator.user.username, 'luisf')
        self.assertEqual(coordinator.user.email, 'luis@example.com')
        self.assertTrue(coordinator.user.check_password('testpass123'))
        self.assertIsNotNone(coordinator.user.user_id)

    def test_coordinator_serializer_auto_generate_password(self):
        """Test 24: Password is auto-generated if not provided"""
        data = {
            'first_name': 'Ana',
            'username': 'ana_g',
            'email': 'ana@example.com'
        }
        serializer = CoordinatorSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        coordinator = serializer.save()
        
        self.assertIsNotNone(coordinator.user.password_hash)
        self.assertTrue(hasattr(coordinator, 'temp_password'))
        self.assertEqual(len(coordinator.temp_password), 10)  # default length

    def test_coordinator_serializer_requires_username(self):
        """Test 25: Username is required"""
        data = {
            'first_name': 'Test',
            'password': 'pass123'
        }
        serializer = CoordinatorSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('username', serializer.errors)

    def test_coordinator_serializer_update(self):
        """Test 26: Updating coordinator fields works"""
        coordinator = CoordinatorFactory(first_name="Old", last_name="Name")
        data = {
            'first_name': 'New',
            'last_name': 'Name',
            'email': 'newemail@example.com'
        }
        serializer = CoordinatorSerializer(coordinator, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        
        self.assertEqual(updated.first_name, 'New')
        self.assertEqual(updated.last_name, 'Name')
        self.assertEqual(updated.user.email, 'newemail@example.com')

    def test_coordinator_serializer_update_username(self):
        """Test 27: Updating username works"""
        coordinator = CoordinatorFactory()
        old_username = coordinator.user.username
        data = {'username': 'new_username_123'}
        serializer = CoordinatorSerializer(coordinator, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        coordinator.user.refresh_from_db()
        self.assertEqual(coordinator.user.username, 'new_username_123')
        self.assertNotEqual(coordinator.user.username, old_username)

    def test_coordinator_serializer_to_representation_includes_temp_password(self):
        """Test 28: to_representation includes temp_password if present"""
        data = {
            'username': 'tempuser',
            'first_name': 'Temp'
        }
        serializer = CoordinatorSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        coordinator = serializer.save()
        
        representation = CoordinatorSerializer(coordinator).data
        self.assertIn('temp_password', representation)
        self.assertEqual(representation['temp_password'], coordinator.temp_password)

    def test_coordinator_serializer_generate_random_password(self):
        """Test 29: Random password generation produces correct length"""
        serializer = CoordinatorSerializer()
        password = serializer.generate_random_password(8)
        self.assertEqual(len(password), 8)
        
        password2 = serializer.generate_random_password(15)
        self.assertEqual(len(password2), 15)


class CoordinatorListSerializerTest(TestCase):
    """Test CoordinatorListSerializer"""

    def test_list_serializer_fields(self):
        """Test 30: List serializer includes username and email as method fields"""
        coordinator = CoordinatorFactory()
        serializer = CoordinatorListSerializer(coordinator)
        data = serializer.data
        
        expected_fields = ['coordinator_id', 'first_name', 'last_name', 'status', 
                          'code', 'phone', 'department', 'role', 'user', 
                          'username', 'email']
        for field in expected_fields:
            self.assertIn(field, data)
        
        self.assertEqual(data['username'], coordinator.user.username)
        self.assertEqual(data['email'], coordinator.user.email)


class CoordinatorDetailSerializerTest(TestCase):
    """Test CoordinatorDetailSerializer"""

    def test_detail_serializer_has_all_fields(self):
        """Test 31: Detail serializer includes all model fields"""
        coordinator = CoordinatorFactory()
        serializer = CoordinatorDetailSerializer(coordinator)
        data = serializer.data
        
        # Should include all fields including those from user via method fields
        self.assertIn('coordinator_id', data)
        self.assertIn('first_name', data)
        self.assertIn('last_name', data)
        self.assertIn('username', data)
        self.assertIn('email', data)
        self.assertIn('user', data)  # nested user object

    def test_detail_serializer_method_fields(self):
        """Test 32: username and email method fields return correct values"""
        coordinator = CoordinatorFactory()
        serializer = CoordinatorDetailSerializer(coordinator)
        self.assertEqual(serializer.data['username'], coordinator.user.username)
        self.assertEqual(serializer.data['email'], coordinator.user.email)


class ResetPasswordSerializerTest(TestCase):
    """Test ResetPasswordSerializer"""

    def test_reset_password_with_new_password(self):
        """Test 33: Valid new password passes"""
        data = {'new_password': 'newpass123'}
        serializer = ResetPasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['new_password'], 'newpass123')

    def test_reset_password_auto_generates_when_empty(self):
        """Test 34: Auto-generates password if not provided"""
        serializer = ResetPasswordSerializer(data={})
        self.assertTrue(serializer.is_valid())
        self.assertIsNotNone(serializer.validated_data['new_password'])
        self.assertEqual(len(serializer.validated_data['new_password']), 10)

    def test_reset_password_min_length_validation(self):
        """Test 35: Password must be at least 6 chars if provided"""
        data = {'new_password': '123'}
        serializer = ResetPasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)


class ToggleStatusSerializerTest(TestCase):
    """Test ToggleStatusSerializer"""

    def test_toggle_status_valid_choices(self):
        """Test 36: Valid status choices pass"""
        data = {'status': 'active'}
        serializer = ToggleStatusSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        data2 = {'status': 'inactive'}
        serializer2 = ToggleStatusSerializer(data=data2)
        self.assertTrue(serializer2.is_valid())

    def test_toggle_status_invalid_choice(self):
        """Test 37: Invalid status fails"""
        data = {'status': 'pending'}
        serializer = ToggleStatusSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)