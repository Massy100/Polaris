# apps/assessment_360/serializers.py
from rest_framework import serializers
from .models import Weightconfig, WeightconfigCriterion, Evaluationcriterion


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
        return WeightConfigCriterionSerializer(criteria_relations, many=True).data

    def get_total_percentage(self, obj):
        relations = WeightconfigCriterion.objects.filter(
            weight_config=obj, is_deleted=False
        )
        return sum(r.percentage for r in relations if r.percentage is not None)


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
        print('=== CRITERIA DATA RECIBIDA ===')
        for item in criteria_data:
            print(item)
        print('==============================')
        incoming = {
            item['criterion_id']: {
                'percentage': item['percentage'],
                'name': item.get('name', ''),
                'description': item.get('description', ''),
            }
            for item in criteria_data
        }

        WeightconfigCriterion.objects.filter(
            weight_config=weight_config
        ).exclude(
            criterion_id__in=incoming.keys()
        ).update(is_deleted=True)

        for criterion_id, data in incoming.items():
            existing = Evaluationcriterion.objects.filter(criterion_id=criterion_id).first()
            name = data['name'] or (existing.name if existing else f'Criterio {criterion_id}')
            
            criterion, _ = Evaluationcriterion.objects.update_or_create(
                criterion_id=criterion_id,
                defaults={
                    'name': name,
                    'description': data['description'],
                    'display_order': 0,
                    'is_deleted': False,
                }
            )
            WeightconfigCriterion.objects.update_or_create(
                weight_config=weight_config,
                criterion=criterion,
                defaults={'percentage': data['percentage'], 'is_deleted': False},
            )

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