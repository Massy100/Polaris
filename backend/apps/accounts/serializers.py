from rest_framework import serializers
from .models import User, Coordinator, CoordinatorCareer, CoordinatorFaculty


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'status', 'created_at']
        read_only_fields = ['user_id', 'created_at']


class CoordinatorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='user', write_only=True
    )
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Coordinator
        fields = ['coordinator_id', 'first_name', 'last_name', 'full_name', 
                 'status', 'user', 'user_id']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()


class CoordinatorCareerSerializer(serializers.ModelSerializer):
    coordinator_details = CoordinatorSerializer(source='coordinator', read_only=True)
    career_name = serializers.CharField(source='career.name', read_only=True)

    class Meta:
        model = CoordinatorCareer
        fields = ['coordinator', 'career', 'coordinator_details', 'career_name']


class CoordinatorFacultySerializer(serializers.ModelSerializer):
    coordinator_details = CoordinatorSerializer(source='coordinator', read_only=True)
    faculty_name = serializers.CharField(source='faculty.name', read_only=True)

    class Meta:
        model = CoordinatorFaculty
        fields = ['coordinator', 'faculty', 'coordinator_details', 'faculty_name']