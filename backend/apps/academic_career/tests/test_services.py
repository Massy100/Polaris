import psycopg2
from psycopg2 import OperationalError
import os

# Configuración de conexión a Neon
# Reemplaza con tus datos reales
DATABASE_URL = "postgresql://neondb_owner:npg_w0JPZ2QDIBNA@ep-royal-leaf-a8xax2zw-pooler.eastus2.azure.neon.tech/polaris_db?sslmode=require&channel_binding=require"

def get_all_teacher():
    try:
        # Conectar a la base de datos
        print("🔌 Conectando a Neon...")
        conn = psycopg2.connect(DATABASE_URL)
        print("✅ Conexión exitosa!")
        
        # Crear cursor
        cur = conn.cursor()
        
        # Consultar todos los profesores
        print("\n📊 Ejecutando consulta: SELECT * FROM teacher;")
        cur.execute("SELECT * FROM teacher;")
        
        # Obtener todos los resultados
        teacher = cur.fetchall()
        
        # Obtener nombres de las columnas
        col_names = [desc[0] for desc in cur.description]
        
        # Mostrar resultados
        print(f"\n📋 Columnas: {col_names}")
        print(f"📊 Total de registros encontrados: {len(teacher)}")
        
        if teacher:
            print("\n👨‍🏫 Lista de Teacher:")
            print("-" * 50)
            for i, teacher in enumerate(teacher, 1):
                print(f"{i}. {teacher}")
        else:
            print("\n⚠️ No se encontraron registros en la tabla teacher")
        
        # Cerrar cursor y conexión
        cur.close()
        conn.close()
        print("\n🔌 Conexión cerrada")
        
        return teacher
        
    except OperationalError as e:
        print(f"\n❌ Error de conexión a la base de datos:")
        print(f"   {e}")
        print("\n💡 Posibles soluciones:")
        print("   1. Verifica que la URL de conexión sea correcta")
        print("   2. Comprueba que tu IP esté permitida en Neon")
        print("   3. Asegúrate que la base de datos exista")
        return None
        
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        return None

if __name__ == "__main__":
    print("=" * 50)
    print("🚀 Probando conexión a Neon - Tabla Teacher")
    print("=" * 50)
    
    teacher = get_all_teacher()
    
    if teacher is not None:
        print("\n✅ Prueba completada exitosamente!")
    else:
        print("\n❌ Prueba fallida!")