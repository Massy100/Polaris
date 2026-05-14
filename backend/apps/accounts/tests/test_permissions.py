# backend/apps/accounts/tests/test_permissions.py
"""
Unit tests for permission classes
"""

from django.test import TestCase, RequestFactory
from django.contrib.auth.models import AnonymousUser
from rest_framework.test import force_authenticate
from rest_framework import status
from ..permissions import IsAdminUser, IsCoordinatorOrAdmin, CanManageCoordinators
from .factories import UserFactory, CoordinatorFactory
from ..models import User


class IsAdminUserPermissionTest(TestCase):
    """Test IsAdminUser permission"""

    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsAdminUser()
        self.admin_user = UserFactory(username='admin', is_staff=True)
        self.regular_user = UserFactory(username='regular', is_staff=False)

    def test_admin_user_has_permission(self):
        """Test 63: Admin user (is_staff=True) has permission"""
        request = self.factory.get('/')
        request.user = self.admin_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_regular_user_has_no_permission(self):
        """Test 64: Regular user (is_staff=False) has no permission"""
        request = self.factory.get('/')
        request.user = self.regular_user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_user_has_no_permission(self):
        """Test 65: Anonymous user has no permission"""
        request = self.factory.get('/')
        request.user = AnonymousUser()
        self.assertFalse(self.permission.has_permission(request, None))


class IsCoordinatorOrAdminPermissionTest(TestCase):
    """Test IsCoordinatorOrAdmin permission"""

    def setUp(self):
        self.factory = RequestFactory()
        self.permission = IsCoordinatorOrAdmin()
        self.admin_user = UserFactory(username='admin', is_staff=True)
        self.active_coordinator_user = UserFactory(username='coord_active')
        self.coordinator = CoordinatorFactory(user=self.active_coordinator_user, status='active')
        self.inactive_coordinator_user = UserFactory(username='coord_inactive')
        self.inactive_coordinator = CoordinatorFactory(user=self.inactive_coordinator_user, status='inactive')
        self.regular_user = UserFactory(username='regular', is_staff=False)

    def test_admin_user_has_permission(self):
        """Test 66: Admin user has permission"""
        request = self.factory.get('/')
        request.user = self.admin_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_active_coordinator_has_permission(self):
        """Test 67: Active coordinator has permission"""
        request = self.factory.get('/')
        request.user = self.active_coordinator_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_inactive_coordinator_has_no_permission(self):
        """Test 68: Inactive coordinator has no permission"""
        request = self.factory.get('/')
        request.user = self.inactive_coordinator_user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_regular_user_has_no_permission(self):
        """Test 69: Regular user (no coordinator) has no permission"""
        request = self.factory.get('/')
        request.user = self.regular_user
        self.assertFalse(self.permission.has_permission(request, None))

    def test_anonymous_user_has_no_permission(self):
        """Test 70: Anonymous user has no permission"""
        request = self.factory.get('/')
        request.user = AnonymousUser()
        self.assertFalse(self.permission.has_permission(request, None))


class CanManageCoordinatorsPermissionTest(TestCase):
    """Test CanManageCoordinators permission"""

    def setUp(self):
        self.factory = RequestFactory()
        self.permission = CanManageCoordinators()
        self.admin_user = UserFactory(is_staff=True)
        self.regular_user = UserFactory(is_staff=False)

    def test_admin_user_has_permission(self):
        """Test 71: Admin user has permission"""
        request = self.factory.get('/')
        request.user = self.admin_user
        self.assertTrue(self.permission.has_permission(request, None))

    def test_regular_user_has_no_permission(self):
        """Test 72: Regular user has no permission"""
        request = self.factory.get('/')
        request.user = self.regular_user
        self.assertFalse(self.permission.has_permission(request, None))