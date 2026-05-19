# backend/apps/assessment_360/tests/test_integration.py
"""
Integration tests for assessment_360 - full workflows
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .factories import EvaluationCriterionFactory, WeightConfigFactory, WeightConfigCriterionFactory
from ..models import Weightconfig, Evaluationcriterion, WeightconfigCriterion


class WeightConfigWorkflowTest(TestCase):
    """Test complete workflow for weight configurations"""

    def setUp(self):
        self.client = APIClient()
        self.criteria = [
            EvaluationCriterionFactory(name="Teaching Quality", display_order=1),
            EvaluationCriterionFactory(name="Punctuality", display_order=2),
            EvaluationCriterionFactory(name="Accessibility", display_order=3),
        ]

    def test_full_crud_workflow(self):
        """Test 50: Create, list, retrieve, update, activate, delete workflow"""
        
        # Step 1: Create weight config with criteria
        create_payload = {
            'name': 'Semester 1 Config',
            'description': 'Evaluation weights for semester 1',
            'status': 'inactive',
            'criteria': [
                {'criterion_id': self.criteria[0].criterion_id, 'percentage': 50},
                {'criterion_id': self.criteria[1].criterion_id, 'percentage': 30},
                {'criterion_id': self.criteria[2].criterion_id, 'percentage': 20},
            ]
        }
        create_response = self.client.post(reverse('weightconfig-list'), create_payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        config_id = create_response.data['weight_config_id']
        
        # Step 2: List configs
        list_response = self.client.get(reverse('weightconfig-list'))
        self.assertEqual(list_response.data['count'], 1)
        
        # Step 3: Retrieve detail with criteria
        detail_url = reverse('weightconfig-detail', args=[config_id])
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(detail_response.data['criteria']), 3)
        self.assertEqual(detail_response.data['total_percentage'], 100)
        
        # Step 4: Update config name and criteria percentages
        update_payload = {
            'name': 'Semester 1 Updated',
            'criteria': [
                {'criterion_id': self.criteria[0].criterion_id, 'percentage': 40},
                {'criterion_id': self.criteria[1].criterion_id, 'percentage': 35},
                {'criterion_id': self.criteria[2].criterion_id, 'percentage': 25},
            ]
        }
        update_response = self.client.patch(detail_url, update_payload, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # Step 5: Activate config
        activate_url = reverse('weightconfig-activate', args=[config_id])
        activate_response = self.client.post(activate_url)
        self.assertEqual(activate_response.status_code, status.HTTP_200_OK)
        
        # Step 6: Verify active endpoint returns this config
        active_response = self.client.get(reverse('weightconfig-active'))
        self.assertEqual(active_response.data['weight_config_id'], config_id)
        
        # Step 7: Try to delete active config (should fail)
        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Step 8: Deactivate via another config activation (or manually set inactive)
        # For test, set inactive manually
        Weightconfig.objects.filter(weight_config_id=config_id).update(status='inactive')
        
        # Step 9: Delete now works
        delete_response = self.client.delete(detail_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # Verify soft delete
        config = Weightconfig.objects.get(weight_config_id=config_id)
        self.assertTrue(config.is_deleted)


class EvaluationCriterionWorkflowTest(TestCase):
    """Test complete workflow for evaluation criteria"""

    def setUp(self):
        self.client = APIClient()
        self.criterion = EvaluationCriterionFactory(name="Original Name")

    def test_criterion_crud_and_protection(self):
        """Test 51: Create, update, use in config, protection on delete"""
        
        # Step 1: Create criterion
        create_payload = {
            'name': 'New Criterion',
            'description': 'Test',
            'display_order': 5
        }
        create_response = self.client.post(reverse('evaluationcriterion-list'), create_payload, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        criterion_id = create_response.data['criterion_id']
        
        # Step 2: Update criterion
        update_url = reverse('evaluationcriterion-detail', args=[criterion_id])
        update_response = self.client.patch(update_url, {'name': 'Updated Criterion'}, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        
        # Step 3: Create weight config using this criterion
        config = WeightConfigFactory()
        WeightConfigCriterionFactory(weight_config=config, criterion_id=criterion_id, percentage=100)
        
        # Step 4: Try to delete criterion (should fail due to PROTECT)
        delete_response = self.client.delete(update_url)
        self.assertEqual(delete_response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Step 5: Delete the weight config link (soft delete)
        link = WeightconfigCriterion.objects.get(weight_config=config, criterion_id=criterion_id)
        link.is_deleted = True
        link.save()
        
        # Step 6: Now delete criterion should work
        delete_response = self.client.delete(update_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        criterion = Evaluationcriterion.objects.get(criterion_id=criterion_id)
        self.assertTrue(criterion.is_deleted)


class MultipleConfigActivationTest(TestCase):
    """Test that only one config can be active at a time"""

    def test_only_one_active_config(self):
        """Test 52: Activating a config deactivates previously active one"""
        # Create two inactive configs
        config1 = WeightConfigFactory(status='inactive')
        config2 = WeightConfigFactory(status='inactive')
        
        # Activate config1
        activate1_url = reverse('weightconfig-activate', args=[config1.weight_config_id])
        self.client.post(activate1_url)
        config1.refresh_from_db()
        config2.refresh_from_db()
        self.assertEqual(config1.status, 'active')
        self.assertEqual(config2.status, 'inactive')
        
        # Activate config2
        activate2_url = reverse('weightconfig-activate', args=[config2.weight_config_id])
        self.client.post(activate2_url)
        config1.refresh_from_db()
        config2.refresh_from_db()
        self.assertEqual(config1.status, 'inactive')
        self.assertEqual(config2.status, 'active')


class WeightConfigCriterionSyncTest(TestCase):
    """Test the sync logic in WeightConfigWriteSerializer"""

    def setUp(self):
        self.client = APIClient()
        self.criterion1 = EvaluationCriterionFactory()
        self.criterion2 = EvaluationCriterionFactory()

    def test_sync_creates_new_criteria_from_ids(self):
        """Test 53: Sync creates EvaluationCriterion if not exists"""
        payload = {
            'name': 'Sync Test',
            'criteria': [
                {'criterion_id': 9999, 'percentage': 60, 'name': 'Created Criterion', 'description': 'Auto created'},
                {'criterion_id': self.criterion1.criterion_id, 'percentage': 40}
            ]
        }
        response = self.client.post(reverse('weightconfig-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Check new criterion was created
        self.assertTrue(Evaluationcriterion.objects.filter(criterion_id=9999).exists())
        new_criterion = Evaluationcriterion.objects.get(criterion_id=9999)
        self.assertEqual(new_criterion.name, 'Created Criterion')

    def test_sync_updates_existing_criterion_metadata(self):
        """Test 54: Sync updates name/description of existing criterion"""
        criterion = EvaluationCriterionFactory(name="Old Name", description="Old desc")
        payload = {
            'name': 'Update Test',
            'criteria': [
                {'criterion_id': criterion.criterion_id, 'percentage': 100, 'name': 'New Name', 'description': 'New desc'}
            ]
        }
        response = self.client.post(reverse('weightconfig-list'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        criterion.refresh_from_db()
        self.assertEqual(criterion.name, 'New Name')
        self.assertEqual(criterion.description, 'New desc')