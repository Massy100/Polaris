from django.urls import path
from . import views

app_name = 'reporting'

urlpatterns = [
    path(
        "institutional-ranking/",
        views.institutional_ranking,
        name="institutional_ranking",
    ),
]
