# backend/apps/academic_career/tests/test_views.py
"""
Unit tests for views (ViewSets)
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .factories import (
    TeacherFactory, CourseFactory, CareerFactory, FacultyFactory,
    TeacherTitleFactory, TeacherMeritFactory
)
from ..models import Teacher, Course


class TeacherViewSetTest(TestCase):
    """Test Teacher ViewSet CRUD operations"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('teacher-list')
        
        # Create test teachers
        self.teacher1 = TeacherFactory(first_name="Ana", last_name="Gomez", email="ana@test.com")
        self.teacher2 = TeacherFactory(first_name="Luis", last_name="Perez", email="luis@test.com")
        self.teacher_inactive = TeacherFactory(first_name="Inactive", last_name="User", status="inactive")

    def test_list_teachers_only_active(self):
        """Test 28: GET /teachers/ returns only active teachers"""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Only teacher1 and teacher2 are active, inactive is excluded
        self.assertEqual(response.data['count'], 2)

    def test_filter_teachers_by_search(self):
        """Test 29: Search by first_name, last_name, email, or code"""
        response = self.client.get(self.list_url, {'search': 'Ana'})
        self.assertEqual(response.data['count'], 1)
        
        response = self.client.get(self.list_url, {'search': 'Gomez'})
        self.assertEqual(response.data['count'], 1)
        
        response = self.client.get(self.list_url, {'search': 'ana@test.com'})
        self.assertEqual(response.data['count'], 1)

    def test_soft_delete_teacher(self):
        """Test 30: DELETE /teachers/{id}/ sets status to INACTIVE (not actual delete)"""
        detail_url = reverse('teacher-detail', args=[self.teacher1.teacher_id])
        response = self.client.delete(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher1.refresh_from_db()
        self.assertEqual(self.teacher1.status, "INACTIVE")

    def test_get_teacher_detail(self):
        """Test 31: GET /teachers/{id}/ returns full teacher details"""
        detail_url = reverse('teacher-detail', args=[self.teacher1.teacher_id])
        response = self.client.get(detail_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], "Ana")
        self.assertEqual(response.data['last_name'], "Gomez")

    def test_create_teacher(self):
        """Test 32: POST /teachers/ creates new teacher"""
        payload = {
            "first_name": "Carlos",
            "last_name": "Ruiz",
            "email": "carlos@test.com",
            "code": "TCH9999",
            "phone": "123456789",
            "department": "Math",
            "since": "2020-01-01",
            "role": "assistant",
            "status": "active"
        }
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Teacher.objects.filter(email="carlos@test.com").exists())

    def test_update_teacher(self):
        """Test 33: PUT /teachers/{id}/ updates teacher"""
        detail_url = reverse('teacher-detail', args=[self.teacher1.teacher_id])
        payload = {
            "first_name": "Ana Maria",
            "last_name": "Gomez Lopez",
            "email": "ana.updated@test.com",
            "code": self.teacher1.code,
            "status": "active"
        }
        response = self.client.put(detail_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.teacher1.refresh_from_db()
        self.assertEqual(self.teacher1.first_name, "Ana Maria")

    def test_assign_courses_to_teacher(self):
        """Test 34: POST /teachers/{id}/assign-courses/ assigns multiple courses"""
        course1 = CourseFactory()
        course2 = CourseFactory()
        assign_url = reverse('teacher-assign-courses', args=[self.teacher1.teacher_id])
        payload = {"course_ids": [course1.course_id, course2.course_id]}
        
        response = self.client.post(assign_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.teacher1.courses.count(), 2)

    def test_search_by_name_action(self):
        """Test 35: GET /teachers/search-by-name/?name=... searches by name"""
        search_url = reverse('teacher-search-by-name')
        response = self.client.get(search_url, {'name': 'Luis'})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['first_name'], "Luis")


class CourseViewSetTest(TestCase):
    """Test Course ViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('course-list')
        self.career = CareerFactory(name="Software Engineering")
        self.course1 = CourseFactory(career=self.career, name="Python Basics")
        self.course2 = CourseFactory(career=self.career, name="Django Advanced")

    def test_list_courses(self):
        """Test 36: GET /courses/ returns all courses"""
        response = self.client.get(self.list_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_filter_courses_by_career(self):
        """Test 37: Filter courses by career ID"""
        response = self.client.get(self.list_url, {'career': self.career.career_id})
        self.assertEqual(response.data['count'], 2)
        
        other_career = CareerFactory(name="Other")
        response = self.client.get(self.list_url, {'career': other_career.career_id})
        self.assertEqual(response.data['count'], 0)

    def test_filter_courses_by_search(self):
        """Test 38: Search courses by name"""
        response = self.client.get(self.list_url, {'search': 'Python'})
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], "Python Basics")


class FacultyViewSetTest(TestCase):
    """Test Faculty ViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('faculty-list')
        self.faculty1 = FacultyFactory(name="Engineering")
        self.faculty2 = FacultyFactory(name="Medicine")

    def test_list_faculties(self):
        """Test 39: GET /faculties/ returns all faculties"""
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_search_faculty_by_name(self):
        """Test 40: Search faculty by name"""
        response = self.client.get(self.list_url, {'search': 'Engineering'})
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['name'], "Engineering")


class TeacherTitleViewSetTest(TestCase):
    """Test TeacherTitle ViewSet"""

    def setUp(self):
        self.client = APIClient()
        self.list_url = reverse('teacher-title-list')
        self.teacher = TeacherFactory()
        self.title1 = TeacherTitleFactory(teacher=self.teacher, academic_degree="PhD")
        self.title2 = TeacherTitleFactory(teacher=self.teacher, academic_degree="Master")

    def test_list_titles_for_teacher(self):
        """Test 41: Filter teacher titles by teacher ID"""
        response = self.client.get(self.list_url, {'teacher': self.teacher.teacher_id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)

    def test_create_title_for_teacher(self):
        """Test 42: POST /teacher-titles/ creates new title"""
        payload = {
            "teacher": self.teacher.teacher_id,
            "specialty": "Cybersecurity",
            "academic_degree": "Bachelor",
            "experience_years": 3,
            "current_institution": "Tech University",
            "status": "active"
        }
        response = self.client.post(self.list_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.teacher.titles.count(), 3)