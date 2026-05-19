from django.db import migrations, models


def add_fields_if_missing(apps, schema_editor):
    from django.db import models
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'teacher'")
        existing_columns = {row[0] for row in cursor.fetchall()}

    Teacher = apps.get_model('academic_career', 'Teacher')

    if 'code' not in existing_columns:
        field = models.CharField(max_length=20, blank=True, null=True, unique=True)
        field.column = 'code'
        schema_editor.add_field(Teacher, field)

    if 'created_at' not in existing_columns:
        field = models.DateTimeField(auto_now_add=True)
        field.column = 'created_at'
        schema_editor.add_field(Teacher, field)

    if 'email' not in existing_columns:
        field = models.EmailField(max_length=254, blank=True, null=True, unique=True)
        field.column = 'email'
        schema_editor.add_field(Teacher, field)

    if 'updated_at' not in existing_columns:
        field = models.DateTimeField(auto_now=True)
        field.column = 'updated_at'
        schema_editor.add_field(Teacher, field)


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
