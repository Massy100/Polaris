# backend/apps/academic_career/tests/test_history_views.py
"""
Unit tests for history views (read-only endpoints)
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .factories import TeacherFactory, CourseFactory
from ..models import TeacherCourse


class TeacherWithCoursesViewSetTest(TestCase):
    """Test TeacherWithCoursesViewSet (history endpoint)"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('teachers-with-courses-list')
        
        # Create active teachers
        self.teacher1 = TeacherFactory(first_name="John", last_name="Doe", status="active")
        self.teacher2 = TeacherFactory(first_name="Jane", last_name="Smith", status="active")
        
        # Create inactive teacher (should be filtered out)
        self.teacher_inactive = TeacherFactory(first_name="Ghost", status="inactive")
        
        # Create courses and assign
        self.course1 = CourseFactory(name="Math")
        self.course2 = CourseFactory(name="Physics")
        self.teacher1.courses.add(self.course1, self.course2)
        self.teacher2.courses.add(self.course1)

    def test_only_active_teachers_returned(self):
        """Test 43: Only active teachers appear in history endpoint"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include teacher1 and teacher2 (2 total), NOT the inactive one
        self.assertEqual(len(response.data), 2)

    def test_ordered_by_teacher_id(self):
        """Test 44: Results ordered by teacher_id ascending"""
        response = self.client.get(self.url)
        data = response.data
        
        # Assuming teacher1 has lower ID if created first
        self.assertLess(data[0]['teacher_id'], data[1]['teacher_id'])

    def test_teacher_has_courses_nested(self):
        """Test 45: Each teacher includes their courses nested"""
        response = self.client.get(self.url)
        
        # Find teacher1 in response
        teacher1_data = next(t for t in response.data if t['teacher_id'] == self.teacher1.teacher_id)
        self.assertIn('courses', teacher1_data)
        self.assertEqual(len(teacher1_data['courses']), 2)
        
        course_names = [c['name'] for c in teacher1_data['courses']]
        self.assertIn("Math", course_names)
        self.assertIn("Physics", course_names)

    def test_teacher_fields_in_response(self):
        """Test 46: Response contains expected teacher fields"""
        response = self.client.get(self.url)
        teacher_data = response.data[0]
        
        expected_fields = ['teacher_id', 'first_name', 'last_name', 'full_name', 'email', 'status', 'courses']
        for field in expected_fields:
            self.assertIn(field, teacher_data)


class CourseWithTeachersViewSetTest(TestCase):
    """Test CourseWithTeachersViewSet (history endpoint)"""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('courses-with-teachers-list')
        
        # Create active courses
        self.course1 = CourseFactory(name="Data Structures", status="active")
        self.course2 = CourseFactory(name="Algorithms", status="active")
        
        # Create inactive course (should be filtered out)
        self.course_inactive = CourseFactory(name="Old Course", status="inactive")
        
        # Create teachers and assign
        self.teacher1 = TeacherFactory(first_name="Alan", last_name="Turing")
        self.teacher2 = TeacherFactory(first_name="Grace", last_name="Hopper")
        self.teacher1.courses.add(self.course1, self.course2)
        self.teacher2.courses.add(self.course1)

    def test_only_active_courses_returned(self):
        """Test 47: Only active courses appear in history endpoint"""
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include course1 and course2 (2 total), NOT the inactive one
        self.assertEqual(len(response.data), 2)

    def test_ordered_by_course_id(self):
        """Test 48: Results ordered by course_id ascending"""
        response = self.client.get(self.url)
        data = response.data
        
        self.assertLess(data[0]['course_id'], data[1]['course_id'])

    def test_course_has_teachers_nested(self):
        """Test 49: Each course includes its teachers nested"""
        response = self.client.get(self.url)
        
        # Find course1 in response
        course1_data = next(c for c in response.data if c['course_id'] == self.course1.course_id)
        self.assertIn('teachers', course1_data)
        self.assertEqual(len(course1_data['teachers']), 2)
        
        teacher_names = [t['full_name'] for t in course1_data['teachers']]
        self.assertIn("Alan Turing", teacher_names)
        self.assertIn("Grace Hopper", teacher_names)

    def test_course_fields_in_response(self):
        """Test 50: Response contains expected course fields"""
        response = self.client.get(self.url)
        course_data = response.data[0]
        
        expected_fields = ['course_id', 'name', 'credits', 'status', 'teachers']
        for field in expected_fields:
            self.assertIn(field, course_data)