# backend/apps/accounts/tests/factories.py
"""
Factory Boy factories for accounts models
"""

import factory
from factory.django import DjangoModelFactory
from django.contrib.auth.hashers import make_password
from ..models import User, Coordinator, CoordinatorCareer, CoordinatorFaculty
from apps.academic_career.tests.factories import CareerFactory, FacultyFactory


class UserFactory(DjangoModelFactory):
    """Factory for User model"""
    class Meta:
        model = User
        django_get_or_create = ('username',)

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    status = "active"

    @classmethod
    def _create(cls, model_class, *args, **kwargs):
        """Override to handle password hashing"""
        password = kwargs.pop('password', None)
        user = super()._create(model_class, *args, **kwargs)
        if password:
            user.set_password(password)
            user.save()
        return user


class CoordinatorFactory(DjangoModelFactory):
    """Factory for Coordinator model"""
    class Meta:
        model = Coordinator

    user = factory.SubFactory(UserFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    code = factory.Sequence(lambda n: f"COORD{n:04d}")
    phone = factory.Faker('phone_number')
    department = "Engineering"
    role = "Coordinador"
    since = factory.Faker('date')
    status = "active"


class CoordinatorCareerFactory(DjangoModelFactory):
    """Factory for CoordinatorCareer model"""
    class Meta:
        model = CoordinatorCareer

    coordinator = factory.SubFactory(CoordinatorFactory)
    career = factory.SubFactory(CareerFactory)


class CoordinatorFacultyFactory(DjangoModelFactory):
    """Factory for CoordinatorFaculty model"""
    class Meta:
        model = CoordinatorFaculty

    coordinator = factory.SubFactory(CoordinatorFactory)
    faculty = factory.SubFactory(FacultyFactory)