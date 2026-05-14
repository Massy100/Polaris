# backend/apps/notifications/tests/factories.py
"""
Factory Boy factories for notifications models
"""

import factory
from factory.django import DjangoModelFactory
from django.utils import timezone
from apps.academic_workload.tests.factories import CommentFactory, AcademicloadFactory
from apps.accounts.tests.factories import UserFactory
from ..models import Event, Eventsubscription, Eventdelivery


class EventFactory(DjangoModelFactory):
    """Factory for Event model"""
    class Meta:
        model = Event

    event_type = factory.Sequence(lambda n: f"event_type_{n}")
    occurred_at = factory.Faker('date_time_this_year')
    related_comment = None
    related_load = None
    processing_status = "pending"
    details = factory.Faker('sentence')


class EventWithCommentFactory(EventFactory):
    """Event with a related comment"""
    related_comment = factory.SubFactory(CommentFactory)


class EventWithLoadFactory(EventFactory):
    """Event with a related academic load"""
    related_load = factory.SubFactory(AcademicloadFactory)


class EventsubscriptionFactory(DjangoModelFactory):
    """Factory for Eventsubscription model"""
    class Meta:
        model = Eventsubscription
        django_get_or_create = ('user', 'event_type', 'channel')

    user = factory.SubFactory(UserFactory)
    event_type = factory.Sequence(lambda n: f"event_{n}")
    channel = factory.Iterator(["email", "sms", "push"])
    status = "active"


class EventdeliveryFactory(DjangoModelFactory):
    """Factory for Eventdelivery model"""
    class Meta:
        model = Eventdelivery

    event = factory.SubFactory(EventFactory)
    subscription = factory.SubFactory(EventsubscriptionFactory)
    delivered_at = factory.Faker('date_time_this_year')
    result = "success"
    result_detail = ""