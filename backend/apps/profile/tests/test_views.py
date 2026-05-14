import json
from unittest.mock import patch, MagicMock
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework import status
from apps.profile.models import Coordinator
from apps.profile.tests.factories import CoordinatorFactory, UserFactory

User = get_user_model()


class ProfileListViewTest(APITestCase):
    """Test ProfileListView (GET /profile/list/)."""

    def setUp(self):
        self.url = reverse('profile-list')  # assumes name from urls.py; adjust if needed
        # Since urls.py has no names, we use path directly. We'll use reverse with the actual path.
        # For simplicity, we'll use the path string.
        self.url = '/profile/list/'  # adjust to actual URL prefix, e.g., /api/profile/list/
        self.coordinators = CoordinatorFactory.create_batch(3)

    def test_get_list_returns_all_coordinators(self):
        """Test that GET returns all coordinators with personal data."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
        # Check that only personal fields are returned
        expected_fields = {'coordinator_id', 'first_name', 'last_name', 'email', 'phone', 'department', 'role'}
        for item in response.data:
            self.assertEqual(set(item.keys()), expected_fields)

    def test_get_list_empty(self):
        """Test GET when no coordinators exist."""
        Coordinator.objects.all().delete()
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class CreateProfileViewTest(APITestCase):
    """Test CreateProfileView (POST /profile/create/)."""

    def setUp(self):
        self.url = '/profile/create/'

    @patch('backend.apps.profile.views.connection.cursor')
    def test_create_profile_success(self, mock_cursor):
        """Test successful creation of user and coordinator."""
        mock_cursor.return_value.__enter__.return_value.fetchone.return_value = None
        mock_cursor.return_value.__enter__.return_value.execute = MagicMock()

        data = {
            'email': 'newcoord@example.com',
            'first_name': 'New',
            'last_name': 'Coord',
            'phone': '5551234',
            'department': 'Sales',
            'role': 'Manager',
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], 'newcoord@example.com')
        self.assertTrue(User.objects.filter(username='newcoord@example.com').exists())
        self.assertTrue(Coordinator.objects.filter(email='newcoord@example.com').exists())
        coordinator = Coordinator.objects.get(email='newcoord@example.com')
        self.assertEqual(coordinator.first_name, 'New')
        self.assertEqual(coordinator.last_name, 'Coord')
        self.assertEqual(coordinator.role, 'Manager')

    def test_create_profile_missing_email(self):
        """Test that email is required."""
        response = self.client.post(self.url, {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_create_profile_duplicate_email(self):
        """Test that duplicate email raises error."""
        existing = CoordinatorFactory(email='duplicate@example.com')
        data = {'email': 'duplicate@example.com', 'first_name': 'Test'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('Ya existe un usuario', response.data['error'])


class ProfileDetailViewTest(APITestCase):
    """Test ProfileDetailView (GET /profile/<pk>/ and /profile/)."""

    def setUp(self):
        self.coordinator = CoordinatorFactory()
        self.url_detail = f'/profile/{self.coordinator.coordinator_id}/'
        self.url_root = '/profile/'

    def test_get_by_pk_returns_full_profile(self):
        """Test GET with pk returns personal and preferences."""
        response = self.client.get(self.url_detail)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('personal', response.data)
        self.assertIn('preferences', response.data)
        self.assertEqual(response.data['personal']['coordinator_id'], self.coordinator.coordinator_id)
        self.assertEqual(response.data['personal']['email'], self.coordinator.email)

    def test_get_root_returns_first_coordinator_when_anonymous(self):
        """Test that when no pk and user is anonymous, returns first coordinator."""
        # Make sure there is at least one
        response = self.client.get(self.url_root)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['personal']['coordinator_id'], self.coordinator.coordinator_id)

    def test_get_root_returns_404_when_no_coordinators(self):
        """Test that root returns 404 if no coordinators exist."""
        Coordinator.objects.all().delete()
        response = self.client.get(self.url_root)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_nonexistent_pk_returns_404(self):
        """Test GET with invalid pk returns 404."""
        response = self.client.get('/profile/99999/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UpdatePersonalViewTest(APITestCase):
    """Test UpdatePersonalView (PATCH /profile/personal/ and /profile/<pk>/personal/)."""

    def setUp(self):
        self.coordinator = CoordinatorFactory(first_name='Old', last_name='Name')
        self.url_personal_root = '/profile/personal/'
        self.url_personal_detail = f'/profile/{self.coordinator.coordinator_id}/personal/'

    def test_update_own_personal_anonymous_uses_first(self):
        """When anonymous and no pk, updates first coordinator."""
        new_data = {'first_name': 'UpdatedAnon'}
        response = self.client.patch(self.url_personal_root, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coordinator.refresh_from_db()
        self.assertEqual(self.coordinator.first_name, 'UpdatedAnon')

    def test_update_by_pk(self):
        """Test updating a specific coordinator by pk."""
        new_data = {'first_name': 'NewFirst', 'last_name': 'NewLast'}
        response = self.client.patch(self.url_personal_detail, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coordinator.refresh_from_db()
        self.assertEqual(self.coordinator.first_name, 'NewFirst')
        self.assertEqual(self.coordinator.last_name, 'NewLast')

    def test_update_invalid_field_ignored(self):
        """Test that sending an invalid field returns error."""
        new_data = {'invalid_field': 'value'}
        response = self.client.patch(self.url_personal_detail, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_nonexistent_pk_returns_404(self):
        """Test PATCH to nonexistent pk returns 404."""
        response = self.client.patch('/profile/99999/personal/', {'first_name': 'x'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class UpdatePreferencesViewTest(APITestCase):
    """Test UpdatePreferencesView (PATCH /profile/preferences/ and /profile/<pk>/preferences/)."""

    def setUp(self):
        self.coordinator = CoordinatorFactory(email_notifications=True, weekly_report=False)
        self.url_pref_root = '/profile/preferences/'
        self.url_pref_detail = f'/profile/{self.coordinator.coordinator_id}/preferences/'

    def test_update_preferences_anonymous_uses_first(self):
        """Anonymous updates first coordinator's preferences."""
        new_data = {'email_notifications': False, 'weekly_report': True}
        response = self.client.patch(self.url_pref_root, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coordinator.refresh_from_db()
        self.assertFalse(self.coordinator.email_notifications)
        self.assertTrue(self.coordinator.weekly_report)

    def test_update_preferences_by_pk(self):
        """Test updating preferences for a specific coordinator."""
        new_data = {'two_factor': True}
        response = self.client.patch(self.url_pref_detail, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coordinator.refresh_from_db()
        self.assertTrue(self.coordinator.two_factor)

    def test_update_partial_preferences(self):
        """Test that partial update works."""
        new_data = {'system_alerts': False}
        response = self.client.patch(self.url_pref_detail, new_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coordinator.refresh_from_db()
        self.assertFalse(self.coordinator.system_alerts)
        # Other fields unchanged
        self.assertTrue(self.coordinator.email_notifications)


class ChangePasswordViewTest(APITestCase):
    """Test ChangePasswordView (POST /profile/change-password/ and /profile/<pk>/change-password/)."""

    def setUp(self):
        self.user = UserFactory(username='testuser@example.com')
        self.user.set_password('OldPass123!')
        self.user.save()
        self.coordinator = CoordinatorFactory(user=self.user, email=self.user.email)
        self.url_pw_root = '/profile/change-password/'
        self.url_pw_detail = f'/profile/{self.coordinator.coordinator_id}/change-password/'

    def test_change_password_by_pk_no_current_check(self):
        """When changing by pk, no current password check is performed."""
        data = {
            'current_password': 'wrong',
            'new_password': 'NewStrongPass456!',
        }
        response = self.client.post(self.url_pw_detail, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass456!'))

    def test_change_password_own_requires_current_password(self):
        """When changing own password (no pk, authenticated user), current password must be correct."""
        # We need to simulate authentication. Since AllowAny is set, but the view checks
        # request.user for the "own" case. We'll force login.
        self.client.force_authenticate(user=self.user)
        data = {
            'current_password': 'WrongPass',
            'new_password': 'NewStrongPass456!',
        }
        response = self.client.post(self.url_pw_root, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('current_password', response.data)

        # Now with correct current password
        data['current_password'] = 'OldPass123!'
        response = self.client.post(self.url_pw_root, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass456!'))

    def test_change_password_anonymous_uses_first_coordinator(self):
        """Anonymous user posting to root changes first coordinator's user password without current check."""
        data = {
            'current_password': 'anything',
            'new_password': 'NewStrongPass789!',
        }
        response = self.client.post(self.url_pw_root, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('NewStrongPass789!'))

    def test_change_password_invalid_new_password(self):
        """Test that weak new password is rejected."""
        self.client.force_authenticate(user=self.user)
        data = {
            'current_password': 'OldPass123!',
            'new_password': '123',
        }
        response = self.client.post(self.url_pw_root, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('new_password', response.data)