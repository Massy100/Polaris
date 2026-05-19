# backend/apps/academic_workload/tests/test_views.py
"""
Unit tests for academic_workload API views
"""

from xml.etree.ElementTree import Comment
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from .factories import (
    PeriodFactory, SectionFactory, TeacherCourseScore,
    CommentFactory, TeacherCourseScoreFactory
)
from apps.academic_career.tests.factories import TeacherFactory, CourseFactory


class TeacherPeriodsViewTest(TestCase):
    """Test TeacherPeriodsView"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('academic_workload:teacher-periods')
        self.teacher = TeacherFactory()
        self.period1 = PeriodFactory(name="2024-1")
        self.period2 = PeriodFactory(name="2024-2")
        
        # Create sections linking teacher to periods
        SectionFactory(teacher=self.teacher, period=self.period1)
        SectionFactory(teacher=self.teacher, period=self.period2)

    def test_get_periods_for_teacher_success(self):
        """Test 39: GET returns periods for valid teacher"""
        response = self.client.get(self.url, {'teacher_id': self.teacher.teacher_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['teacher_id'], self.teacher.teacher_id)
        self.assertEqual(len(response.data['periods']), 2)

    def test_get_periods_missing_teacher_id(self):
        """Test 40: Missing teacher_id returns 400"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('teacher_id es requerido', response.data['detail'])

    def test_get_periods_returns_empty_for_teacher_without_sections(self):
        """Test 41: Teacher with no sections returns empty periods list"""
        new_teacher = TeacherFactory()
        response = self.client.get(self.url, {'teacher_id': new_teacher.teacher_id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['periods']), 0)

    def test_periods_ordered_by_start_date_desc(self):
        """Test 42: Periods ordered by start_date descending"""
        response = self.client.get(self.url, {'teacher_id': self.teacher.teacher_id})
        
        dates = [p['start_date'] for p in response.data['periods']]
        self.assertEqual(dates, sorted(dates, reverse=True))


class TeacherCoursesInPeriodViewTest(TestCase):
    """Test TeacherCoursesInPeriodView"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('academic_workload:teacher-courses')
        self.teacher = TeacherFactory()
        self.period = PeriodFactory()
        self.course1 = CourseFactory(name="Math 101")
        self.course2 = CourseFactory(name="Physics 101")
        
        SectionFactory(teacher=self.teacher, period=self.period, course=self.course1)
        SectionFactory(teacher=self.teacher, period=self.period, course=self.course2)

    def test_get_courses_for_teacher_in_period(self):
        """Test 43: GET returns courses for teacher in specific period"""
        response = self.client.get(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['courses']), 2)
        course_names = [c['name'] for c in response.data['courses']]
        self.assertIn("Math 101", course_names)
        self.assertIn("Physics 101", course_names)

    def test_missing_params_returns_400(self):
        """Test 44: Missing teacher_id or period_id returns 400"""
        response = self.client.get(self.url, {'teacher_id': 1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        response = self.client.get(self.url, {'period_id': 1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_distinct_courses_only(self):
        """Test 45: Returns distinct courses even if multiple sections"""
        # Add another section for same course
        SectionFactory(teacher=self.teacher, period=self.period, course=self.course1)
        
        response = self.client.get(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id
        })
        
        # Should still be 2 distinct courses, not 3
        self.assertEqual(len(response.data['courses']), 2)


class TeacherCourseScoresViewTest(TestCase):
    """Test TeacherCourseScoresView"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('academic_workload:course-scores')
        self.teacher = TeacherFactory()
        self.period = PeriodFactory()
        self.course1 = CourseFactory()
        self.course2 = CourseFactory()
        
        TeacherCourseScoreFactory(
            teacher=self.teacher, period=self.period,
            course=self.course1, final_score=85.5
        )
        TeacherCourseScoreFactory(
            teacher=self.teacher, period=self.period,
            course=self.course2, final_score=92.0
        )

    def test_get_scores_for_teacher_in_period(self):
        """Test 46: GET returns scores for teacher in period"""
        response = self.client.get(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['scores']), 2)
        self.assertEqual(response.data['scores'][str(self.course1.course_id)], 85.5)
        self.assertEqual(response.data['scores'][str(self.course2.course_id)], 92.0)

    def test_scores_rounded_to_two_decimals(self):
        """Test 47: Scores are rounded to 2 decimal places"""
        TeacherCourseScoreFactory(
            teacher=self.teacher, period=self.period,
            course=CourseFactory(), final_score=87.666666
        )
        
        response = self.client.get(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id
        })
        
        for score in response.data['scores'].values():
            self.assertEqual(len(str(score).split('.')[-1]) <= 2, True)

    def test_empty_scores_for_teacher(self):
        """Test 48: Returns empty dict if no scores exist"""
        new_teacher = TeacherFactory()
        response = self.client.get(self.url, {
            'teacher_id': new_teacher.teacher_id,
            'period_id': self.period.period_id
        })
        
        self.assertEqual(response.data['scores'], {})


class TeacherCommentsViewTest(TestCase):
    """Test TeacherCommentsView"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('academic_workload:comments')
        self.teacher = TeacherFactory()
        self.course = CourseFactory()
        self.period = PeriodFactory()
        self.section = SectionFactory(
            teacher=self.teacher, course=self.course, period=self.period
        )
        
        CommentFactory(section=self.section, text="Great class!", sentiment_type="positive")
        CommentFactory(section=self.section, text="Very clear", sentiment_type="positive")
        CommentFactory(section=self.section, text="Too much homework", sentiment_type="negative")
        CommentFactory(section=self.section, text="", sentiment_type="positive")  # Empty should be filtered

    def test_get_comments_grouped_by_sentiment(self):
        """Test 49: GET returns comments grouped by positive/negative"""
        response = self.client.get(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'course_id': self.course.course_id,
            'period_id': self.period.period_id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['positive']), 2)  # Great class, Very clear
        self.assertEqual(len(response.data['negative']), 1)  # Too much homework

    def test_missing_params_returns_400(self):
        """Test 50: Missing any required param returns 400"""
        response = self.client.get(self.url, {'teacher_id': 1, 'course_id': 1})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_comments_for_course(self):
        """Test 51: Returns empty arrays if no comments"""
        new_course = CourseFactory()
        response = self.client.get(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'course_id': new_course.course_id,
            'period_id': self.period.period_id
        })
        
        self.assertEqual(response.data['positive'], [])
        self.assertEqual(response.data['negative'], [])


class TeacherAIAnalysisViewTest(TestCase):
    """Test TeacherAIAnalysisView - Most important/complex view"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('academic_workload:ai-analysis')
        self.teacher = TeacherFactory()
        self.course = CourseFactory()
        self.period = PeriodFactory()
        self.section = SectionFactory(
            teacher=self.teacher, course=self.course, period=self.period
        )
        
        # Create comments
        CommentFactory(section=self.section, text="Excellent teacher!")
        CommentFactory(section=self.section, text="Very clear explanations")
        CommentFactory(section=self.section, text="Could be more punctual")

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    @patch('apps.academic_workload.views.analyze_teacher')
    def test_ai_analysis_success(self, mock_analyze, mock_weight_config):
        """Test 52: Successful AI analysis saves scores and updates teacher"""
        # Mock weight config
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        # Mock criteria
        mock_criteria = MagicMock()
        mock_criteria.exists.return_value = True
        mock_criteria.order_by.return_value = [
            MagicMock(criterion=MagicMock(
                criterion_id=1, name="Clarity", description="", display_order=1
            ), percentage=50),
            MagicMock(criterion=MagicMock(
                criterion_id=2, name="Punctuality", description="", display_order=2
            ), percentage=50),
        ]
        
        # Need to patch the filter chain properly
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria_filter:
            mock_criteria_filter.return_value.select_related.return_value.order_by.return_value = mock_criteria.order_by.return_value
            
            # Mock analyze_teacher return
            mock_analyze.return_value = {
                'total_comments': 3,
                'positive_count': 2,
                'negative_count': 1,
                'comments': [
                    {'comment_id': 1, 'sentiment': 'P'},
                    {'comment_id': 2, 'sentiment': 'P'},
                    {'comment_id': 3, 'sentiment': 'N'},
                ],
                'criteria_scores': [
                    {'criterion_id': 1, 'raw_score': 85, 'weighted_score': 42.5},
                    {'criterion_id': 2, 'raw_score': 70, 'weighted_score': 35},
                ],
                'final_score': 77.5
            }
            
            response = self.client.post(self.url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data['final_score'], 77.5)
            self.assertEqual(response.data['positive_count'], 2)
            self.assertEqual(response.data['negative_count'], 1)

    def test_ai_analysis_no_comments(self):
        """Test 53: Returns 404 if no comments to analyze"""
        # Create section with no comments
        new_course = CourseFactory()
        new_section = SectionFactory(
            teacher=self.teacher, course=new_course, period=self.period
        )
        
        response = self.client.post(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id,
            'course_id': new_course.course_id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No hay comentarios', response.data['detail'])

    def test_ai_analysis_invalid_serializer(self):
        """Test 54: Invalid request data returns 400"""
        response = self.client.post(self.url, {
            'teacher_id': 'invalid'
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    def test_ai_analysis_no_weight_config(self, mock_weight_config):
        """Test 55: Returns 404 if no active weight configuration exists"""
        mock_weight_config.return_value.first.return_value = None
        
        response = self.client.post(self.url, {
            'teacher_id': self.teacher.teacher_id,
            'period_id': self.period.period_id,
            'course_id': self.course.course_id
        }, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn('No hay una configuración de pesos activa', response.data['detail'])

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    def test_ai_analysis_no_criteria_in_config(self, mock_weight_config):
        """Test 56: Returns 404 if weight config has no criteria"""
        # Mock weight config
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        # Mock empty criteria queryset
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria:
            mock_criteria.return_value.select_related.return_value.order_by.return_value.exists.return_value = False
            
            response = self.client.post(self.url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
            self.assertIn('no tiene criterios', response.data['detail'])

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    @patch('apps.academic_workload.views.analyze_teacher')
    def test_ai_analysis_updates_teacher_score_average(self, mock_analyze, mock_weight_config):
        """Test 57: AI analysis updates teacher's average score across all courses"""
        # Mock weight config
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        # Create existing scores for this teacher
        other_course = CourseFactory()
        TeacherCourseScoreFactory(
            teacher=self.teacher,
            course=other_course,
            period=self.period,
            final_score=80.0
        )
        
        # Mock criteria
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria:
            mock_criteria.return_value.select_related.return_value.order_by.return_value.exists.return_value = True
            mock_criteria.return_value.select_related.return_value.order_by.return_value.__iter__.return_value = [
                MagicMock(criterion=MagicMock(criterion_id=1, name="Clarity", display_order=1), percentage=50),
                MagicMock(criterion=MagicMock(criterion_id=2, name="Punctuality", display_order=2), percentage=50),
            ]
            
            # Mock analyze_teacher return
            mock_analyze.return_value = {
                'total_comments': 3,
                'positive_count': 2,
                'negative_count': 1,
                'comments': [
                    {'comment_id': 1, 'sentiment': 'P'},
                    {'comment_id': 2, 'sentiment': 'P'},
                    {'comment_id': 3, 'sentiment': 'N'},
                ],
                'criteria_scores': [
                    {'criterion_id': 1, 'raw_score': 85, 'weighted_score': 42.5},
                    {'criterion_id': 2, 'raw_score': 70, 'weighted_score': 35},
                ],
                'final_score': 77.5
            }
            
            response = self.client.post(self.url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Refresh teacher from DB and check updated average
            self.teacher.refresh_from_db()
            # Average of 80.0 (existing) and 77.5 (new) = 78.75
            self.assertAlmostEqual(self.teacher.score, 78.75, places=2)

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    @patch('apps.academic_workload.views.analyze_teacher')
    def test_ai_analysis_updates_comment_sentiments(self, mock_analyze, mock_weight_config):
        """Test 58: AI analysis updates sentiment_type for each comment"""
        # Mock weight config
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        # Get the actual comment IDs
        comments = Comment.objects.filter(section=self.section)
        comment_ids = [c.comment_id for c in comments]
        
        # Mock criteria
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria:
            mock_criteria.return_value.select_related.return_value.order_by.return_value.exists.return_value = True
            mock_criteria.return_value.select_related.return_value.order_by.return_value.__iter__.return_value = [
                MagicMock(criterion=MagicMock(criterion_id=1, name="Clarity", display_order=1), percentage=50),
                MagicMock(criterion=MagicMock(criterion_id=2, name="Punctuality", display_order=2), percentage=50),
            ]
            
            # Mock analyze_teacher return with sentiment mapping
            mock_analyze.return_value = {
                'total_comments': 3,
                'positive_count': 2,
                'negative_count': 1,
                'comments': [
                    {'comment_id': comment_ids[0], 'sentiment': 'P'},
                    {'comment_id': comment_ids[1], 'sentiment': 'P'},
                    {'comment_id': comment_ids[2], 'sentiment': 'N'},
                ],
                'criteria_scores': [
                    {'criterion_id': 1, 'raw_score': 85, 'weighted_score': 42.5},
                    {'criterion_id': 2, 'raw_score': 70, 'weighted_score': 35},
                ],
                'final_score': 77.5
            }
            
            response = self.client.post(self.url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify comments were updated
            updated_comments = Comment.objects.filter(section=self.section)
            sentiments = [c.sentiment_type for c in updated_comments]
            self.assertEqual(sentiments.count('positive'), 2)
            self.assertEqual(sentiments.count('negative'), 1)

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    @patch('apps.academic_workload.views.analyze_teacher')
    def test_ai_analysis_creates_or_updates_teacher_course_score(self, mock_analyze, mock_weight_config):
        """Test 59: AI analysis creates or updates TeacherCourseScore record"""
        # Mock weight config
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        # Verify no score exists yet
        self.assertFalse(TeacherCourseScore.objects.filter(
            teacher=self.teacher,
            course=self.course,
            period=self.period
        ).exists())
        
        # Mock criteria
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria:
            mock_criteria.return_value.select_related.return_value.order_by.return_value.exists.return_value = True
            mock_criteria.return_value.select_related.return_value.order_by.return_value.__iter__.return_value = [
                MagicMock(criterion=MagicMock(criterion_id=1, name="Clarity", display_order=1), percentage=50),
                MagicMock(criterion=MagicMock(criterion_id=2, name="Punctuality", display_order=2), percentage=50),
            ]
            
            mock_analyze.return_value = {
                'total_comments': 3,
                'positive_count': 2,
                'negative_count': 1,
                'comments': [
                    {'comment_id': 1, 'sentiment': 'P'},
                    {'comment_id': 2, 'sentiment': 'P'},
                    {'comment_id': 3, 'sentiment': 'N'},
                ],
                'criteria_scores': [
                    {'criterion_id': 1, 'raw_score': 85, 'weighted_score': 42.5},
                    {'criterion_id': 2, 'raw_score': 70, 'weighted_score': 35},
                ],
                'final_score': 77.5
            }
            
            response = self.client.post(self.url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            # Verify score was created
            score = TeacherCourseScore.objects.get(
                teacher=self.teacher,
                course=self.course,
                period=self.period
            )
            self.assertEqual(score.final_score, 77.5)
            self.assertEqual(score.criteria_scores, mock_analyze.return_value['criteria_scores'])

    @patch('apps.academic_workload.views.Weightconfig.objects.filter')
    @patch('apps.academic_workload.views.analyze_teacher')
    def test_ai_analysis_handles_ai_exception(self, mock_analyze, mock_weight_config):
        """Test 60: Handles AI service exceptions gracefully"""
        # Mock weight config
        mock_weight_config_instance = MagicMock()
        mock_weight_config_instance.weight_config_id = 1
        mock_weight_config.return_value.first.return_value = mock_weight_config_instance
        
        # Mock criteria
        with patch('apps.academic_workload.views.WeightconfigCriterion.objects.filter') as mock_criteria:
            mock_criteria.return_value.select_related.return_value.order_by.return_value.exists.return_value = True
            mock_criteria.return_value.select_related.return_value.order_by.return_value.__iter__.return_value = [
                MagicMock(criterion=MagicMock(criterion_id=1, name="Clarity", display_order=1), percentage=50),
            ]
            
            # Mock AI exception
            mock_analyze.side_effect = Exception("AI service timeout")
            
            response = self.client.post(self.url, {
                'teacher_id': self.teacher.teacher_id,
                'period_id': self.period.period_id,
                'course_id': self.course.course_id
            }, format='json')
            
            self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
            self.assertIn('Error al procesar la IA', response.data['detail'])