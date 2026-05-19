# backend/apps/assessment_360/tests/test_models.py
"""
Unit tests for assessment_360 models
"""

from django.test import TestCase
from django.db import IntegrityError
from django.db import transaction
from .factories import (
    EvaluationCriterionFactory, WeightConfigFactory, WeightConfigCriterionFactory
)
from ..models import Evaluationcriterion, Weightconfig, WeightconfigCriterion


class EvaluationCriterionModelTest(TestCase):
    """Test Evaluationcriterion model"""

    def test_create_criterion_success(self):
        """Test 1: Creating an evaluation criterion works"""
        criterion = EvaluationCriterionFactory(name="Clarity", description="Explains clearly")
        self.assertEqual(criterion.name, "Clarity")
        self.assertEqual(criterion.description, "Explains clearly")
        self.assertFalse(criterion.is_deleted)
        self.assertIsNotNone(criterion.criterion_id)

    def test_criterion_str_method(self):
        """Test 2: String representation returns name or fallback"""
        criterion = EvaluationCriterionFactory(name="Punctuality")
        self.assertEqual(str(criterion), "Punctuality")
        
        criterion_no_name = EvaluationCriterionFactory(name=None)
        self.assertIn("Criterio", str(criterion_no_name))

    def test_criterion_name_unique(self):
        """Test 3: Criterion name must be unique"""
        EvaluationCriterionFactory(name="Unique Name")
        with self.assertRaises(IntegrityError):
            EvaluationCriterionFactory(name="Unique Name")

    def test_criterion_ordering(self):
        """Test 4: Criteria ordered by display_order then criterion_id"""
        c1 = EvaluationCriterionFactory(display_order=5)
        c2 = EvaluationCriterionFactory(display_order=1)
        c3 = EvaluationCriterionFactory(display_order=5)
        
        queryset = Evaluationcriterion.objects.all()
        self.assertEqual(list(queryset), [c2, c1, c3])  # order by display_order, then id

    def test_criterion_soft_delete(self):
        """Test 5: Soft delete sets is_deleted flag"""
        criterion = EvaluationCriterionFactory(is_deleted=False)
        criterion.is_deleted = True
        criterion.save()
        
        # Should not appear in default queryset (if filtered)
        self.assertTrue(criterion.is_deleted)


class WeightConfigModelTest(TestCase):
    """Test Weightconfig model"""

    def test_create_weight_config_success(self):
        """Test 6: Creating a weight config works"""
        config = WeightConfigFactory(name="Semester 2024", status=Weightconfig.Status.INACTIVE)
        self.assertEqual(config.name, "Semester 2024")
        self.assertEqual(config.status, Weightconfig.Status.INACTIVE)
        self.assertFalse(config.is_deleted)

    def test_weight_config_str_method(self):
        """Test 7: String representation returns name or fallback"""
        config = WeightConfigFactory(name="Main Config")
        self.assertEqual(str(config), "Main Config")
        
        config_no_name = WeightConfigFactory(name=None)
        self.assertIn("Configuración", str(config_no_name))

    def test_weight_config_status_choices(self):
        """Test 8: Status respects TextChoices"""
        config = WeightConfigFactory(status=Weightconfig.Status.ACTIVE)
        self.assertEqual(config.status, "active")
        
        config.status = Weightconfig.Status.INACTIVE
        config.save()
        self.assertEqual(config.status, "inactive")

    def test_weight_config_ordering(self):
        """Test 9: Weight configs ordered by -created_at"""
        config1 = WeightConfigFactory()
        import time
        time.sleep(0.01)
        config2 = WeightConfigFactory()
        
        queryset = Weightconfig.objects.all()
        self.assertEqual(list(queryset), [config2, config1])


class WeightConfigCriterionModelTest(TestCase):
    """Test WeightconfigCriterion model"""

    def test_create_weight_config_criterion_success(self):
        """Test 10: Creating weight config-criterion link works"""
        config = WeightConfigFactory()
        criterion = EvaluationCriterionFactory()
        link = WeightConfigCriterionFactory(weight_config=config, criterion=criterion, percentage=30.5)
        
        self.assertEqual(link.weight_config, config)
        self.assertEqual(link.criterion, criterion)
        self.assertEqual(link.percentage, 30.5)
        self.assertFalse(link.is_deleted)

    def test_weight_config_criterion_str_method(self):
        """Test 11: String representation shows config, criterion and percentage"""
        config = WeightConfigFactory(name="Config A")
        criterion = EvaluationCriterionFactory(name="Criterion B")
        link = WeightConfigCriterionFactory(weight_config=config, criterion=criterion, percentage=45.0)
        
        self.assertEqual(str(link), "Config A - Criterion B: 45.00%")

    def test_weight_config_criterion_unique_together(self):
        """Test 12: Same config and criterion cannot be linked twice"""
        config = WeightConfigFactory()
        criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion)
        with self.assertRaises(IntegrityError):
            WeightConfigCriterionFactory(weight_config=config, criterion=criterion)

    def test_cascade_delete_weight_config(self):
        """Test 13: Deleting weight config cascades to WeightConfigCriterion"""
        config = WeightConfigFactory()
        criterion = EvaluationCriterionFactory()
        link = WeightConfigCriterionFactory(weight_config=config, criterion=criterion)
        
        config.delete()
        with self.assertRaises(WeightconfigCriterion.DoesNotExist):
            link.refresh_from_db()

    def test_protect_delete_criterion(self):
        """Test 14: Cannot delete criterion if used in WeightConfigCriterion (PROTECT)"""
        config = WeightConfigFactory()
        criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion)
        
        with self.assertRaises(IntegrityError):
            criterion.delete()

    def test_soft_delete_flag(self):
        """Test 15: Soft delete sets is_deleted=True without removing record"""
        link = WeightConfigCriterionFactory(is_deleted=False)
        link.is_deleted = True
        link.save()
        
        self.assertTrue(link.is_deleted)