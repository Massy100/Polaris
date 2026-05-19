# backend/apps/academic_workload/tests/test_integration.py
"""
Integration tests for academic_workload - tests multiple components working together
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from .factories import (
    PeriodFactory, SectionFactory, CommentFactory, AcademicloadFactory
)
from apps.academic_career.tests.factories import TeacherFactory, CourseFactory
from apps.academic_workload.models import Comment, TeacherCourseScore


class FullWorkflowIntegrationTest(TestCase):
    """Test complete workflow from comments to AI analysis to scores"""

    def setUp(self):
        self.client = APIClient()
        self.teacher = TeacherFactory()
        self.course = CourseFactory(name="Advanced Mathematics")
        self.period = PeriodFactory(name="2024-1")
        self.section = SectionFactory(
            teacher=self.teacher,
            course=self.course,
            period=self.period,
            section_code="MATH401-01"
        )
        
        # Create realistic comments
        self.comments = [
            CommentFactory(section=self.section, text="El profesor explica con mucha claridad los conceptos complejos"),
            CommentFactory(section=self.section, text="Siempre llega puntual a clase y respeta el horario"),
            CommentFactory(section=self.section, text="Debería preparar mejor sus presentaciones, a veces son confusas"),
            CommentFactory(section=self.section, text="Muy accesible fuera de clase, resuelve todas las dudas"),
            CommentFactory(section=self.section, text="La carga de trabajos es muy alta para el tiempo disponible"),
        ]

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    @patch('apps.academic_workload.views.analyze_teacher')
    def test_complete_analysis_workflow(self, mock_analyze, mock_weight_config):
        """Test 61: Complete workflow - fetch periods, courses, run AI, get scores"""
        
        # Step 1: Get periods for teacher
        periods_url = reverse('academic_workload:teacher-periods')
        periods_response = self.client.get(periods_url, {
            'teacher_id': self.teacher.teacher_id
        })
        self.assertEqual(periods_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(periods_response.data['periods']), 1)
        
        # Step 2: Get courses for teacher in period
        courses_url = reverse('academic_workload:teacher-courses')
        courses_response = self.client.get(courses_url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id
        })
        self.assertEqual(courses_response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(courses_response.data['courses']), 1)
        self.assertEqual(courses_response.data['courses'][0]['name'], "Advanced Mathematics")
        
        # Step 3: Get comments before analysis
        comments_url = reverse('academic_workload:comments')
        comments_before = self.client.get(comments_url, {
            'teacher_id': self.teacher.teacher_id,
            'course_id': self.course.course_id,
            'period_id': self.period.period_id
        })
        # All comments should have null sentiment initially
        self.assertEqual(len(comments_before.data['positive']), 0)
        self.assertEqual(len(comments_before.data['negative']), 0)
        
        # Step 4: Mock weight config and AI analysis
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria:
            mock_criteria.return_value.select_related.return_value.order_by.return_value.exists.return_value = True
            mock_criteria.return_value.select_related.return_value.order_by.return_value.__iter__.return_value = [
                MagicMock(criterion=MagicMock(criterion_id=1, name="Claridad", display_order=1), percentage=40),
                MagicMock(criterion=MagicMock(criterion_id=2, name="Puntualidad", display_order=2), percentage=30),
                MagicMock(criterion=MagicMock(criterion_id=3, name="Accesibilidad", display_order=3), percentage=30),
            ]
            
            # Mock AI response
            mock_analyze.return_value = {
                'total_comments': 5,
                'positive_count': 3,
                'negative_count': 2,
                'comments': [
                    {'comment_id': self.comments[0].comment_id, 'sentiment': 'P'},
                    {'comment_id': self.comments[1].comment_id, 'sentiment': 'P'},
                    {'comment_id': self.comments[2].comment_id, 'sentiment': 'N'},
                    {'comment_id': self.comments[3].comment_id, 'sentiment': 'P'},
                    {'comment_id': self.comments[4].comment_id, 'sentiment': 'N'},
                ],
                'criteria_scores': [
                    {'criterion_id': 1, 'raw_score': 85, 'weighted_score': 34.0},
                    {'criterion_id': 2, 'raw_score': 90, 'weighted_score': 27.0},
                    {'criterion_id': 3, 'raw_score': 80, 'weighted_score': 24.0},
                ],
                'final_score': 85.0
            }
            
            # Step 5: Run AI analysis
            ai_url = reverse('academic_workload:ai-analysis')
            ai_response = self.client.post(ai_url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(ai_response.status_code, status.HTTP_200_OK)
            self.assertEqual(ai_response.data['final_score'], 85.0)
            self.assertEqual(ai_response.data['positive_count'], 3)
            self.assertEqual(ai_response.data['negative_count'], 2)
            
            # Step 6: Verify comments were updated with sentiment
            comments_after = self.client.get(comments_url, {
                'teacher_id': self.teacher.teacher_id,
                'course_id': self.course.course_id,
                'period_id': self.period.period_id
            })
            self.assertEqual(len(comments_after.data['positive']), 3)
            self.assertEqual(len(comments_after.data['negative']), 2)
            
            # Step 7: Get scores
            scores_url = reverse('academic_workload:course-scores')
            scores_response = self.client.get(scores_url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id
            })
            self.assertEqual(scores_response.status_code, status.HTTP_200_OK)
            self.assertIn(str(self.course.course_id), scores_response.data['scores'])
            self.assertEqual(scores_response.data['scores'][str(self.course.course_id)], 85.0)
            
            # Step 8: Verify teacher's average score was updated
            self.teacher.refresh_from_db()
            self.assertEqual(self.teacher.score, 85.0)

    def test_multiple_periods_and_courses_integration(self):
        """Test 62: Teacher with multiple periods and courses"""
        # Create additional period and course
        period2 = PeriodFactory(name="2024-2", start_date="2024-08-01", end_date="2024-12-15")
        course2 = CourseFactory(name="Linear Algebra")
        section2 = SectionFactory(
            teacher=self.teacher,
            course=course2,
            period=period2,
            section_code="MATH402-01"
        )
        CommentFactory(section=section2, text="Great course!")
        
        # Test periods endpoint shows both periods
        periods_url = reverse('academic_workload:teacher-periods')
        periods_response = self.client.get(periods_url, {
            'teacher_id': self.teacher.teacher_id
        })
        self.assertEqual(len(periods_response.data['periods']), 2)
        
        # Test courses for period 1
        courses_url = reverse('academic_workload:teacher-courses')
        courses_p1 = self.client.get(courses_url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id
        })
        self.assertEqual(len(courses_p1.data['courses']), 1)
        self.assertEqual(courses_p1.data['courses'][0]['name'], "Advanced Mathematics")
        
        # Test courses for period 2
        courses_p2 = self.client.get(courses_url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': period2.period_id
        })
        self.assertEqual(len(courses_p2.data['courses']), 1)
        self.assertEqual(courses_p2.data['courses'][0]['name'], "Linear Algebra")


class DatabaseConstraintIntegrationTest(TestCase):
    """Test database integrity constraints"""

    def test_unique_together_period_name(self):
        """Test 63: Cannot create two periods with same name"""
        PeriodFactory(name="Unique Period Name")
        with self.assertRaises(Exception):  # IntegrityError
            PeriodFactory(name="Unique Period Name")

    def test_unique_together_section(self):
        """Test 64: Cannot create duplicate section (course, period, section_code)"""
        course = CourseFactory()
        period = PeriodFactory()
        SectionFactory(course=course, period=period, section_code="DUPLICATE")
        with self.assertRaises(Exception):
            SectionFactory(course=course, period=period, section_code="DUPLICATE")

    def test_unique_together_academic_load(self):
        """Test 65: Cannot assign same teacher to same section twice"""
        teacher = TeacherFactory()
        section = SectionFactory()
        AcademicloadFactory(teacher=teacher, section=section)
        with self.assertRaises(Exception):
            AcademicloadFactory(teacher=teacher, section=section)

    def test_cascade_delete_protection(self):
        """Test 66: Deleting teacher doesn't delete sections (models.DO_NOTHING)"""
        teacher = TeacherFactory()
        section = SectionFactory(teacher=teacher)
        teacher.delete()
        # Section should still exist with teacher_id=null
        section.refresh_from_db()
        self.assertIsNone(section.teacher)