# backend/apps/academic_career/tests/test_serializers.py
"""
Unit tests for serializers
"""

from django.test import TestCase
from ..serializers import (
    TeacherSerializer, TeacherListSerializer, CourseSerializer,
    CareerSerializer, FacultySerializer, TeacherTitleSerializer,
    TeacherMeritSerializer, TeacherCoordinatorOpinionSerializer,
    TeacherStudentSurveySerializer
)
from .factories import (
    TeacherFactory, CourseFactory, CareerFactory, FacultyFactory,
    TeacherTitleFactory, TeacherMeritFactory,
    TeacherCoordinatorOpinionFactory, TeacherStudentSurveyFactory
)


class TeacherSerializerTest(TestCase):
    """Test TeacherSerializer (full detail)"""

    def setUp(self):
        self.teacher = TeacherFactory()
        self.course1 = CourseFactory(name="Math 101")
        self.course2 = CourseFactory(name="Physics 101")
        self.teacher.courses.add(self.course1, self.course2)

    def test_teacher_serializer_contains_expected_fields(self):
        """Test 16: Serializer includes all expected fields"""
        serializer = TeacherSerializer(self.teacher)
        data = serializer.data
        
        expected_fields = [
            'teacher_id', 'first_name', 'last_name', 'full_name', 'code',
            'email', 'phone', 'department', 'since', 'role', 'courses_detail',
            'courses_taught', 'specialties', 'titles', 'merits',
            'coordinator_opinions', 'student_surveys', 'status', 'score',
            'manual_status', 'created_at', 'updated_at'
        ]
        for field in expected_fields:
            self.assertIn(field, data)

    def test_teacher_serializer_courses_detail(self):
        """Test 17: courses_detail shows nested course info"""
        serializer = TeacherSerializer(self.teacher)
        courses_detail = serializer.data['courses_detail']
        
        self.assertEqual(len(courses_detail), 2)
        course_names = [c['name'] for c in courses_detail]
        self.assertIn("Math 101", course_names)
        self.assertIn("Physics 101", course_names)

    def test_teacher_serializer_courses_taught(self):
        """Test 18: courses_taught returns comma-separated string"""
        serializer = TeacherSerializer(self.teacher)
        courses_taught = serializer.data['courses_taught']
        
        self.assertIn("Math 101", courses_taught)
        self.assertIn("Physics 101", courses_taught)

    def test_teacher_serializer_get_full_name(self):
        """Test 19: get_full_name method works correctly"""
        teacher = TeacherFactory(first_name="Alice", last_name="Wonderland")
        serializer = TeacherSerializer(teacher)
        
        self.assertEqual(serializer.data['full_name'], "Alice Wonderland")

    def test_teacher_serializer_specialties_from_titles(self):
        """Test 20: specialties extracts unique active titles"""
        TeacherTitleFactory(teacher=self.teacher, specialty="AI", status="active")
        TeacherTitleFactory(teacher=self.teacher, specialty="ML", status="active")
        TeacherTitleFactory(teacher=self.teacher, specialty="AI", status="inactive")  # inactive ignored
        
        serializer = TeacherSerializer(self.teacher)
        specialties = serializer.data['specialties']
        
        self.assertIn("AI", specialties)
        self.assertIn("ML", specialties)
        self.assertEqual(len(specialties), 2)  # unique, active only


class TeacherListSerializerTest(TestCase):
    """Test TeacherListSerializer (list view)"""

    def setUp(self):
        self.teacher = TeacherFactory(score=4.2)
        TeacherTitleFactory(teacher=self.teacher, specialty="Data Science", status="active")
        TeacherStudentSurveyFactory(teacher=self.teacher, rating=5)
        TeacherCoordinatorOpinionFactory(teacher=self.teacher, rating=4)

    def test_teacher_list_serializer_limited_fields(self):
        """Test 21: List serializer has fewer fields than detail"""
        serializer = TeacherListSerializer(self.teacher)
        data = serializer.data
        
        expected_fields = [
            'teacher_id', 'first_name', 'last_name', 'full_name', 'code',
            'email', 'courses_taught', 'specialties', 'rating', 'status',
            'score', 'manual_status'
        ]
        for field in expected_fields:
            self.assertIn(field, data)
        
        # These should NOT be in list serializer
        self.assertNotIn('titles', data)
        self.assertNotIn('merits', data)

    def test_teacher_list_serializer_rating_calculation(self):
        """Test 22: Rating calculates average of surveys and opinions"""
        # Teacher has score=4.2, but rating should use surveys+opinions first
        serializer = TeacherListSerializer(self.teacher)
        # Student survey rating 5 + opinion rating 4 = 9 / 2 = 4.5
        self.assertEqual(serializer.data['rating'], 4.5)

    def test_teacher_list_serializer_rating_fallback_to_score(self):
        """Test 23: Rating falls back to score if no surveys/opinions"""
        teacher = TeacherFactory(score=3.8)
        # No surveys or opinions
        
        serializer = TeacherListSerializer(teacher)
        self.assertEqual(serializer.data['rating'], 3.8)

    def test_teacher_list_serializer_rating_zero_when_no_data(self):
        """Test 24: Rating returns 0 when no score, surveys, or opinions"""
        teacher = TeacherFactory(score=None)
        # Delete any auto-created surveys/opinions
        teacher.student_surveys.all().delete()
        teacher.coordinator_opinions.all().delete()
        
        serializer = TeacherListSerializer(teacher)
        self.assertEqual(serializer.data['rating'], 0.0)


class CourseSerializerTest(TestCase):
    """Test CourseSerializer"""

    def test_course_serializer_includes_career_name(self):
        """Test 25: Course serializer includes nested career name"""
        faculty = FacultyFactory(name="Engineering")
        career = CareerFactory(faculty=faculty, name="Computer Science")
        course = CourseFactory(career=career, name="Algorithms")
        
        serializer = CourseSerializer(course)
        
        self.assertEqual(serializer.data['career_name'], "Computer Science")
        self.assertEqual(serializer.data['name'], "Algorithms")


class CareerSerializerTest(TestCase):
    """Test CareerSerializer"""

    def test_career_serializer_includes_faculty_name(self):
        """Test 26: Career serializer includes nested faculty name"""
        faculty = FacultyFactory(name="Sciences")
        career = CareerFactory(faculty=faculty, name="Physics")
        
        serializer = CareerSerializer(career)
        
        self.assertEqual(serializer.data['faculty_name'], "Sciences")


class TeacherTitleSerializerTest(TestCase):
    """Test TeacherTitleSerializer"""

    def test_teacher_name_read_only_field(self):
        """Test 27: teacher_name is read-only and shows full name"""
        teacher = TeacherFactory(first_name="Robert", last_name="Johnson")
        title = TeacherTitleFactory(teacher=teacher)
        
        serializer = TeacherTitleSerializer(title)
        
        self.assertEqual(serializer.data['teacher_name'], "Robert Johnson")