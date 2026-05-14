import factory
from django.contrib.auth import get_user_model
from apps.profile.models import Coordinator

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User
        django_get_or_create = ('username',)

    username = factory.Sequence(lambda n: f'user{n}@example.com')
    email = factory.LazyAttribute(lambda o: o.username)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    password = factory.PostGenerationMethodCall('set_password', 'TestPass123!')
    is_active = True


class CoordinatorFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Coordinator
        django_get_or_create = ('email',)

    user = factory.SubFactory(UserFactory)
    first_name = factory.Faker('first_name')
    last_name = factory.Faker('last_name')
    email = factory.LazyAttribute(lambda o: o.user.email)
    status = 'ACTIVE'
    code = factory.Faker('bothify', text='??-####')
    department = factory.Faker('word')
    phone = factory.Faker('phone_number')
    role = 'Coordinador'
    since = factory.Faker('date_this_decade')
    email_notifications = True
    system_alerts = True
    weekly_report = False
    two_factor = False