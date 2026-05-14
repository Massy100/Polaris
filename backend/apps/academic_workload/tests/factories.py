# backend/apps/academic_workload/tests/factories.py
"""
Factory Boy factories for academic_workload models
"""

import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from datetime import timedelta
from apps.academic_career.tests.factories import (
    TeacherFactory, CourseFactory, CareerFactory
)
from ..models import Period, Section, Academicload, Comment, TeacherCourseScore


class PeriodFactory(DjangoModelFactory):
    """Factory for Period model"""
    class Meta:
        model = Period
        django_get_or_create = ('name',)

    name = factory.Sequence(lambda n: f"2024-{n % 2 + 1}-Semester")
    start_date = factory.Faker('date_between', start_date='-90d', end_date='-60d')
    end_date = factory.Faker('date_between', start_date='-30d', end_date='today')
    status = "active"


class SectionFactory(DjangoModelFactory):
    """Factory for Section model"""
    class Meta:
        model = Section

    course = factory.SubFactory(CourseFactory)
    period = factory.SubFactory(PeriodFactory)
    teacher = factory.SubFactory(TeacherFactory)
    section_code = factory.Sequence(lambda n: f"SECT{n:03d}")
    modality = "presential"
    status = "active"


class AcademicloadFactory(DjangoModelFactory):
    """Factory for Academicload model"""
    class Meta:
        model = Academicload

    teacher = factory.SubFactory(TeacherFactory)
    section = factory.SubFactory(SectionFactory)
    assigned_hours = factory.Faker('random_int', min=2, max=8)
    status = "active"


class CommentFactory(DjangoModelFactory):
    """Factory for Comment model"""
    class Meta:
        model = Comment

    section = factory.SubFactory(SectionFactory)
    text = factory.Faker('sentence', nb_words=15)
    sentiment_type = None  # Will be set by AI
    is_true_sentiment = False
    created_at = factory.Faker('date_time_this_year')


class TeacherCourseScoreFactory(DjangoModelFactory):
    """Factory for TeacherCourseScore model"""
    class Meta:
        model = TeacherCourseScore

    teacher = factory.SubFactory(TeacherFactory)
    course = factory.SubFactory(CourseFactory)
    period = factory.SubFactory(PeriodFactory)
    final_score = factory.Faker('pyfloat', min_value=0, max_value=100, right_digits=2)
    criteria_scores = factory.Dict({
        'teaching_quality': 85.0,
        'punctuality': 90.0,
        'clarity': 80.0
    })