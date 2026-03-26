# apps/assessment_360/serializers.py
from rest_framework import serializers
from .models import Weightconfig, WeightconfigCriterion, Evaluationcriterion


class EvaluationCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluationcriterion
        fields = ['criterion_id', 'name', 'description', 'display_order']


class WeightConfigCriterionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='criterion.criterion_id')
    name = serializers.CharField(source='criterion.name')
    description = serializers.CharField(source='criterion.description')
    display_order = serializers.IntegerField(source='criterion.display_order')
    
    class Meta:
        model = WeightconfigCriterion
        fields = ['id', 'name', 'description', 'percentage', 'display_order']


class WeightConfigSerializer(serializers.ModelSerializer):
    criteria = serializers.SerializerMethodField()
    
    class Meta:
        model = Weightconfig
        fields = ['weight_config_id', 'name', 'description', 'status', 'created_at', 'criteria']
    
    def get_criteria(self, obj):
        criteria_relations = WeightconfigCriterion.objects.filter(
            weight_config=obj,
            is_deleted=False
        ).select_related('criterion')
        
        return WeightConfigCriterionSerializer(criteria_relations, many=True).data


class WeightConfigCreateUpdateSerializer(serializers.ModelSerializer):
    criteria = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=True
    )
    
    class Meta:
        model = Weightconfig
        fields = ['weight_config_id', 'name', 'description', 'status', 'criteria']
    
    def validate_criteria(self, value):
        if value:
            total = sum(item.get('percentage', 0) for item in value)
            if total != 100:
                raise serializers.ValidationError(f'La suma debe ser 100%, actual: {total}%')
        return value