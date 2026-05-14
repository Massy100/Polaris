# backend/apps/assessment_360/tests/factories.py
"""
Factory Boy factories for assessment_360 models
"""

import factory
from factory.django import DjangoModelFactory
from ..models import Evaluationcriterion, Weightconfig, WeightconfigCriterion


class EvaluationCriterionFactory(DjangoModelFactory):
    """Factory for Evaluationcriterion model"""
    class Meta:
        model = Evaluationcriterion
        django_get_or_create = ('name',)

    name = factory.Sequence(lambda n: f"Teaching Quality {n}")
    description = factory.Faker('sentence')
    display_order = factory.Sequence(lambda n: n)
    is_deleted = False


class WeightConfigFactory(DjangoModelFactory):
    """Factory for Weightconfig model"""
    class Meta:
        model = Weightconfig

    name = factory.Sequence(lambda n: f"Config {n}")
    description = factory.Faker('sentence')
    status = Weightconfig.Status.INACTIVE
    is_deleted = False


class WeightConfigCriterionFactory(DjangoModelFactory):
    """Factory for WeightconfigCriterion model"""
    class Meta:
        model = WeightconfigCriterion

    weight_config = factory.SubFactory(WeightConfigFactory)
    criterion = factory.SubFactory(EvaluationCriterionFactory)
    percentage = factory.Faker('pydecimal', left=2, right=2, positive=True, min_value=1, max_value=100)
    is_deleted = False