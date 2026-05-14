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
            try:
                df = pd.read_excel(file, header=None)
            except Exception as e:
                return Response({'error': f'Error al leer el Excel: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
            
            header_row = None
            for i, row in df.iterrows():
                row_str = row.astype(str).str.lower().values
                if any(k in row_str for k in ['no_curso', 'código', 'cod_curso']) and \
                   any(k in row_str for k in ['nombre_curso', 'nombre', 'asignatura']):
                    header_row = i
                    break

            if header_row is None:
                return Response({'error': 'No se encontró un encabezado válido (se busca "no_curso" y "nombre_curso").'}, status=status.HTTP_400_BAD_REQUEST)

            df.columns = df.iloc[header_row]
            df = df[(header_row + 1):].reset_index(drop=True)
            
            df.columns = [str(c).strip().lower() for c in df.columns]
            
            df = df.dropna(how='all')
            
            df = df.ffill(axis=0)

            courses = []
            seen_codes = set()

            col_code = next((c for c in df.columns if any(k in c for k in ['no_curso', 'código', 'cod_curso'])), 'no_curso')
            col_name = next((c for c in df.columns if any(k in c for k in ['nombre_curso', 'nombre', 'asignatura'])), 'nombre_curso')
            col_theo = next((c for c in df.columns if 'cred_teo' in c or 'teoria' in c), None)
            col_prac = next((c for c in df.columns if 'cred_pra' in c or 'practica' in c), None)

            for _, row in df.iterrows():
                raw_code = str(row.get(col_code, '')).strip()
                if raw_code.endswith('.0'):
                    raw_code = raw_code[:-2]
                
                code = raw_code
                name = str(row.get(col_name, '')).strip()

                if not code or code.lower() == 'nan' or not name or name.lower() == 'nan':
                    continue
                
                if code in seen_codes:
                    continue
                seen_codes.add(code)

                try:
                    theory = int(float(row.get(col_theo, 0))) if col_theo else 0
                    practice = int(float(row.get(col_prac, 0))) if col_prac else 0
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
                return Response({'error': 'No se encontraron cursos válidos en el archivo.'}, status=status.HTTP_400_BAD_REQUEST)

            PensumCourse.objects.all().delete()
            
            PensumCourse.objects.bulk_create(courses)
            
            return Response({
                'message': f'Pensum restaurado exitosamente. Se importaron {len(courses)} cursos.',
                'total_en_db': PensumCourse.objects.count()
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print(traceback.format_exc())
            return Response({'error': f'Error interno: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ResetPensumView(APIView):
    def post(self, request):
        try:
            PensumCourse.objects.all().delete()
            return Response({'message': 'Pensum restablecido correctamente.'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PensumStatusView(APIView):
    def get(self, request):
        is_loaded = PensumCourse.objects.exists()
        total_courses = PensumCourse.objects.count() if is_loaded else 0
        return Response({
            'is_loaded': is_loaded,
            'total_courses': total_courses
        })