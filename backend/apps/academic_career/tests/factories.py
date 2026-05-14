# backend/apps/academic_career/tests/factories.py
"""
Factory Boy factories for generating test data
"""

import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from ..models import (
    Faculty, Career, Course, Teacher, TeacherTitle,
    TeacherMerit, TeacherCoordinatorOpinion, TeacherStudentSurvey
)


class FacultyFactory(DjangoModelFactory):
    """Factory for Faculty model"""
    class Meta:
        model = Faculty
        django_get_or_create = ('name',)

    name = factory.Sequence(lambda n: f"Faculty of Engineering {n}")
    status = "active"


class CareerFactory(DjangoModelFactory):
    """Factory for Career model"""
    class Meta:
        model = Career
        django_get_or_create = ('faculty', 'name')

    faculty = factory.SubFactory(FacultyFactory)
    name = factory.Sequence(lambda n: f"Computer Science {n}")
    status = "active"


class CourseFactory(DjangoModelFactory):
    """Factory for Course model"""
    class Meta:
        model = Course
        django_get_or_create = ('career', 'name')

    career = factory.SubFactory(CareerFactory)
    name = factory.Sequence(lambda n: f"Programming {n}")
    credits = 3
    status = "active"


class TeacherFactory(DjangoModelFactory):
    """Factory for Teacher model"""
    class Meta:
        model = Teacher

    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.Sequence(lambda n: f"teacher{n}@example.com")
    code = factory.Sequence(lambda n: f"TCH{n:04d}")
    phone = factory.Faker('phone_number')
    department = "Computer Science"
    since = factory.Faker('date', end_date=timezone.now().date())
    role = "professor"
    status = "active"
    score = 4.5
    manual_status = "approved"


class TeacherTitleFactory(DjangoModelFactory):
    """Factory for TeacherTitle model"""
    class Meta:
        model = TeacherTitle

    teacher = factory.SubFactory(TeacherFactory)
    phone = factory.Faker('phone_number')
    specialty = factory.Sequence(lambda n: f"Artificial Intelligence {n}")
    academic_degree = "PhD"
    experience_years = 5
    current_institution = "National University"
    status = "active"


class TeacherMeritFactory(DjangoModelFactory):
    """Factory for TeacherMerit model"""
    class Meta:
        model = TeacherMerit

    teacher = factory.SubFactory(TeacherFactory)
    merit_type = "Research Publication"
    description = factory.Faker('sentence')
    obtained_at = factory.Faker('date', end_date=timezone.now().date())
    granting_institution = "Science Foundation"
    status = "active"


class TeacherCoordinatorOpinionFactory(DjangoModelFactory):
    """Factory for TeacherCoordinatorOpinion model"""
    class Meta:
        model = TeacherCoordinatorOpinion

    teacher = factory.SubFactory(TeacherFactory)
    author = factory.Faker('name')
    opinion = factory.Faker('paragraph')
    rating = factory.Faker('random_int', min=1, max=5)
    opinion_date = factory.Faker('date', end_date=timezone.now().date())
    status = "active"


class TeacherStudentSurveyFactory(DjangoModelFactory):
    """Factory for TeacherStudentSurvey model"""
    class Meta:
        model = TeacherStudentSurvey

    teacher = factory.SubFactory(TeacherFactory)
    course = factory.SubFactory(CourseFactory)
    section = "A"
    author = factory.Faker('name')
    opinion = factory.Faker('paragraph')
    rating = factory.Faker('random_int', min=1, max=5)
    opinion_date = factory.Faker('date', end_date=timezone.now().date())
    status = "active"