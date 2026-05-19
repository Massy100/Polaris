# backend/apps/academic_workload/tests/test_models.py
"""
Unit tests for academic_workload models
"""

from django.test import TestCase
from django.db import IntegrityError
from django.utils import timezone
from .factories import (
    PeriodFactory, SectionFactory, AcademicloadFactory,
    CommentFactory, TeacherCourseScoreFactory
)
from apps.academic_career.tests.factories import TeacherFactory, CourseFactory


class PeriodModelTest(TestCase):
    """Test Period model"""

    def test_create_period_success(self):
        """Test 1: Creating a period works correctly"""
        period = PeriodFactory(name="2025-1 Semester")
        self.assertEqual(period.name, "2025-1 Semester")
        self.assertEqual(period.status, "active")
        self.assertIsNotNone(period.period_id)

    def test_period_name_unique(self):
        """Test 2: Period name must be unique"""
        PeriodFactory(name="Unique Period")
        with self.assertRaises(IntegrityError):
            PeriodFactory(name="Unique Period")

    def test_period_str_method(self):
        """Test 3: String representation returns name"""
        period = PeriodFactory(name="Fall 2024")
        self.assertEqual(str(period), "Fall 2024")


class SectionModelTest(TestCase):
    """Test Section model"""

    def test_create_section_success(self):
        """Test 4: Creating a section works correctly"""
        section = SectionFactory(section_code="CS101-01")
        self.assertEqual(section.section_code, "CS101-01")
        self.assertIsNotNone(section.course)
        self.assertIsNotNone(section.period)
        self.assertIsNotNone(section.teacher)

    def test_section_unique_together_constraint(self):
        """Test 5: course + period + section_code must be unique"""
        course = CourseFactory()
        period = PeriodFactory()
        SectionFactory(course=course, period=period, section_code="SAME")
        
        with self.assertRaises(IntegrityError):
            SectionFactory(course=course, period=period, section_code="SAME")

    def test_section_modality_choices(self):
        """Test 6: Section modality accepts valid values"""
        section = SectionFactory(modality="presential")
        self.assertEqual(section.modality, "presential")
        
        section_online = SectionFactory(modality="virtual")
        self.assertEqual(section_online.modality, "virtual")

    def test_section_teacher_nullable(self):
        """Test 7: Section teacher can be null"""
        section = SectionFactory(teacher=None)
        self.assertIsNone(section.teacher)


class AcademicloadModelTest(TestCase):
    """Test Academicload model"""

    def test_create_academic_load_success(self):
        """Test 8: Creating academic load works"""
        academic_load = AcademicloadFactory(assigned_hours=4)
        self.assertEqual(academic_load.assigned_hours, 4)
        self.assertEqual(academic_load.status, "active")

    def test_academic_load_unique_together(self):
        """Test 9: teacher + section must be unique"""
        teacher = TeacherFactory()
        section = SectionFactory()
        AcademicloadFactory(teacher=teacher, section=section)
        
        with self.assertRaises(IntegrityError):
            AcademicloadFactory(teacher=teacher, section=section)

    def test_academic_load_teacher_section_relationship(self):
        """Test 10: Academic load links teacher and section"""
        teacher = TeacherFactory()
        section = SectionFactory()
        academic_load = AcademicloadFactory(teacher=teacher, section=section)
        
        self.assertEqual(academic_load.teacher, teacher)
        self.assertEqual(academic_load.section, section)


class CommentModelTest(TestCase):
    """Test Comment model"""

    def test_create_comment_success(self):
        """Test 11: Creating a comment works"""
        comment = CommentFactory(text="Great teacher!")
        self.assertEqual(comment.text, "Great teacher!")
        self.assertFalse(comment.is_true_sentiment)
        self.assertIsNone(comment.sentiment_type)

    def test_comment_section_nullable(self):
        """Test 12: Comment section can be null"""
        comment = CommentFactory(section=None)
        self.assertIsNone(comment.section)

    def test_comment_created_at_auto(self):
        """Test 13: Comment created_at is set automatically"""
        comment = CommentFactory()
        self.assertIsNotNone(comment.created_at)


class TeacherCourseScoreModelTest(TestCase):
    """Test TeacherCourseScore model"""

    def test_create_score_success(self):
        """Test 14: Creating a teacher course score works"""
        score = TeacherCourseScoreFactory(final_score=87.5)
        self.assertEqual(score.final_score, 87.5)
        self.assertIsInstance(score.criteria_scores, dict)

    def test_score_unique_together(self):
        """Test 15: teacher + course + period must be unique"""
        teacher = TeacherFactory()
        course = CourseFactory()
        period = PeriodFactory()
        TeacherCourseScoreFactory(teacher=teacher, course=course, period=period)
        
        with self.assertRaises(IntegrityError):
            TeacherCourseScoreFactory(teacher=teacher, course=course, period=period)

    def test_criteria_scores_json_field(self):
        """Test 16: criteria_scores stores JSON data correctly"""
        criteria = {
            "teaching": 85.0,
            "punctuality": 90.0,
            "clarity": 78.5
        }
        score = TeacherCourseScoreFactory(criteria_scores=criteria)
        
        self.assertEqual(score.criteria_scores["teaching"], 85.0)
        self.assertEqual(score.criteria_scores["punctuality"], 90.0)
        self.assertEqual(len(score.criteria_scores), 3)

    def test_analyzed_at_auto_now_add(self):
        """Test 17: analyzed_at is set on creation"""
        score = TeacherCourseScoreFactory()
        self.assertIsNotNone(score.analyzed_at)