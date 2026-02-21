from django.db import models


class User(models.Model):
    user_id = models.BigAutoField(primary_key=True)
    username = models.CharField(unique=True, max_length=80, blank=True, null=True)
    password_hash = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = 'User'


class Coordinator(models.Model):
    coordinator_id = models.BigAutoField(primary_key=True)
    first_name = models.CharField(max_length=120, blank=True, null=True)
    last_name = models.CharField(max_length=120, blank=True, null=True)
    status = models.CharField(max_length=20, blank=True, null=True)
    user = models.OneToOneField(User, models.DO_NOTHING)

    class Meta:
        db_table = 'coordinator'


class CoordinatorCareer(models.Model):
    coordinator = models.OneToOneField(
        Coordinator,
        models.DO_NOTHING,
        primary_key=True,
    )  # Composite PK (coordinator_id, career_id): inspectdb keeps first column.
    career = models.ForeignKey('academic_career.Career', models.DO_NOTHING)

    class Meta:
        db_table = 'coordinator_career'
        unique_together = (('coordinator', 'career'),)


class CoordinatorFaculty(models.Model):
    coordinator = models.OneToOneField(
        Coordinator,
        models.DO_NOTHING,
        primary_key=True,
    )  # Composite PK (coordinator_id, faculty_id): inspectdb keeps first column.
    faculty = models.ForeignKey('academic_career.Faculty', models.DO_NOTHING)

    class Meta:
        db_table = 'coordinator_faculty'
        unique_together = (('coordinator', 'faculty'),)
