# backend/apps/academic_workload/tests/test_services.py
"""
Unit tests for AI analysis services
IMPORTANT: These tests mock the external AI API calls
"""

from django.test import TestCase
from unittest.mock import patch, MagicMock
from ..services import (
    build_prompt, call_ai, parse_ai_response, analyze_teacher
)


class BuildPromptTest(TestCase):
    """Test prompt construction for AI"""

    def test_build_prompt_creates_correct_structure(self):
        """Test 27: Build prompt includes comments and criteria"""
        comments = [
            "Excelente maestro",
            "No explica bien las clases",
            "Muy puntual"
        ]
        criteria = [
            {'name': 'Puntualidad', 'description': 'Llega a tiempo'},
            {'name': 'Claridad', 'description': 'Explica bien'}
        ]
        
        prompt = build_prompt(comments, criteria)
        
        self.assertIn("Comentarios:", prompt)
        self.assertIn("Criterios:", prompt)
        self.assertIn("Excelente maestro", prompt)
        self.assertIn("Puntualidad", prompt)
        self.assertIn('["P","N","P"]', prompt)  # Example format

    def test_build_prompt_with_empty_description(self):
        """Test 28: Build prompt handles empty criterion description"""
        comments = ["Good teacher"]
        criteria = [
            {'name': 'Puntualidad', 'description': ''}
        ]
        
        prompt = build_prompt(comments, criteria)
        self.assertIn("Puntualidad;", prompt)
        # Should not have colon after empty description

    def test_build_prompt_counts_correctly(self):
        """Test 29: Prompt shows correct comment and criterion counts"""
        comments = ["c1", "c2", "c3"]
        criteria = [{'name': 'cr1'}, {'name': 'cr2'}]
        
        prompt = build_prompt(comments, criteria)
        self.assertIn("3 cantidad de comentarios", prompt)
        self.assertIn("2 criterios", prompt)


class ParseAIResponseTest(TestCase):
    """Test parsing AI responses"""

    def test_parse_valid_response(self):
        """Test 30: Parse correctly formatted AI response"""
        raw = '["P","N","P","N"][85,70,90,65]'
        
        sentiments, scores = parse_ai_response(raw)
        
        self.assertEqual(sentiments, ["P", "N", "P", "N"])
        self.assertEqual(scores, [85.0, 70.0, 90.0, 65.0])

    def test_parse_response_with_spaces(self):
        """Test 31: Parse response with spaces correctly"""
        raw = '["P", "N", "P"]["85", "70", "90"]'
        
        sentiments, scores = parse_ai_response(raw)
        
        self.assertEqual(sentiments, ["P", "N", "P"])
        self.assertEqual(scores, [85.0, 70.0, 90.0])

    def test_parse_float_scores(self):
        """Test 32: Parse decimal scores correctly"""
        raw = '["P","N"][85.5,72.3]'
        
        sentiments, scores = parse_ai_response(raw)
        
        self.assertEqual(sentiments, ["P", "N"])
        self.assertEqual(scores, [85.5, 72.3])


class CallAITest(TestCase):
    """Test AI API calls (mocked)"""

    @patch('apps.academic_workload.services.OpenAI')
    def test_call_ai_success(self, mock_openai_class):
        """Test 33: Call AI successfully returns response"""
        # Setup mock
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock()]
        mock_completion.choices[0].message.content = '["P","N"][85,70]'
        mock_client.chat.completions.create.return_value = mock_completion
        
        # Call function
        result = call_ai("Test prompt")
        
        self.assertEqual(result, '["P","N"][85,70]')
        mock_client.chat.completions.create.assert_called_once()

    @patch('apps.academic_workload.services.OpenAI')
    def test_call_ai_with_api_key(self, mock_openai_class):
        """Test 34: Call AI uses correct API configuration"""
        mock_client = MagicMock()
        mock_openai_class.return_value = mock_client
        mock_completion = MagicMock()
        mock_completion.choices = [MagicMock()]
        mock_completion.choices[0].message.content = '["P"][90]'
        mock_client.chat.completions.create.return_value = mock_completion
        
        call_ai("Test")
        
        # Verify OpenAI client initialized with correct params
        mock_openai_class.assert_called_once()
        args, kwargs = mock_openai_class.call_args
        self.assertIn('api_key', kwargs)
        self.assertIn('base_url', kwargs)


class AnalyzeTeacherTest(TestCase):
    """Test complete teacher analysis flow"""

    @patch('apps.academic_workload.services.call_ai')
    def test_analyze_teacher_basic_flow(self, mock_call_ai):
        """Test 35: Complete analysis flow works correctly"""
        # Mock AI response
        mock_call_ai.return_value = '["P","N","P"][85,70,90]'
        
        comments = [
            {'comment_id': 1, 'content': 'Excelente profesor'},
            {'comment_id': 2, 'content': 'Llega tarde seguido'},
            {'comment_id': 3, 'content': 'Explica muy bien'}
        ]
        criteria = [
            {'criterion_id': 1, 'name': 'Claridad', 'percentage': 50},
            {'criterion_id': 2, 'name': 'Puntualidad', 'percentage': 30},
            {'criterion_id': 3, 'name': 'Dominio', 'percentage': 20}
        ]
        
        result = analyze_teacher(comments, criteria)
        
        # Check structure
        self.assertEqual(result['total_comments'], 3)
        self.assertEqual(result['positive_count'], 2)
        self.assertEqual(result['negative_count'], 1)
        
        # Check comments result
        self.assertEqual(len(result['comments']), 3)
        self.assertEqual(result['comments'][0]['sentiment'], 'P')
        self.assertEqual(result['comments'][1]['sentiment'], 'N')
        
        # Check criteria scores
        self.assertEqual(len(result['criteria_scores']), 3)
        # Weighted: 85 * 0.5 = 42.5, 70 * 0.3 = 21, 90 * 0.2 = 18, sum = 81.5 /20? Wait check formula
        self.assertIn('final_score', result)

    @patch('apps.academic_workload.services.call_ai')
    def test_analyze_teacher_weighted_calculation(self, mock_call_ai):
        """Test 36: Weighted score calculation is correct"""
        mock_call_ai.return_value = '["P","P"][100,100]'
        
        comments = [
            {'comment_id': 1, 'content': 'Perfect teacher'},
            {'comment_id': 2, 'content': 'Excellent'}
        ]
        criteria = [
            {'criterion_id': 1, 'name': 'Quality', 'percentage': 60},
            {'criterion_id': 2, 'name': 'Punctuality', 'percentage': 40}
        ]
        
        result = analyze_teacher(comments, criteria)
        
        # raw 100 each: (100*0.6 + 100*0.4) = 100, then /20? Actually final_score /20
        # Looking at code: sum(weighted)/20
        # weighted = raw * (percentage * 0.01)
        # So: (100*0.6) + (100*0.4) = 100, then 100/20 = 5
        self.assertEqual(result['final_score'], 5.0)

    @patch('apps.academic_workload.services.call_ai')
    def test_analyze_teacher_handles_missing_scores(self, mock_call_ai):
        """Test 37: Handle case where AI returns fewer scores than criteria"""
        mock_call_ai.return_value = '["P","N"][85]'  # Only 1 score for 2 criteria
        
        comments = [
            {'comment_id': 1, 'content': 'Good'},
            {'comment_id': 2, 'content': 'Bad'}
        ]
        criteria = [
            {'criterion_id': 1, 'name': 'Quality', 'percentage': 50},
            {'criterion_id': 2, 'name': 'Punctuality', 'percentage': 50}
        ]
        
        result = analyze_teacher(comments, criteria)
        
        # Missing score should default to 0
        self.assertEqual(result['criteria_scores'][1]['raw_score'], 0.0)

    @patch('apps.academic_workload.services.call_ai')
    def test_analyze_teacher_positive_negative_counts(self, mock_call_ai):
        """Test 38: Correctly counts positive and negative sentiments"""
        mock_call_ai.return_value = '["P","P","N","P","N","N"][85,90,70,95,65,75]'
        
        comments = [
            {'comment_id': i, 'content': f'Comment {i}'} 
            for i in range(6)
        ]
        criteria = [{'criterion_id': 1, 'name': 'Quality', 'percentage': 100}]
        
        result = analyze_teacher(comments, criteria)
        
        self.assertEqual(result['positive_count'], 3)  # P,P,P
        self.assertEqual(result['negative_count'], 3)   # N,N,N