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
        """Util para que el frontend pueda verificar si la config suma 100."""
        relations = WeightconfigCriterion.objects.filter(
            weight_config=obj, is_deleted=False
        )
        return sum(r.percentage for r in relations if r.percentage is not None)


class WeightConfigCriterionInputSerializer(serializers.Serializer):
    criterion_id = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=6, decimal_places=2, min_value=0, max_value=100)


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
        existing_ids = set(
            Evaluationcriterion.objects
            .filter(criterion_id__in=ids, is_deleted=False)
            .values_list('criterion_id', flat=True)
        )
        missing = set(ids) - existing_ids
        if missing:
            raise serializers.ValidationError(
                f'Los siguientes criterion_id no existen: {sorted(missing)}'
            )

        if len(ids) != len(set(ids)):
            raise serializers.ValidationError('Hay criterion_id duplicados en la lista.')

        total = sum(item['percentage'] for item in value)
        if total != 100:
            raise serializers.ValidationError(
                f'La suma de porcentajes debe ser 100%, actual: {total}%'
            )

        return value

    def _sync_criteria(self, weight_config, criteria_data):
        """Sincroniza la relación WeightconfigCriterion con soft-delete."""
        incoming = {item['criterion_id']: item['percentage'] for item in criteria_data}

        WeightconfigCriterion.objects.filter(
            weight_config=weight_config
        ).exclude(
            criterion_id__in=incoming.keys()
        ).update(is_deleted=True)

        for criterion_id, percentage in incoming.items():
            WeightconfigCriterion.objects.update_or_create(
                weight_config=weight_config,
                criterion_id=criterion_id,
                defaults={'percentage': percentage, 'is_deleted': False},
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