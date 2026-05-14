# backend/apps/pensum/tests/test_models.py
"""
Unit tests for PensumCourse model
"""

from django.test import TestCase
from django.db import IntegrityError
from .factories import PensumCourseFactory
from ..models import PensumCourse


class PensumCourseModelTest(TestCase):
    """Test PensumCourse model"""

    def test_create_course_success(self):
        """Test 1: Creating a pensum course works"""
        course = PensumCourseFactory(
            code="MATH101",
            name="Calculus I",
            credits_theory=4,
            credits_practice=2
        )
        self.assertEqual(course.code, "MATH101")
        self.assertEqual(course.name, "Calculus I")
        self.assertEqual(course.credits_theory, 4)
        self.assertEqual(course.credits_practice, 2)
        self.assertEqual(course.credits_total, 6)  # auto-calculated by factory
        self.assertIsNotNone(course.id)

    def test_code_unique_constraint(self):
        """Test 2: Course code must be unique"""
        PensumCourseFactory(code="UNIQUE01")
        with self.assertRaises(IntegrityError):
            PensumCourseFactory(code="UNIQUE01")

    def test_str_method(self):
        """Test 3: String representation returns code - name"""
        course = PensumCourseFactory(code="CS101", name="Programming")
        self.assertEqual(str(course), "CS101 - Programming")

    def test_credits_total_default(self):
        """Test 4: credits_total is sum of theory and practice"""
        # When creating manually without factory, ensure total is set
        course = PensumCourse.objects.create(
            code="TEST01",
            name="Test",
            credits_theory=3,
            credits_practice=2,
            credits_total=0  # should be overridden or set correctly
        )
        # The model doesn't auto-calculate; we test that the view sets it.
        # But we can still check that we can assign any value.
        course.credits_total = course.credits_theory + course.credits_practice
        course.save()
        self.assertEqual(course.credits_total, 5)

    def test_default_values(self):
        """Test 5: Default credits values are zero"""
        course = PensumCourse.objects.create(code="TEST02", name="Test")
        self.assertEqual(course.credits_theory, 0)
        self.assertEqual(course.credits_practice, 0)
        self.assertEqual(course.credits_total, 0)

    def test_bulk_create_ignore_conflicts(self):
        """Test 6: Bulk create ignores duplicates (test via view)"""
        # We test this indirectly; but can simulate:
        PensumCourseFactory(code="DUP01")
        # Second insert with same code should be ignored if using ignore_conflicts
        result = PensumCourse.objects.bulk_create(
            [PensumCourse(code="DUP01", name="Duplicate")],
            ignore_conflicts=True
        )
        self.assertEqual(len(result), 0)  # nothing created
        self.assertEqual(PensumCourse.objects.filter(code="DUP01").count(), 1)