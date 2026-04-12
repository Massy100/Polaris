import django.utils.timezone
from django.db import migrations, models, connection


def add_fields_if_missing(apps, schema_editor):
    with connection.cursor() as cursor:
        # Verificar columnas existentes
        cursor.execute("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'teacher'
        """)
        existing_columns = {row[0] for row in cursor.fetchall()}

        # Verificar tablas existentes
        cursor.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_name = 'teacher_courses'
        """)
        existing_tables = {row[0] for row in cursor.fetchall()}

    Teacher = apps.get_model('academic_career', 'Teacher')

    if 'code' not in existing_columns:
        schema_editor.add_field(Teacher, Teacher._meta.get_field('code'))

    if 'created_at' not in existing_columns:
        schema_editor.add_field(Teacher, Teacher._meta.get_field('created_at'))

    if 'email' not in existing_columns:
        schema_editor.add_field(Teacher, Teacher._meta.get_field('email'))

    if 'updated_at' not in existing_columns:
        schema_editor.add_field(Teacher, Teacher._meta.get_field('updated_at'))

    if 'teacher_courses' not in existing_tables:
        schema_editor.add_field(Teacher, Teacher._meta.get_field('courses'))


class Migration(migrations.Migration):

    dependencies = [
        ('academic_career', '0001_initial'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='teacher',
            options={'ordering': ['last_name', 'first_name']},
        ),
        migrations.RunPython(add_fields_if_missing, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='teacher',
            name='status',
            field=models.CharField(blank=True, default='active', max_length=20, null=True),
        ),
    ]