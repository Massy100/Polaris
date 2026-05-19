# backend/apps/assessment_360/tests/test_serializers.py
"""
Unit tests for assessment_360 serializers
"""

from django.test import TestCase
from django.db import connection
from unittest.mock import patch, MagicMock
from ..serializers import (
    EvaluationCriterionSerializer, WeightConfigCriterionSerializer,
    WeightConfigSerializer, WeightConfigWriteSerializer,
    WeightConfigCriterionInputSerializer
)
from .factories import (
    EvaluationCriterionFactory, WeightConfigFactory, WeightConfigCriterionFactory
)
from ..models import Evaluationcriterion, Weightconfig, WeightconfigCriterion


class EvaluationCriterionSerializerTest(TestCase):
    """Test EvaluationCriterionSerializer"""

    def test_serializer_fields(self):
        """Test 16: Serializer includes expected fields"""
        criterion = EvaluationCriterionFactory()
        serializer = EvaluationCriterionSerializer(criterion)
        data = serializer.data
        
        expected_fields = ['criterion_id', 'name', 'description', 'display_order']
        for field in expected_fields:
            self.assertIn(field, data)


class WeightConfigCriterionSerializerTest(TestCase):
    """Test WeightConfigCriterionSerializer (nested)"""

    def test_serializer_contains_criterion_fields(self):
        """Test 17: Serializer includes criterion fields as source"""
        link = WeightConfigCriterionFactory(
            percentage=25.5,
            criterion__name="Test Criterion",
            criterion__description="Desc",
            criterion__display_order=3
        )
        serializer = WeightConfigCriterionSerializer(link)
        data = serializer.data
        
        self.assertEqual(data['criterion_id'], link.criterion.criterion_id)
        self.assertEqual(data['name'], "Test Criterion")
        self.assertEqual(data['description'], "Desc")
        self.assertEqual(data['percentage'], 25.5)
        self.assertEqual(data['display_order'], 3)


class WeightConfigSerializerTest(TestCase):
    """Test WeightConfigSerializer (read)"""

    def test_serializer_includes_criteria_and_total_percentage(self):
        """Test 18: Serializer includes computed criteria and total_percentage"""
        config = WeightConfigFactory()
        criterion1 = EvaluationCriterionFactory()
        criterion2 = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion1, percentage=60)
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion2, percentage=40)
        
        serializer = WeightConfigSerializer(config)
        data = serializer.data
        
        self.assertIn('criteria', data)
        self.assertEqual(len(data['criteria']), 2)
        self.assertIn('total_percentage', data)
        self.assertEqual(data['total_percentage'], 100)

    def test_total_percentage_calculation(self):
        """Test 19: total_percentage sums percentages correctly"""
        config = WeightConfigFactory()
        WeightConfigCriterionFactory(weight_config=config, percentage=30)
        WeightConfigCriterionFactory(weight_config=config, percentage=70)
        
        serializer = WeightConfigSerializer(config)
        self.assertEqual(serializer.data['total_percentage'], 100)

    def test_criteria_ordered_by_display_order(self):
        """Test 20: Criteria returned in display_order order"""
        config = WeightConfigFactory()
        c1 = EvaluationCriterionFactory(display_order=10)
        c2 = EvaluationCriterionFactory(display_order=1)
        c3 = EvaluationCriterionFactory(display_order=5)
        WeightConfigCriterionFactory(weight_config=config, criterion=c1)
        WeightConfigCriterionFactory(weight_config=config, criterion=c2)
        WeightConfigCriterionFactory(weight_config=config, criterion=c3)
        
        serializer = WeightConfigSerializer(config)
        criteria = serializer.data['criteria']
        display_orders = [c['display_order'] for c in criteria]
        self.assertEqual(display_orders, [1, 5, 10])

    def test_excludes_deleted_criteria(self):
        """Test 21: Deleted criteria_weights are excluded"""
        config = WeightConfigFactory()
        criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion, is_deleted=True)
        
        serializer = WeightConfigSerializer(config)
        self.assertEqual(len(serializer.data['criteria']), 0)


class WeightConfigCriterionInputSerializerTest(TestCase):
    """Test WeightConfigCriterionInputSerializer"""

    def test_valid_data(self):
        """Test 22: Valid input passes"""
        data = {
            'criterion_id': 1,
            'percentage': 50.00,
            'name': 'Quality',
            'description': 'Teaching quality'
        }
        serializer = WeightConfigCriterionInputSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_minimum_percentage(self):
        """Test 23: Percentage can be 0"""
        data = {'criterion_id': 1, 'percentage': 0}
        serializer = WeightConfigCriterionInputSerializer(data=data)
        self.assertTrue(serializer.is_valid())

    def test_maximum_percentage(self):
        """Test 24: Percentage can be 100"""
        data = {'criterion_id': 1, 'percentage': 100}
        serializer = WeightConfigCriterionInputSerializer(data=data)
        self.assertTrue(serializer.is_valid())


class WeightConfigWriteSerializerTest(TestCase):
    """Test WeightConfigWriteSerializer (create/update)"""

    def setUp(self):
        self.criterion1 = EvaluationCriterionFactory()
        self.criterion2 = EvaluationCriterionFactory()

    def test_valid_criteria_sum_100(self):
        """Test 25: Validation passes when percentages sum to 100"""
        data = {
            'name': 'New Config',
            'description': 'Test',
            'status': 'inactive',
            'criteria': [
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 60},
                {'criterion_id': self.criterion2.criterion_id, 'percentage': 40}
            ]
        }
        serializer = WeightConfigWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)

    def test_invalid_criteria_sum_not_100(self):
        """Test 26: Validation fails if sum != 100"""
        data = {
            'name': 'Bad Config',
            'criteria': [
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 30},
                {'criterion_id': self.criterion2.criterion_id, 'percentage': 30}
            ]
        }
        serializer = WeightConfigWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('La suma de porcentajes debe ser 100%', str(serializer.errors))

    def test_empty_criteria_list_fails(self):
        """Test 27: Empty criteria list fails validation"""
        data = {
            'name': 'No Criteria',
            'criteria': []
        }
        serializer = WeightConfigWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('Debe incluir al menos un criterio', str(serializer.errors))

    def test_duplicate_criterion_ids_fail(self):
        """Test 28: Duplicate criterion_ids fail"""
        data = {
            'name': 'Duplicate',
            'criteria': [
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 50},
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 50}
            ]
        }
        serializer = WeightConfigWriteSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('duplicados', str(serializer.errors))

    @patch('apps.assessment_360.serializers.connection.cursor')
    def test_create_with_criteria(self, mock_cursor):
        """Test 29: Create weight config with criteria using raw SQL"""
        mock_cursor_instance = MagicMock()
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance
        
        data = {
            'name': 'Created Config',
            'description': 'Created',
            'status': 'inactive',
            'criteria': [
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 55},
                {'criterion_id': self.criterion2.criterion_id, 'percentage': 45}
            ]
        }
        serializer = WeightConfigWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        config = serializer.save()
        
        self.assertEqual(config.name, 'Created Config')
        self.assertEqual(Weightconfig.objects.count(), 1)
        self.assertEqual(WeightconfigCriterion.objects.count(), 2)
        # Verify the sync method was called (cursor.executemany)
        mock_cursor_instance.executemany.assert_called_once()

    @patch('apps.assessment_360.serializers.connection.cursor')
    def test_create_creates_new_criteria_if_not_exist(self, mock_cursor):
        """Test 30: Create weight config with new criterion (not in DB)"""
        mock_cursor_instance = MagicMock()
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance
        
        # criterion_id that doesn't exist
        data = {
            'name': 'With New Criteria',
            'criteria': [
                {'criterion_id': 9999, 'percentage': 100, 'name': 'New Criterion', 'description': 'New desc'}
            ]
        }
        serializer = WeightConfigWriteSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        config = serializer.save()
        
        # Should create new Evaluationcriterion
        self.assertTrue(Evaluationcriterion.objects.filter(criterion_id=9999).exists())
        new_criterion = Evaluationcriterion.objects.get(criterion_id=9999)
        self.assertEqual(new_criterion.name, 'New Criterion')
        self.assertEqual(new_criterion.description, 'New desc')

    @patch('apps.assessment_360.serializers.connection.cursor')
    def test_update_replaces_criteria(self, mock_cursor):
        """Test 31: Update weight config replaces criteria"""
        mock_cursor_instance = MagicMock()
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance
        
        # Create initial config with one criterion
        config = WeightConfigFactory()
        old_criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=old_criterion, percentage=100)
        
        # Update with two different criteria
        data = {
            'name': 'Updated Name',
            'criteria': [
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 60},
                {'criterion_id': self.criterion2.criterion_id, 'percentage': 40}
            ]
        }
        serializer = WeightConfigWriteSerializer(config, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated = serializer.save()
        
        self.assertEqual(updated.name, 'Updated Name')
        # Old criterion should be soft-deleted (is_deleted=True)
        old_link = WeightconfigCriterion.objects.get(weight_config=config, criterion=old_criterion)
        self.assertTrue(old_link.is_deleted)
        # New criteria should exist and not be deleted
        self.assertEqual(WeightconfigCriterion.objects.filter(weight_config=config, is_deleted=False).count(), 2)

    @patch('apps.assessment_360.serializers.connection.cursor')
    def test_update_updates_criterion_name_and_description(self, mock_cursor):
        """Test 32: Update also updates existing criterion's name/description"""
        mock_cursor_instance = MagicMock()
        mock_cursor.return_value.__enter__.return_value = mock_cursor_instance
        
        criterion = EvaluationCriterionFactory(name="Old Name", description="Old desc")
        config = WeightConfigFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion, percentage=100)
        
        data = {
            'criteria': [
                {'criterion_id': criterion.criterion_id, 'percentage': 100, 'name': 'New Name', 'description': 'New desc'}
            ]
        }
        serializer = WeightConfigWriteSerializer(config, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        serializer.save()
        
        criterion.refresh_from_db()
        self.assertEqual(criterion.name, 'New Name')
        self.assertEqual(criterion.description, 'New desc')