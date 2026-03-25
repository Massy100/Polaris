from django.urls import path
from .views import get_teachers

app_name = 'academic_career'

urlpatterns = [
    path('teachers/', get_teachers),
]