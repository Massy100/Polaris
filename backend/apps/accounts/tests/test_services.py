# backend/apps/accounts/tests/test_services.py
"""
Unit tests for CoordinatorService
"""

from django.test import TestCase
from django.db import IntegrityError
from ..services import CoordinatorService
from ..models import Coordinator, User
from .factories import CoordinatorFactory, UserFactory


class CoordinatorServiceTest(TestCase):
    """Test CoordinatorService static methods"""

    def setUp(self):
        self.active_coord = CoordinatorFactory(status='active')
        self.inactive_coord = CoordinatorFactory(status='inactive')

    def test_get_all_coordinators_only_active_by_default(self):
        """Test 38: get_all_coordinators returns only active by default"""
        result = CoordinatorService.get_all_coordinators()
        self.assertEqual(result.count(), 1)
        self.assertEqual(result.first().coordinator_id, self.active_coord.coordinator_id)

    def test_get_all_coordinators_include_inactive(self):
        """Test 39: get_all_coordinators includes inactive when flag True"""
        result = CoordinatorService.get_all_coordinators(include_inactive=True)
        self.assertEqual(result.count(), 2)

    def test_get_coordinator_by_id_found(self):
        """Test 40: get_coordinator_by_id returns coordinator when exists"""
        coord = CoordinatorService.get_coordinator_by_id(self.active_coord.coordinator_id)
        self.assertIsNotNone(coord)
        self.assertEqual(coord.coordinator_id, self.active_coord.coordinator_id)

    def test_get_coordinator_by_id_not_found(self):
        """Test 41: get_coordinator_by_id returns None when not found"""
        coord = CoordinatorService.get_coordinator_by_id(99999)
        self.assertIsNone(coord)

    def test_create_coordinator_success(self):
        """Test 42: create_coordinator creates user and coordinator"""
        data = {
            'username': 'new_coord',
            'password': 'pass123',
            'email': 'new@example.com',
            'first_name': 'New',
            'last_name': 'User',
            'code': 'NEW001',
            'phone': '123456',
            'department': 'IT',
            'role': 'Coordinador'
        }
        coordinator = CoordinatorService.create_coordinator(data)
        
        self.assertEqual(coordinator.first_name, 'New')
        self.assertEqual(coordinator.user.username, 'new_coord')
        self.assertTrue(coordinator.user.check_password('pass123'))
        self.assertEqual(coordinator.user.email, 'new@example.com')
        self.assertEqual(coordinator.status, 'active')

    def test_create_coordinator_duplicate_username_raises_error(self):
        """Test 43: Creating coordinator with existing username raises ValueError"""
        existing_user = UserFactory(username='existing')
        data = {
            'username': 'existing',
            'password': 'pass'
        }
        with self.assertRaises(ValueError) as context:
            CoordinatorService.create_coordinator(data)
        self.assertIn('El nombre de usuario ya existe', str(context.exception))

    def test_update_coordinator_success(self):
        """Test 44: update_coordinator updates fields correctly"""
        coordinator = CoordinatorFactory(first_name='OldName')
        update_data = {
            'first_name': 'NewName',
            'last_name': 'NewLastName',
            'code': 'NEWCODE',
            'username': 'newusername',
            'email': 'newemail@test.com'
        }
        updated = CoordinatorService.update_coordinator(coordinator.coordinator_id, update_data)
        
        self.assertEqual(updated.first_name, 'NewName')
        self.assertEqual(updated.last_name, 'NewLastName')
        self.assertEqual(updated.code, 'NEWCODE')
        self.assertEqual(updated.user.username, 'newusername')
        self.assertEqual(updated.user.email, 'newemail@test.com')

    def test_update_coordinator_not_found(self):
        """Test 45: update_coordinator raises ValueError if coordinator not found"""
        with self.assertRaises(ValueError) as context:
            CoordinatorService.update_coordinator(99999, {'first_name': 'Test'})
        self.assertIn('Coordinador no encontrado', str(context.exception))

    def test_delete_coordinator_soft_delete(self):
        """Test 46: delete_coordinator sets status to inactive for both coordinator and user"""
        coordinator = CoordinatorFactory(status='active')
        self.assertTrue(coordinator.user.status, 'active')
        
        result = CoordinatorService.delete_coordinator(coordinator.coordinator_id)
        self.assertTrue(result)
        
        coordinator.refresh_from_db()
        coordinator.user.refresh_from_db()
        self.assertEqual(coordinator.status, 'inactive')
        self.assertEqual(coordinator.user.status, 'inactive')

    def test_toggle_status_active_to_inactive(self):
        """Test 47: toggle_status changes active to inactive"""
        coordinator = CoordinatorFactory(status='active')
        coordinator.user.status = 'active'
        coordinator.user.save()
        
        result = CoordinatorService.toggle_status(coordinator.coordinator_id)
        self.assertEqual(result.status, 'inactive')
        result.user.refresh_from_db()
        self.assertEqual(result.user.status, 'inactive')

    def test_toggle_status_inactive_to_active(self):
        """Test 48: toggle_status changes inactive to active"""
        coordinator = CoordinatorFactory(status='inactive')
        coordinator.user.status = 'inactive'
        coordinator.user.save()
        
        result = CoordinatorService.toggle_status(coordinator.coordinator_id)
        self.assertEqual(result.status, 'active')
        result.user.refresh_from_db()
        self.assertEqual(result.user.status, 'active')

    def test_reset_password_generates_new_password(self):
        """Test 49: reset_password generates new random password if not provided"""
        coordinator = CoordinatorFactory()
        old_hash = coordinator.user.password_hash
        
        new_password = CoordinatorService.reset_password(coordinator.coordinator_id)
        
        coordinator.user.refresh_from_db()
        self.assertNotEqual(coordinator.user.password_hash, old_hash)
        self.assertTrue(coordinator.user.check_password(new_password))
        self.assertEqual(len(new_password), 10)

    def test_reset_password_with_custom_password(self):
        """Test 50: reset_password sets provided password"""
        coordinator = CoordinatorFactory()
        custom_password = 'MyCustomPass123'
        
        result = CoordinatorService.reset_password(coordinator.coordinator_id, custom_password)
        
        self.assertEqual(result, custom_password)
        coordinator.user.refresh_from_db()
        self.assertTrue(coordinator.user.check_password(custom_password))