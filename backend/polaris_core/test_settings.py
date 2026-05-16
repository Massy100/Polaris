from .settings import *  # noqa: F401,F403


DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

MIGRATION_MODULES = {
    "academic_career": None,
    "academic_workload": None,
    "accounts": None,
    "assessment_360": None,
    "integrations": None,
    "notifications": None,
    "pensum": None,
    "profile": None,
    "reporting": None,
    "security_audit": None,
}
