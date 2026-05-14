from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.exceptions import ValidationError
from apps.profile.serializers import (
    CoordinatorPersonalSerializer,
    CoordinatorPreferencesSerializer,
    ChangePasswordSerializer,
)
from apps.profile.tests.factories import CoordinatorFactory, UserFactory

User = get_user_model()


class CoordinatorPersonalSerializerTest(TestCase):
    """Test CoordinatorPersonalSerializer."""

    def setUp(self):
        self.coordinator = CoordinatorFactory()
        self.serializer = CoordinatorPersonalSerializer(instance=self.coordinator)

    def test_contains_expected_fields(self):
        """Test that the serializer returns the correct fields."""
        data = self.serializer.data
        expected_fields = {'coordinator_id', 'first_name', 'last_name', 'email', 'phone', 'department', 'role'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_coordinator_id_and_role_read_only(self):
        """Test that coordinator_id and role are read-only."""
        data = {
            'coordinator_id': 999,
            'role': 'Admin',
            'first_name': 'Updated',
        }
        serializer = CoordinatorPersonalSerializer(instance=self.coordinator, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        self.coordinator.refresh_from_db()
        self.assertNotEqual(self.coordinator.coordinator_id, 999)
        self.assertNotEqual(self.coordinator.role, 'Admin')
        self.assertEqual(self.coordinator.first_name, 'Updated')

    def test_update_personal_fields(self):
        """Test updating personal fields."""
        new_data = {
            'first_name': 'Jane',
            'last_name': 'Smith',
            'phone': '123456789',
            'department': 'Engineering',
        }
        serializer = CoordinatorPersonalSerializer(instance=self.coordinator, data=new_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertEqual(updated.first_name, 'Jane')
        self.assertEqual(updated.last_name, 'Smith')
        self.assertEqual(updated.phone, '123456789')
        self.assertEqual(updated.department, 'Engineering')


class CoordinatorPreferencesSerializerTest(TestCase):
    """Test CoordinatorPreferencesSerializer."""

    def setUp(self):
        self.coordinator = CoordinatorFactory()
        self.serializer = CoordinatorPreferencesSerializer(instance=self.coordinator)

    def test_contains_expected_fields(self):
        """Test that the serializer returns only preference fields."""
        data = self.serializer.data
        expected_fields = {'email_notifications', 'system_alerts', 'weekly_report', 'two_factor'}
        self.assertEqual(set(data.keys()), expected_fields)

    def test_update_preferences(self):
        """Test updating preferences."""
        new_data = {
            'email_notifications': False,
            'weekly_report': True,
            'two_factor': True,
        }
        serializer = CoordinatorPreferencesSerializer(instance=self.coordinator, data=new_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        self.assertFalse(updated.email_notifications)
        self.assertTrue(updated.weekly_report)
        self.assertTrue(updated.two_factor)
        # system_alerts unchanged
        self.assertTrue(updated.system_alerts)


class ChangePasswordSerializerTest(TestCase):
    """Test ChangePasswordSerializer."""

    def test_valid_data(self):
        """Test that valid password passes validation."""
        data = {
            'current_password': 'oldpass',
            'new_password': 'NewStrongP@ssw0rd!',
        }
        serializer = ChangePasswordSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_new_password_too_weak(self):
        """Test that weak new password fails validation."""
        data = {
            'current_password': 'oldpass',
            'new_password': '123',
        }
        serializer = ChangePasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)

    def test_missing_current_password(self):
        """Test that current_password is required."""
        data = {'new_password': 'NewStrongP@ssw0rd!'}
        serializer = ChangePasswordSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('current_password', serializer.errors)