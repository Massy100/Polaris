from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("integrations", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bulkuploadbatch",
            name="category",
            field=models.CharField(
                choices=[
                    ("titulos", "Titulos"),
                    ("meritos", "Meritos"),
                    ("opiniones", "Opiniones"),
                    ("encuestas", "Encuestas"),
                ],
                max_length=20,
            ),
        ),
    ]
