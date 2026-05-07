# apps/assessment_360/serializers.py
from rest_framework import serializers
from .models import Weightconfig, WeightconfigCriterion, Evaluationcriterion
from django.db import connection
from django.db.models import Sum


class EvaluationCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluationcriterion
        fields = ['criterion_id', 'name', 'description', 'display_order']


class WeightConfigCriterionSerializer(serializers.ModelSerializer):
    criterion_id = serializers.IntegerField(source='criterion.criterion_id')
    name = serializers.CharField(source='criterion.name')
    description = serializers.CharField(source='criterion.description')
    display_order = serializers.IntegerField(source='criterion.display_order')

    class Meta:
        model = WeightconfigCriterion
        fields = ['criterion_id', 'name', 'description', 'percentage', 'display_order']


class WeightConfigSerializer(serializers.ModelSerializer):
    criteria = serializers.SerializerMethodField()
    total_percentage = serializers.SerializerMethodField()

    class Meta:
        model = Weightconfig
        fields = [
            'weight_config_id',
            'name',
            'description',
            'status',
            'created_at',
            'updated_at',
            'criteria',
            'total_percentage',
        ]

    def get_criteria(self, obj):
        criteria_relations = (
            WeightconfigCriterion.objects
            .filter(weight_config=obj, is_deleted=False)
            .select_related('criterion')
            .order_by('criterion__display_order')
        )
        self._criteria_relations_cache = criteria_relations
        return WeightConfigCriterionSerializer(criteria_relations, many=True).data

    def get_total_percentage(self, obj):
        cached = getattr(self, '_criteria_relations_cache', None)
        if cached is not None:
            return sum(r.percentage for r in cached if r.percentage is not None)

        result = WeightconfigCriterion.objects.filter(
            weight_config=obj, is_deleted=False
        ).aggregate(total=Sum('percentage'))
        return result['total'] or 0


class WeightConfigCriterionInputSerializer(serializers.Serializer):
    criterion_id = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0, max_value=100)
    name = serializers.CharField(required=False, allow_blank=True, default='')
    description = serializers.CharField(required=False, allow_blank=True, default='')


class WeightConfigWriteSerializer(serializers.ModelSerializer):
    criteria = WeightConfigCriterionInputSerializer(many=True, write_only=True)

    class Meta:
        model = Weightconfig
        fields = ['weight_config_id', 'name', 'description', 'status', 'criteria']
        read_only_fields = ['weight_config_id']

    def validate_criteria(self, value):
        if not value:
            raise serializers.ValidationError('Debe incluir al menos un criterio.')

        ids = [item['criterion_id'] for item in value]
        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Hay criterion_id duplicados en la lista.')

        total = sum(item['percentage'] for item in value)
        if total != 100:
            raise serializers.ValidationError(
                f'La suma de porcentajes debe ser 100%, actual: {total}%'
            )

        return value

    def _sync_criteria(self, weight_config, criteria_data):
        from django.utils import timezone

        incoming = {
            item['criterion_id']: {
                'percentage': item['percentage'],
                'name': item.get('name', ''),
                'description': item.get('description', ''),
            }
            for item in criteria_data
        }
        incoming_ids = set(incoming.keys())

        WeightconfigCriterion.objects.filter(
            weight_config=weight_config
        ).exclude(
            criterion_id__in=incoming_ids
        ).update(is_deleted=True)

        existing = {
            c.criterion_id: c
            for c in Evaluationcriterion.objects.filter(criterion_id__in=incoming_ids)
        }

        to_update = []
        to_create = []
        for criterion_id, data in incoming.items():
            if criterion_id in existing:
                criterion = existing[criterion_id]
                if data['name'] and criterion.name != data['name']:
                    criterion.name = data['name']
                    criterion.description = data['description']
                    to_update.append(criterion)
            else:
                to_create.append(Evaluationcriterion(
                    criterion_id=criterion_id,
                    name=data['name'] or f'Criterio {criterion_id}',
                    description=data['description'],
                    display_order=0,
                ))

        if to_update:
            Evaluationcriterion.objects.bulk_update(to_update, ['name', 'description'])
        if to_create:
            Evaluationcriterion.objects.bulk_create(to_create)

        now = timezone.now()
        params = [
            [weight_config.weight_config_id, criterion_id, data['percentage'], now, now]
            for criterion_id, data in incoming.items()
        ]
        with connection.cursor() as cursor:
            cursor.executemany("""
                INSERT INTO weightconfig_criterion
                    (weight_config_id, criterion_id, percentage, is_deleted, created_at, updated_at)
                VALUES (%s, %s, %s, false, %s, %s)
                ON CONFLICT (weight_config_id, criterion_id)
                DO UPDATE SET
                    percentage = EXCLUDED.percentage,
                    is_deleted = false,
                    updated_at = EXCLUDED.updated_at
            """, params)

    def create(self, validated_data):
        criteria_data = validated_data.pop('criteria')
        weight_config = Weightconfig.objects.create(**validated_data)
        self._sync_criteria(weight_config, criteria_data)
        return weight_config

    def update(self, instance, validated_data):
        criteria_data = validated_data.pop('criteria', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if criteria_data is not None:
            self._sync_criteria(instance, criteria_data)

        return instance
