# backend/apps/academic_career/tests/test_models.py
"""
Unit tests for models
"""

from django.test import TestCase
from django.db import IntegrityError
from django.core.exceptions import ValidationError
from .factories import (
    FacultyFactory, CareerFactory, CourseFactory, TeacherFactory,
    TeacherTitleFactory, TeacherMeritFactory,
    TeacherCoordinatorOpinionFactory, TeacherStudentSurveyFactory
)
from ..models import Teacher, Course


class FacultyModelTest(TestCase):
    """Test Faculty model"""

    def test_create_faculty_success(self):
        """Test 1: Creating a faculty works correctly"""
        faculty = FacultyFactory(name="Engineering")
        self.assertEqual(faculty.name, "Engineering")
        self.assertEqual(faculty.status, "active")
        self.assertIsNotNone(faculty.faculty_id)

    def test_faculty_str_method(self):
        """Test 2: String representation returns name or fallback"""
        faculty = FacultyFactory(name="Medicine")
        self.assertEqual(str(faculty), "Medicine")
        
        faculty_no_name = FacultyFactory(name=None)
        self.assertIn("Facultad", str(faculty_no_name))

    def test_faculty_name_unique(self):
        """Test 3: Faculty name must be unique"""
        FacultyFactory(name="Law")
        with self.assertRaises(IntegrityError):
            FacultyFactory(name="Law")


class TeacherModelTest(TestCase):
    """Test Teacher model"""

    def test_teacher_full_name_property(self):
        """Test 4: full_name property returns correct formatted name"""
        teacher = TeacherFactory(first_name="John", last_name="Doe")
        self.assertEqual(teacher.full_name, "John Doe")

    def test_teacher_full_name_fallback(self):
        """Test 5: full_name works with missing names"""
        teacher1 = TeacherFactory(first_name="Jane", last_name=None)
        self.assertEqual(teacher1.full_name, "Jane")
        
        teacher2 = TeacherFactory(first_name=None, last_name="Smith")
        self.assertEqual(teacher2.full_name, "Smith")
        
        teacher3 = TeacherFactory(first_name=None, last_name=None)
        self.assertIn("Docente", teacher3.full_name)

    def test_teacher_email_unique(self):
        """Test 6: Email must be unique"""
        TeacherFactory(email="unique@example.com")
        with self.assertRaises(IntegrityError):
            TeacherFactory(email="unique@example.com")

    def test_teacher_code_unique(self):
        """Test 7: Teacher code must be unique"""
        TeacherFactory(code="ABC123")
        with self.assertRaises(IntegrityError):
            TeacherFactory(code="ABC123")

    def test_teacher_courses_many_to_many(self):
        """Test 8: Teacher can be assigned multiple courses"""
        teacher = TeacherFactory()
        course1 = CourseFactory(name="Math")
        course2 = CourseFactory(name="Physics")
        teacher.courses.add(course1, course2)
        
        self.assertEqual(teacher.courses.count(), 2)
        self.assertIn(course1, teacher.courses.all())
        self.assertIn(course2, teacher.courses.all())

    def test_courses_taught_property(self):
        """Test 9: courses_taught returns comma-separated course names"""
        teacher = TeacherFactory()
        course1 = CourseFactory(name="Algebra")
        course2 = CourseFactory(name="Calculus")
        teacher.courses.add(course1, course2)
        
        result = teacher.courses_taught
        self.assertIn("Algebra", result)
        self.assertIn("Calculus", result)

    def test_teacher_str_method(self):
        """Test 10: String representation returns full name"""
        teacher = TeacherFactory(first_name="Maria", last_name="Garcia")
        self.assertEqual(str(teacher), "Maria Garcia")


class TeacherTitleModelTest(TestCase):
    """Test TeacherTitle model"""

    def test_title_created_for_teacher(self):
        """Test 11: Title is correctly associated with teacher"""
        teacher = TeacherFactory()
        title = TeacherTitleFactory(teacher=teacher, academic_degree="Master")
        
        self.assertEqual(title.teacher, teacher)
        self.assertEqual(title.academic_degree, "Master")
        self.assertEqual(teacher.titles.count(), 1)

    def test_title_unique_together_constraint(self):
        """Test 12: Cannot duplicate same title for same teacher"""
        teacher = TeacherFactory()
        TeacherTitleFactory(
            teacher=teacher,
            specialty="Math",
            academic_degree="PhD",
            current_institution="University"
        )
        with self.assertRaises(IntegrityError):
            TeacherTitleFactory(
                teacher=teacher,
                specialty="Math",
                academic_degree="PhD",
                current_institution="University"
            )


class TeacherMeritModelTest(TestCase):
    """Test TeacherMerit model"""

    def test_merit_created_for_teacher(self):
        """Test 13: Merit is correctly associated with teacher"""
        teacher = TeacherFactory()
        merit = TeacherMeritFactory(teacher=teacher, merit_type="Award")
        
        self.assertEqual(merit.teacher, teacher)
        self.assertEqual(teacher.merits.count(), 1)


class TeacherCoordinatorOpinionModelTest(TestCase):
    """Test TeacherCoordinatorOpinion model"""

    def test_opinion_created_for_teacher(self):
        """Test 14: Coordinator opinion is correctly associated"""
        teacher = TeacherFactory()
        opinion = TeacherCoordinatorOpinionFactory(teacher=teacher, rating=5)
        
        self.assertEqual(opinion.teacher, teacher)
        self.assertEqual(opinion.rating, 5)


class TeacherStudentSurveyModelTest(TestCase):
    """Test TeacherStudentSurvey model"""

    def test_survey_created_for_teacher_and_course(self):
        """Test 15: Student survey links teacher and course"""
        teacher = TeacherFactory()
        course = CourseFactory()
        survey = TeacherStudentSurveyFactory(teacher=teacher, course=course, rating=4)
        
        self.assertEqual(survey.teacher, teacher)
        self.assertEqual(survey.course, course)
        self.assertEqual(survey.rating, 4)