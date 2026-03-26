# apps/assessment_360/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import Weightconfig, WeightconfigCriterion, Evaluationcriterion
from .serializers import (
    WeightConfigSerializer, 
    WeightConfigCreateUpdateSerializer,
    EvaluationCriterionSerializer
)


class WeightConfigViewSet(viewsets.ModelViewSet):
    queryset = Weightconfig.objects.filter(is_deleted=False)
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return WeightConfigCreateUpdateSerializer
        return WeightConfigSerializer
    
    def perform_create(self, serializer):
        with transaction.atomic():
            weight_config = serializer.save()
            criteria_data = self.request.data.get('criteria', [])
            
            for criterion_data in criteria_data:
                criterion_id = criterion_data.get('id')
                percentage = criterion_data.get('percentage')
                
                # Buscar o crear el criterio
                criterion, _ = Evaluationcriterion.objects.get_or_create(
                    criterion_id=criterion_id,
                    defaults={
                        'name': criterion_data.get('name', f'Criterio {criterion_id}'),
                        'description': criterion_data.get('description', ''),
                        'display_order': criterion_data.get('display_order', 0)
                    }
                )
                
                WeightconfigCriterion.objects.create(
                    weight_config=weight_config,
                    criterion=criterion,
                    percentage=percentage
                )
    
    def perform_update(self, serializer):
        with transaction.atomic():
            weight_config = serializer.save()
            
            # Eliminar relaciones existentes
            WeightconfigCriterion.objects.filter(weight_config=weight_config).delete()
            
            # Crear nuevas relaciones
            criteria_data = self.request.data.get('criteria', [])
            for criterion_data in criteria_data:
                criterion_id = criterion_data.get('id')
                percentage = criterion_data.get('percentage')
                
                criterion, _ = Evaluationcriterion.objects.get_or_create(
                    criterion_id=criterion_id,
                    defaults={
                        'name': criterion_data.get('name', f'Criterio {criterion_id}'),
                        'description': criterion_data.get('description', ''),
                        'display_order': criterion_data.get('display_order', 0)
                    }
                )
                
                WeightconfigCriterion.objects.create(
                    weight_config=weight_config,
                    criterion=criterion,
                    percentage=percentage
                )
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        weight_config = self.get_object()
        
        # Desactivar otras configuraciones
        Weightconfig.objects.filter(
            is_deleted=False,
            status='active'
        ).exclude(weight_config_id=weight_config.weight_config_id).update(status='inactive')
        
        # Activar esta configuración
        weight_config.status = 'active'
        weight_config.save()
        
        return Response({
            'status': 'success',
            'message': f'Configuración activada correctamente'
        }, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        try:
            active_config = Weightconfig.objects.get(
                status='active',
                is_deleted=False
            )
            serializer = WeightConfigSerializer(active_config)
            return Response(serializer.data)
        except Weightconfig.DoesNotExist:
            return Response(
                {'detail': 'No hay configuración activa'},
                status=status.HTTP_404_NOT_FOUND
            )


class EvaluationCriterionViewSet(viewsets.ModelViewSet):
    queryset = Evaluationcriterion.objects.filter(is_deleted=False)
    serializer_class = EvaluationCriterionSerializer