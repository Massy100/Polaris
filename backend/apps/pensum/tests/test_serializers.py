# backend/apps/pensum/tests/test_serializers.py
"""
Unit tests for pensum serializers (if implemented)
"""

from django.test import TestCase
from ..serializers import PensumCourseSerializer  # asumiendo que existe
from .factories import PensumCourseFactory


class PensumCourseSerializerTest(TestCase):
    def test_serializer_fields(self):
        course = PensumCourseFactory()
        serializer = PensumCourseSerializer(course)
        data = serializer.data
        expected_fields = ['id', 'code', 'name', 'credits_theory', 'credits_practice', 'credits_total']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_serializer_validation(self):
        data = {'code': 'CS101', 'name': 'Programming', 'credits_theory': 3, 'credits_practice': 2}
        serializer = PensumCourseSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        course = serializer.save()
        self.assertEqual(course.credits_total, 5)