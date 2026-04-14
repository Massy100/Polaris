from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('assessment_360', '0006_alter_evaluationcriterion_options_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                ALTER TABLE weightconfig_criterion DROP CONSTRAINT IF EXISTS weightconfig_criterion_pkey;
                ALTER TABLE weightconfig_criterion ADD COLUMN IF NOT EXISTS id BIGSERIAL PRIMARY KEY;
            """,
            reverse_sql="ALTER TABLE weightconfig_criterion DROP COLUMN id",
        ),
    ]