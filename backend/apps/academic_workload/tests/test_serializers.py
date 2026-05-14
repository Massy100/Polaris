# backend/apps/academic_workload/tests/test_serializers.py
"""
Unit tests for academic_workload serializers
"""

from django.test import TestCase
from ..serializers import (
    PeriodSerializer, SectionSerializer, AcademicloadSerializer,
    CommentSerializer, AIAnalysisRequestSerializer
)
from .factories import (
    PeriodFactory, SectionFactory, AcademicloadFactory, CommentFactory
)


class PeriodSerializerTest(TestCase):
    """Test PeriodSerializer"""

    def test_period_serializer_fields(self):
        """Test 18: Period serializer includes all expected fields"""
        period = PeriodFactory()
        serializer = PeriodSerializer(period)
        data = serializer.data
        
        expected_fields = ['period_id', 'name', 'start_date', 'end_date', 'status']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_period_serializer_create(self):
        """Test 19: Period serializer can create new period"""
        data = {
            'name': 'New Period',
            'start_date': '2025-01-01',
            'end_date': '2025-06-30',
            'status': 'active'
        }
        serializer = PeriodSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        period = serializer.save()
        
        self.assertEqual(period.name, 'New Period')


class SectionSerializerTest(TestCase):
    """Test SectionSerializer"""

    def test_section_serializer_fields(self):
        """Test 20: Section serializer includes expected fields"""
        section = SectionFactory()
        serializer = SectionSerializer(section)
        data = serializer.data
        
        expected_fields = ['section_id', 'course', 'period', 'section_code', 'modality', 'status']
        for field in expected_fields:
            self.assertIn(field, data)

    def test_section_serializer_validation(self):
        """Test 21: Section serializer validates required fields"""
        serializer = SectionSerializer(data={})
        self.assertFalse(serializer.is_valid())


class AcademicloadSerializerTest(TestCase):
    """Test AcademicloadSerializer"""

    def test_academic_load_serializer_fields(self):
        """Test 22: AcademicLoad serializer includes expected fields"""
        academic_load = AcademicloadFactory()
        serializer = AcademicloadSerializer(academic_load)
        data = serializer.data
        
        expected_fields = ['academic_load_id', 'teacher', 'section', 'assigned_hours', 'status']
        for field in expected_fields:
            self.assertIn(field, data)


class CommentSerializerTest(TestCase):
    """Test CommentSerializer"""

    def test_comment_serializer_fields(self):
        """Test 23: Comment serializer includes all fields"""
        comment = CommentFactory()
        serializer = CommentSerializer(comment)
        data = serializer.data
        
        expected_fields = ['comment_id', 'section', 'text', 'sentiment_type', 'is_true_sentiment', 'created_at']
        for field in expected_fields:
            self.assertIn(field, data)


class AIAnalysisRequestSerializerTest(TestCase):
    """Test AIAnalysisRequestSerializer"""

    def test_valid_request_data(self):
        """Test 24: Valid request data passes validation"""
        data = {
            'teacher_id': 1,
            'period_id': 2,
            'course_id': 3
        }
        serializer = AIAnalysisRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_missing_fields_fail_validation(self):
        """Test 25: Missing required fields fail validation"""
        serializer = AIAnalysisRequestSerializer(data={'teacher_id': 1})
        self.assertFalse(serializer.is_valid())
        self.assertIn('period_id', serializer.errors)
        self.assertIn('course_id', serializer.errors)

    def test_invalid_data_types_fail(self):
        """Test 26: Invalid data types fail validation"""
        data = {
            'teacher_id': 'not_an_int',
            'period_id': 'also_not_int',
            'course_id': 3
        }
        serializer = AIAnalysisRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())