from django.urls import path
from . import views

urlpatterns = [
    # POSTS
    path('login/', views.login_view),
    path('register/', views.register_view),
    
    # GETS
    path('users/', views.users_list),
    path('users/<int:user_id>/', views.user_detail),
    path('coordinators/', views.coordinators_list),
    path('coordinators/<int:coordinator_id>/', views.coordinator_detail),
    path('coordinators/by-user/<int:user_id>/', views.coordinator_by_user),
    
    # HEALTH
    path('health/', views.health_check),
]