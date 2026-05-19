from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.profile.models import Coordinator
from apps.profile.tests.factories import CoordinatorFactory, UserFactory

User = get_user_model()


class CoordinatorModelTest(TestCase):
    """Test cases for the Coordinator model."""

    def test_create_coordinator_with_user(self):
        """Test creating a Coordinator linked to a User."""
        user = UserFactory()
        coordinator = CoordinatorFactory(user=user)
        self.assertIsInstance(coordinator, Coordinator)
        self.assertEqual(coordinator.user, user)
        self.assertEqual(coordinator.email, user.email)

    def test_coordinator_default_values(self):
        """Test default field values."""
        coordinator = CoordinatorFactory()
        self.assertEqual(coordinator.status, 'ACTIVE')
        self.assertTrue(coordinator.email_notifications)
        self.assertTrue(coordinator.system_alerts)
        self.assertFalse(coordinator.weekly_report)
        self.assertFalse(coordinator.two_factor)
        self.assertIsNotNone(coordinator.created_at)
        self.assertIsNotNone(coordinator.updated_at)

    def test_coordinator_str_method(self):
        """Test string representation (no custom __str__, but check field access)."""
        coordinator = CoordinatorFactory(first_name='John', last_name='Doe')
        # Default Django model str uses the model name and pk
        self.assertEqual(str(coordinator), f'Coordinator object ({coordinator.coordinator_id})')

    def test_coordinator_unique_email(self):
        """Test that email field has unique constraint."""
        CoordinatorFactory(email='unique@example.com')
        with self.assertRaises(Exception):  # IntegrityError
            CoordinatorFactory(email='unique@example.com')