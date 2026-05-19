from django.db import migrations, models


def add_fields_if_missing(apps, schema_editor):
    # These fields are added declaratively in later migrations. Keeping this
    # operation as a no-op makes clean test database creation deterministic.
    return None


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
