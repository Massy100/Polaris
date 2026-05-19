# backend/apps/pensum/tests/factories.py
"""
Factory Boy factories for pensum models
"""

import factory
from factory.django import DjangoModelFactory
from ..models import PensumCourse


class PensumCourseFactory(DjangoModelFactory):
    """Factory for PensumCourse model"""
    class Meta:
        model = PensumCourse
        django_get_or_create = ('code',)

    code = factory.Sequence(lambda n: f"CS{n:03d}")
    name = factory.Sequence(lambda n: f"Course {n}")
    credits_theory = factory.Faker('random_int', min=1, max=6)
    credits_practice = factory.Faker('random_int', min=0, max=4)
    credits_total = factory.LazyAttribute(lambda o: o.credits_theory + o.credits_practice)