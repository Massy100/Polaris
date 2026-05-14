# backend/apps/accounts/tests/test_models.py
"""
Unit tests for accounts models
"""

from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth.hashers import check_password
from .factories import UserFactory, CoordinatorFactory, CoordinatorCareerFactory, CoordinatorFacultyFactory, FacultyFactory, CareerFactory
from ..models import User, Coordinator


class UserModelTest(TestCase):
    """Test User model"""

    def test_create_user_success(self):
        """Test 1: Creating a user works correctly"""
        user = UserFactory(username="john_doe", email="john@example.com")
        self.assertEqual(user.username, "john_doe")
        self.assertEqual(user.email, "john@example.com")
        self.assertEqual(user.status, "active")
        self.assertIsNotNone(user.user_id)

    def test_user_str_method(self):
        """Test 2: String representation returns username or fallback"""
        user = UserFactory(username="jane_doe")
        self.assertEqual(str(user), "jane_doe")
        
        user_no_username = UserFactory(username=None)
        self.assertIn(str(user_no_username.user_id), str(user_no_username))

    def test_set_password_and_check_password(self):
        """Test 3: Password hashing and verification work"""
        user = UserFactory()
        user.set_password("mysecret123")
        user.save()
        
        self.assertTrue(user.check_password("mysecret123"))
        self.assertFalse(user.check_password("wrongpass"))

    def test_password_hash_is_stored(self):
        """Test 4: Password hash is stored, not plain text"""
        user = UserFactory()
        user.set_password("securepass")
        user.save()
        
        self.assertIsNotNone(user.password_hash)
        self.assertNotEqual(user.password_hash, "securepass")
        self.assertTrue(user.password_hash.startswith('pbkdf2_'))

    def test_user_status_choices(self):
        """Test 5: User status respects choices"""
        user = UserFactory(status="active")
        self.assertEqual(user.status, "active")
        
        user.status = "inactive"
        user.save()
        self.assertEqual(user.status, "inactive")
        
        user.status = "suspended"
        user.save()
        self.assertEqual(user.status, "suspended")

    def test_user_username_unique(self):
        """Test 6: Username must be unique"""
        UserFactory(username="unique_user")
        with self.assertRaises(IntegrityError):
            UserFactory(username="unique_user")

    def test_user_email_not_required(self):
        """Test 7: Email can be null/blank"""
        user = UserFactory(email=None)
        self.assertIsNone(user.email)
        
        user2 = UserFactory(email="")
        self.assertEqual(user2.email, "")


class CoordinatorModelTest(TestCase):
    """Test Coordinator model"""

    def test_create_coordinator_success(self):
        """Test 8: Creating a coordinator works correctly"""
        coordinator = CoordinatorFactory(
            first_name="Maria",
            last_name="Lopez",
            code="C001"
        )
        self.assertEqual(coordinator.first_name, "Maria")
        self.assertEqual(coordinator.last_name, "Lopez")
        self.assertEqual(coordinator.code, "C001")
        self.assertEqual(coordinator.status, "active")
        self.assertIsNotNone(coordinator.user)

    def test_coordinator_str_method(self):
        """Test 9: String representation returns full name"""
        coordinator = CoordinatorFactory(first_name="Carlos", last_name="Ruiz")
        self.assertEqual(str(coordinator), "Carlos Ruiz")

    def test_coordinator_username_property(self):
        """Test 10: username property returns user's username"""
        user = UserFactory(username="carlos_admin")
        coordinator = CoordinatorFactory(user=user)
        self.assertEqual(coordinator.username, "carlos_admin")

    def test_coordinator_email_property(self):
        """Test 11: email property returns user's email"""
        user = UserFactory(email="carlos@example.com")
        coordinator = CoordinatorFactory(user=user)
        self.assertEqual(coordinator.email, "carlos@example.com")

    def test_coordinator_user_one_to_one(self):
        """Test 12: Coordinator has a one-to-one relationship with User"""
        user = UserFactory()
        coordinator = CoordinatorFactory(user=user)
        
        # Access from user side
        self.assertEqual(user.coordinator, coordinator)
        
        # Cannot create second coordinator with same user
        with self.assertRaises(Exception):  # IntegrityError
            CoordinatorFactory(user=user)

    def test_coordinator_status_choices(self):
        """Test 13: Coordinator status respects choices"""
        coordinator = CoordinatorFactory(status="active")
        self.assertEqual(coordinator.status, "active")
        
        coordinator.status = "inactive"
        coordinator.save()
        self.assertEqual(coordinator.status, "inactive")

    def test_coordinator_cascade_delete(self):
        """Test 14: Deleting user deletes coordinator (CASCADE)"""
        coordinator = CoordinatorFactory()
        user_id = coordinator.user.user_id
        coordinator.user.delete()
        
        with self.assertRaises(Coordinator.DoesNotExist):
            Coordinator.objects.get(coordinator_id=coordinator.coordinator_id)


class CoordinatorCareerModelTest(TestCase):
    """Test CoordinatorCareer model"""

    def test_create_coordinator_career(self):
        """Test 15: Creating coordinator-career assignment works"""
        coordinator_career = CoordinatorCareerFactory()
        self.assertIsNotNone(coordinator_career.coordinator)
        self.assertIsNotNone(coordinator_career.career)
        self.assertEqual(str(coordinator_career), f"{coordinator_career.coordinator} - {coordinator_career.career}")

    def test_coordinator_career_unique_together(self):
        """Test 16: Same coordinator cannot be assigned to same career twice"""
        coordinator = CoordinatorFactory()
        career = CareerFactory()
        CoordinatorCareerFactory(coordinator=coordinator, career=career)
        with self.assertRaises(IntegrityError):
            CoordinatorCareerFactory(coordinator=coordinator, career=career)

    def test_coordinator_career_one_to_one_coordinator(self):
        """Test 17: Coordinator can only have one career (OneToOneField)"""
        coordinator = CoordinatorFactory()
        career1 = CareerFactory()
        career2 = CareerFactory()
        CoordinatorCareerFactory(coordinator=coordinator, career=career1)
        with self.assertRaises(IntegrityError):
            CoordinatorCareerFactory(coordinator=coordinator, career=career2)


class CoordinatorFacultyModelTest(TestCase):
    """Test CoordinatorFaculty model"""

    def test_create_coordinator_faculty(self):
        """Test 18: Creating coordinator-faculty assignment works"""
        coordinator_faculty = CoordinatorFacultyFactory()
        self.assertIsNotNone(coordinator_faculty.coordinator)
        self.assertIsNotNone(coordinator_faculty.faculty)
        self.assertEqual(str(coordinator_faculty), f"{coordinator_faculty.coordinator} - {coordinator_faculty.faculty}")

    def test_coordinator_faculty_unique_together(self):
        """Test 19: Same coordinator cannot be assigned to same faculty twice"""
        coordinator = CoordinatorFactory()
        faculty = FacultyFactory()
        CoordinatorFacultyFactory(coordinator=coordinator, faculty=faculty)
        with self.assertRaises(IntegrityError):
            CoordinatorFacultyFactory(coordinator=coordinator, faculty=faculty)

    def test_coordinator_faculty_one_to_one_coordinator(self):
        """Test 20: Coordinator can only have one faculty (OneToOneField)"""
        coordinator = CoordinatorFactory()
        faculty1 = FacultyFactory()
        faculty2 = FacultyFactory()
        CoordinatorFacultyFactory(coordinator=coordinator, faculty=faculty1)
        with self.assertRaises(IntegrityError):
            CoordinatorFacultyFactory(coordinator=coordinator, faculty=faculty2)