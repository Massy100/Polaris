from django.db import migrations, models
import django.utils.timezone

class Migration(migrations.Migration):

    dependencies = [
        ('assessment_360', '0003_remove_duplicate_created_at'),
    ]

    operations = [
        migrations.AddField(
            model_name='weightconfig',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
    ]