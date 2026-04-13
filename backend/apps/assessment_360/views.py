# apps/assessment_360/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response
from django.db import transaction
from .models import Weightconfig, WeightconfigCriterion, Evaluationcriterion
from .serializers import (
    WeightConfigSerializer,
    WeightConfigWriteSerializer,
    EvaluationCriterionSerializer,
)


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class WeightConfigViewSet(viewsets.ModelViewSet):
    
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return (
            Weightconfig.objects
            .filter(is_deleted=False)
            .prefetch_related('criteria_weights__criterion')
            .order_by('-created_at')
        )

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeightConfigWriteSerializer
        return WeightConfigSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.status == 'active':
            return Response(
                {'detail': 'No se puede eliminar la configuración activa.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            WeightconfigCriterion.objects.filter(
                weight_config=instance
            ).update(is_deleted=True)
            instance.is_deleted = True
            instance.save()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        weight_config = self.get_object()

        with transaction.atomic():
            Weightconfig.objects.filter(
                is_deleted=False,
                status='active'
            ).exclude(
                weight_config_id=weight_config.weight_config_id
            ).update(status='inactive')

            weight_config.status = 'active'
            weight_config.save()

        serializer = WeightConfigSerializer(weight_config)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='active')
    def active(self, request):
        active_config = (
            Weightconfig.objects
            .filter(status='active', is_deleted=False)
            .order_by('-created_at')
            .first()  
        )

        if not active_config:
            return Response(
                {'detail': 'No hay configuración activa.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = WeightConfigSerializer(active_config)
        return Response(serializer.data)

class EvaluationCriterionViewSet(viewsets.ModelViewSet):
    
    serializer_class = EvaluationCriterionSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        return (
            Evaluationcriterion.objects
            .filter(is_deleted=False)
            .order_by('display_order', 'criterion_id')
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        in_use = WeightconfigCriterion.objects.filter(
            criterion=instance,
            is_deleted=False,
        ).exists()

        if in_use:
            return Response(
                {'detail': 'No se puede eliminar un criterio que está en uso.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)