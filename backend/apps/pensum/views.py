import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import PensumCourse

class UploadPensumView(APIView):
    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No se recibió ningún archivo.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            df = pd.read_excel(file, header=None)
            
            header_row = None
            for i, row in df.iterrows():
                row_str = row.astype(str).str.lower().values
                if 'no_curso' in row_str and 'nombre_curso' in row_str:
                    header_row = i
                    break

            if header_row is None:
                return Response({'error': 'No se encontró un encabezado válido.'}, status=status.HTTP_400_BAD_REQUEST)

            df.columns = df.iloc[header_row]
            df = df[(header_row + 1):].reset_index(drop=True)
            df.columns = [str(c).strip().lower() for c in df.columns]
            df = df.ffill(axis=0)

            courses = []
            seen_codes = set()

            for _, row in df.iterrows():
                raw_code = str(row.get('no_curso', '')).strip()
                if raw_code.endswith('.0'):
                    raw_code = raw_code[:-2]
                
                code = raw_code
                name = str(row.get('nombre_curso', row.get('nombre', ''))).strip()

                if not code or code == 'nan' or not name or name == 'nan':
                    continue
                
                if code in seen_codes:
                    continue
                seen_codes.add(code)

                try:
                    theory = int(float(row.get('cred_teo', 0)))
                    practice = int(float(row.get('cred_pra', 0)))
                    total = theory + practice
                except:
                    theory, practice, total = 0, 0, 0

                courses.append(PensumCourse(
                    code=code,
                    name=name,
                    credits_theory=theory,
                    credits_practice=practice,
                    credits_total=total,
                ))

            if not courses:
                return Response({'error': 'No se encontraron datos válidos.'}, status=status.HTTP_400_BAD_REQUEST)

            PensumCourse.objects.bulk_create(courses, ignore_conflicts=True)
            
            return Response({
                'message': f'Se procesaron {len(courses)} cursos.',
                'total_en_db': PensumCourse.objects.count()
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PensumStatusView(APIView):
    def get(self, request):
        is_loaded = PensumCourse.objects.exists()
        return Response({'is_loaded': is_loaded})