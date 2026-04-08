from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('assessment_360', '0004_add_missing_columns_weightconfig'),
    ]

    operations = [
        migrations.RunSQL(
            sql="ALTER TABLE weightconfig ALTER COLUMN period_id DROP NOT NULL",
            reverse_sql="ALTER TABLE weightconfig ALTER COLUMN period_id SET NOT NULL",
        ),
    ]