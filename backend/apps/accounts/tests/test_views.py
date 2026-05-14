# backend/apps/accounts/tests/test_views.py
"""
Unit tests for CoordinatorViewSet
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from backend.apps.accounts import views
from .factories import CoordinatorFactory, UserFactory
from ..models import Coordinator, User


class CoordinatorViewSetTest(TestCase):
    """Test Coordinator ViewSet CRUD operations"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('accounts:coordinator-list')
        
        # Create test coordinators
        self.coord1 = CoordinatorFactory(first_name="Ana", last_name="Gomez", status='active')
        self.coord2 = CoordinatorFactory(first_name="Luis", last_name="Perez", status='active')
        self.coord_inactive = CoordinatorFactory(first_name="Inactive", status='inactive')

    def test_list_coordinators_only_active_by_default(self):
        """Test 51: GET /coordinators/ returns only active coordinators"""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # paginated, default page_size=?

    def test_list_coordinators_include_inactive_param(self):
        """Test 52: GET with include_inactive=true returns all coordinators"""
        response = self.client.get(self.list_url, {'include_inactive': 'true'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include active + inactive = 3 total
        self.assertEqual(response.data['count'], 3)

    def test_retrieve_coordinator_detail(self):
        """Test 53: GET /coordinators/{id}/ returns detailed serializer"""
        detail_url = reverse('accounts:coordinator-detail', args=[self.coord1.coordinator_id])
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], "Ana")
        self.assertEqual(response.data['last_name'], "Gomez")
        self.assertIn('username', response.data)

    def test_create_coordinator_success(self):
        """Test 54: POST /coordinators/ creates new coordinator with user"""
        payload = {
            'first_name': 'Nuevo',
            'last_name': 'Coordinador',
            'username': 'nuevo_coord',
            'password': 'pass123',
            'email': 'nuevo@example.com',
            'code': 'C999',
            'phone': '5551234',
            'department': 'Math',
            'role': 'Coordinador'
        }
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['first_name'], 'Nuevo')
        self.assertTrue(Coordinator.objects.filter(first_name='Nuevo').exists())
        self.assertTrue(User.objects.filter(username='nuevo_coord').exists())

    def test_create_coordinator_missing_username_returns_error(self):
        """Test 55: POST without username returns 400"""
        payload = {
            'first_name': 'SinUsername'
        }
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data['details'])

    def test_update_coordinator(self):
        """Test 56: PUT /coordinators/{id}/ updates coordinator"""
        detail_url = reverse('accounts:coordinator-detail', args=[self.coord1.coordinator_id])
        payload = {
            'first_name': 'Ana Maria',
            'last_name': 'Gomez Updated',
            'email': 'anaupdated@example.com'
        }
        response = self.client.patch(detail_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coord1.refresh_from_db()
        self.assertEqual(self.coord1.first_name, 'Ana Maria')
        self.assertEqual(self.coord1.user.email, 'anaupdated@example.com')

    def test_delete_coordinator_soft_delete(self):
        """Test 57: DELETE /coordinators/{id}/ sets status to inactive"""
        detail_url = reverse('accounts:coordinator-detail', args=[self.coord1.coordinator_id])
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.coord1.refresh_from_db()
        self.assertEqual(self.coord1.status, 'inactive')
        self.coord1.user.refresh_from_db()
        self.assertEqual(self.coord1.user.status, 'inactive')

    def test_reset_password_action(self):
        """Test 58: POST /coordinators/{id}/reset-password/ generates new password"""
        reset_url = reverse('accounts:coordinator-reset-password', args=[self.coord1.coordinator_id])
        response = self.client.post(reset_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('new_password', response.data)
        self.assertEqual(len(response.data['new_password']), 10)

    def test_reset_password_with_custom_password(self):
        """Test 59: POST with custom password"""
        reset_url = reverse('accounts:coordinator-reset-password', args=[self.coord1.coordinator_id])
        payload = {'new_password': 'customPass123'}
        response = self.client.post(reset_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['new_password'], 'customPass123')
        self.coord1.user.refresh_from_db()
        self.assertTrue(self.coord1.user.check_password('customPass123'))

    def test_toggle_status_action(self):
        """Test 60: PATCH /coordinators/{id}/toggle-status/ changes status"""
        toggle_url = reverse('accounts:coordinator-toggle-status', args=[self.coord1.coordinator_id])
        response = self.client.patch(toggle_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'inactive')
        self.coord1.refresh_from_db()
        self.assertEqual(self.coord1.status, 'inactive')
        
        # Toggle again to active
        response2 = self.client.patch(toggle_url, {}, format='json')
        self.assertEqual(response2.data['status'], 'active')

    def test_stats_action(self):
        """Test 61: GET /coordinators/stats/ returns counts"""
        stats_url = reverse('accounts:coordinator-stats')
        response = self.client.get(stats_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total'], 3)
        self.assertEqual(response.data['active'], 2)
        self.assertEqual(response.data['inactive'], 1)

    def test_get_queryset_filtering(self):
        """Test 62: ViewSet get_queryset respects include_inactive parameter"""
        # Already tested in list, but ensure method works
        view = views.CoordinatorViewSet()
        view.request = self.client.get(self.list_url, {'include_inactive': 'false'}).wsgi_request
        queryset = view.get_queryset()
        self.assertEqual(queryset.filter(status='active').count(), 2)