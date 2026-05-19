# backend/apps/notifications/tests/test_models.py
"""
Unit tests for notifications models
"""

from django.test import TestCase
from django.db import IntegrityError
from django.utils import timezone
from .factories import (
    EventFactory, EventWithCommentFactory, EventWithLoadFactory,
    EventsubscriptionFactory, EventdeliveryFactory
)
from ..models import Event, Eventsubscription, Eventdelivery
from apps.academic_workload.tests.factories import CommentFactory, AcademicloadFactory
from apps.accounts.tests.factories import UserFactory


class EventModelTest(TestCase):
    """Test Event model"""

    def test_create_event_success(self):
        """Test 1: Creating an event works"""
        event = EventFactory(
            event_type="comment_added",
            processing_status="pending"
        )
        self.assertEqual(event.event_type, "comment_added")
        self.assertEqual(event.processing_status, "pending")
        self.assertIsNotNone(event.event_id)

    def test_event_str_method(self):
        """Test 2: String representation includes event_id and type"""
        event = EventFactory(event_type="test_event")
        self.assertIn("test_event", str(event))
        self.assertIn(str(event.event_id), str(event))

    def test_event_with_comment_relation(self):
        """Test 3: Event can be linked to a Comment"""
        comment = CommentFactory()
        event = EventWithCommentFactory(related_comment=comment)
        self.assertEqual(event.related_comment, comment)
        
        # Access from comment side (if related_name defined)
        self.assertEqual(comment.event_set.first(), event)

    def test_event_with_academic_load_relation(self):
        """Test 4: Event can be linked to an Academicload"""
        load = AcademicloadFactory()
        event = EventWithLoadFactory(related_load=load)
        self.assertEqual(event.related_load, load)

    def test_event_occurred_at_auto_now_add(self):
        """Test 5: occurred_at is set automatically if not provided"""
        event = EventFactory(occurred_at=None)
        # Factory may still set a value; we can create manually
        manual_event = Event.objects.create(event_type="manual")
        self.assertIsNotNone(manual_event.occurred_at)
        # Note: model doesn't have auto_now_add, but we can still test

    def test_event_nullable_fields(self):
        """Test 6: related_comment, related_load can be null"""
        event = EventFactory(related_comment=None, related_load=None)
        self.assertIsNone(event.related_comment)
        self.assertIsNone(event.related_load)


class EventsubscriptionModelTest(TestCase):
    """Test Eventsubscription model"""

    def test_create_subscription_success(self):
        """Test 7: Creating a subscription works"""
        user = UserFactory()
        subscription = EventsubscriptionFactory(
            user=user,
            event_type="teacher_created",
            channel="email",
            status="active"
        )
        self.assertEqual(subscription.user, user)
        self.assertEqual(subscription.event_type, "teacher_created")
        self.assertEqual(subscription.channel, "email")
        self.assertEqual(subscription.status, "active")

    def test_subscription_str_method(self):
        """Test 8: String representation shows user and event type"""
        user = UserFactory(username="juan")
        subscription = EventsubscriptionFactory(user=user, event_type="score_updated")
        self.assertIn("juan", str(subscription))
        self.assertIn("score_updated", str(subscription))

    def test_subscription_unique_together(self):
        """Test 9: Same user, event_type, channel cannot be duplicated"""
        user = UserFactory()
        event_type = "duplicate_event"
        channel = "email"
        EventsubscriptionFactory(user=user, event_type=event_type, channel=channel)
        with self.assertRaises(IntegrityError):
            EventsubscriptionFactory(user=user, event_type=event_type, channel=channel)

    def test_subscription_channel_choices(self):
        """Test 10: Channel can be various values (no explicit choices in model)"""
        subscription = EventsubscriptionFactory(channel="webhook")
        self.assertEqual(subscription.channel, "webhook")

    def test_subscription_status_nullable(self):
        """Test 11: Status can be null"""
        subscription = EventsubscriptionFactory(status=None)
        self.assertIsNone(subscription.status)


class EventdeliveryModelTest(TestCase):
    """Test Eventdelivery model"""

    def test_create_delivery_success(self):
        """Test 12: Creating an event delivery works"""
        event = EventFactory()
        subscription = EventsubscriptionFactory()
        delivery = EventdeliveryFactory(
            event=event,
            subscription=subscription,
            result="success",
            delivered_at=timezone.now()
        )
        self.assertEqual(delivery.event, event)
        self.assertEqual(delivery.subscription, subscription)
        self.assertEqual(delivery.result, "success")

    def test_delivery_str_method(self):
        """Test 13: String representation includes delivery_id and event"""
        delivery = EventdeliveryFactory()
        self.assertIn(str(delivery.delivery_id), str(delivery))
        self.assertIn(str(delivery.event.event_id), str(delivery))

    def test_delivery_result_nullable(self):
        """Test 14: result can be null or blank"""
        delivery = EventdeliveryFactory(result=None)
        self.assertIsNone(delivery.result)

    def test_delivery_result_detail_long_text(self):
        """Test 15: result_detail can store long error messages"""
        long_detail = "x" * 1000
        delivery = EventdeliveryFactory(result_detail=long_detail)
        self.assertEqual(len(delivery.result_detail), 1000)

    def test_cascade_behavior(self):
        """Test 16: Deleting event does NOT cascade to deliveries (models.DO_NOTHING)"""
        event = EventFactory()
        subscription = EventsubscriptionFactory()
        delivery = EventdeliveryFactory(event=event, subscription=subscription)
        # Delete event - should raise integrity error due to DO_NOTHING
        with self.assertRaises(IntegrityError):
            event.delete()
        # Instead, we just check that delivery still exists after event is (not deleted)
        # To avoid error, we skip deletion test and just verify relation
        self.assertEqual(delivery.event, event)