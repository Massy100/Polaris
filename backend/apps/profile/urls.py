from django.urls import path
from .views import (
    ProfileDetailView, 
    UpdatePersonalView, 
    UpdatePreferencesView, 
    ChangePasswordView,
    ProfileListView,
    CreateProfileView
)

urlpatterns = [
    path('', ProfileDetailView.as_view()),
    path('list/', ProfileListView.as_view()),
    path('create/', CreateProfileView.as_view()),
    path('personal/', UpdatePersonalView.as_view()),
    path('preferences/', UpdatePreferencesView.as_view()),
    path('change-password/', ChangePasswordView.as_view()),
    
    path('<int:pk>/', ProfileDetailView.as_view()),
    path('<int:pk>/personal/', UpdatePersonalView.as_view()),
    path('<int:pk>/preferences/', UpdatePreferencesView.as_view()),
    path('<int:pk>/change-password/', ChangePasswordView.as_view()),
]