from django.db import models

class PensumCourse(models.Model):
    code        = models.CharField(max_length=20, unique=True)
    name        = models.CharField(max_length=255)
    credits_theory    = models.IntegerField(default=0)
    credits_practice  = models.IntegerField(default=0)
    credits_total     = models.IntegerField(default=0)

    class Meta:
        db_table = 'pensum_courses'

    def __str__(self):
        return f"{self.code} - {self.name}"