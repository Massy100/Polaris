from django.shortcuts import render
from django.http import JsonResponse
from .models import Teacher

def get_teachers(request):
    teachers = list(Teacher.objects.values())
    return JsonResponse(teachers, safe=False)