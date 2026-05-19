# backend/apps/assessment_360/tests/test_views.py
"""
Unit tests for assessment_360 views
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .factories import (
    EvaluationCriterionFactory, WeightConfigFactory, WeightConfigCriterionFactory
)
from ..models import Weightconfig, WeightconfigCriterion, Evaluationcriterion


class EvaluationCriterionViewSetTest(TestCase):
    """Test EvaluationCriterion ViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('evaluationcriterion-list')
        self.criterion1 = EvaluationCriterionFactory(name="Criterion A")
        self.criterion2 = EvaluationCriterionFactory(name="Criterion B")
        self.deleted_criterion = EvaluationCriterionFactory(is_deleted=True)

    def test_list_criteria_excludes_deleted(self):
        """Test 33: GET /evaluation-criteria/ excludes soft-deleted"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)  # Only active ones

    def test_retrieve_criterion(self):
        """Test 34: GET /evaluation-criteria/{id}/ returns criterion"""
        detail_url = reverse('evaluationcriterion-detail', args=[self.criterion1.criterion_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Criterion A")

    def test_create_criterion(self):
        """Test 35: POST /evaluation-criteria/ creates new criterion"""
        payload = {
            'name': 'New Criterion',
            'description': 'Test description',
            'display_order': 10
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Evaluationcriterion.objects.filter(name='New Criterion').exists())

    def test_update_criterion(self):
        """Test 36: PUT /evaluation-criteria/{id}/ updates criterion"""
        detail_url = reverse('evaluationcriterion-detail', args=[self.criterion1.criterion_id])
        payload = {'name': 'Updated Name', 'description': 'Updated'}
        response = self.client.patch(detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.criterion1.refresh_from_db()
        self.assertEqual(self.criterion1.name, 'Updated Name')

    def test_delete_criterion_not_in_use(self):
        """Test 37: DELETE soft-deletes criterion if not in use"""
        # Create unused criterion
        unused = EvaluationCriterionFactory()
        detail_url = reverse('evaluationcriterion-detail', args=[unused.criterion_id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        unused.refresh_from_db()
        self.assertTrue(unused.is_deleted)

    def test_delete_criterion_in_use_returns_400(self):
        """Test 38: Cannot delete criterion that is used in a weight config"""
        config = WeightConfigFactory()
        criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion=criterion)
        
        detail_url = reverse('evaluationcriterion-detail', args=[criterion.criterion_id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se puede eliminar un criterio que está en uso', response.data['detail'])


class WeightConfigViewSetTest(TestCase):
    """Test WeightConfig ViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('weightconfig-list')
        self.config1 = WeightConfigFactory(name="Config 1", status='inactive')
        self.config2 = WeightConfigFactory(name="Config 2", status='active')
        self.deleted_config = WeightConfigFactory(is_deleted=True)

    def test_list_configs_excludes_deleted(self):
        """Test 39: GET /weight-configs/ excludes soft-deleted"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_retrieve_config_includes_criteria(self):
        """Test 40: GET /weight-configs/{id}/ includes nested criteria"""
        criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=self.config1, criterion=criterion, percentage=100)
        
        detail_url = reverse('weightconfig-detail', args=[self.config1.weight_config_id])
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('criteria', response.data)
        self.assertEqual(len(response.data['criteria']), 1)

    def test_create_config_with_criteria(self):
        """Test 41: POST /weight-configs/ creates config and criteria"""
        criterion1 = EvaluationCriterionFactory()
        criterion2 = EvaluationCriterionFactory()
        payload = {
            'name': 'New Weight Config',
            'description': 'Test',
            'status': 'inactive',
            'criteria': [
                {'criterion_id': criterion1.criterion_id, 'percentage': 60},
                {'criterion_id': criterion2.criterion_id, 'percentage': 40}
            ]
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Weightconfig.objects.count(), 3)  # 2 existing + 1 new
        self.assertEqual(WeightconfigCriterion.objects.count(), 2)

    def test_create_config_invalid_sum_returns_400(self):
        """Test 42: POST with invalid percentage sum returns 400"""
        criterion = EvaluationCriterionFactory()
        payload = {
            'name': 'Bad Config',
            'criteria': [
                {'criterion_id': criterion.criterion_id, 'percentage': 50}
            ]
        }
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('La suma de porcentajes debe ser 100%', str(response.data))

    def test_update_config(self):
        """Test 43: PUT /weight-configs/{id}/ updates config"""
        detail_url = reverse('weightconfig-detail', args=[self.config1.weight_config_id])
        payload = {'name': 'Updated Config Name'}
        response = self.client.patch(detail_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.config1.refresh_from_db()
        self.assertEqual(self.config1.name, 'Updated Config Name')

    def test_activate_action_sets_config_active_and_deactivates_others(self):
        """Test 44: POST /weight-configs/{id}/activate/ sets as active and others inactive"""
        # Create another active config
        other_active = WeightConfigFactory(status='active')
        self.config1.status = 'inactive'
        self.config1.save()
        
        activate_url = reverse('weightconfig-activate', args=[self.config1.weight_config_id])
        response = self.client.post(activate_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.config1.refresh_from_db()
        other_active.refresh_from_db()
        self.assertEqual(self.config1.status, 'active')
        self.assertEqual(other_active.status, 'inactive')

    def test_activate_action_deactivates_only_non_deleted(self):
        """Test 45: Activate does not affect soft-deleted configs"""
        deleted_config = WeightConfigFactory(is_deleted=True, status='active')
        self.config1.status = 'inactive'
        self.config1.save()
        
        activate_url = reverse('weightconfig-activate', args=[self.config1.weight_config_id])
        response = self.client.post(activate_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        deleted_config.refresh_from_db()
        self.assertEqual(deleted_config.status, 'active')  # Should remain active

    def test_active_action_returns_active_config(self):
        """Test 46: GET /weight-configs/active/ returns the active config"""
        active_config = WeightConfigFactory(status='active')
        url = reverse('weightconfig-active')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['weight_config_id'], active_config.weight_config_id)

    def test_active_action_404_if_no_active_config(self):
        """Test 47: GET /weight-configs/active/ returns 404 if none active"""
        Weightconfig.objects.all().update(status='inactive')
        url = reverse('weightconfig-active')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No hay configuración activa', response.data['detail'])

    def test_destroy_active_config_returns_400(self):
        """Test 48: DELETE on active config returns 400"""
        active_config = WeightConfigFactory(status='active')
        detail_url = reverse('weightconfig-detail', args=[active_config.weight_config_id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('No se puede eliminar la configuración activa', response.data['detail'])

    def test_destroy_inactive_config_soft_deletes(self):
        """Test 49: DELETE on inactive config soft-deletes it and its criteria"""
        inactive_config = WeightConfigFactory(status='inactive')
        criterion = EvaluationCriterionFactory()
        WeightConfigCriterionFactory(weight_config=inactive_config, criterion=criterion, percentage=100)
        
        detail_url = reverse('weightconfig-detail', args=[inactive_config.weight_config_id])
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        inactive_config.refresh_from_db()
        self.assertTrue(inactive_config.is_deleted)
        # Criteria links should be soft-deleted
        link = WeightconfigCriterion.objects.get(weight_config=inactive_config, criterion=criterion)
        self.assertTrue(link.is_deleted)