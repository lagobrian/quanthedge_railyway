"""Seed the database with initial categories and admin user."""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed the database with categories and admin user'

    def handle(self, *args, **kwargs):
        from api.models import Category

        # Create categories
        categories = [
            ('Crypto', 'crypto'),
            ('Markets', 'markets'),
            ('Quantitative Finance', 'quant-finance'),
            ('Trading', 'trading'),
            ('Weekly (h)Edge', 'weekly-hedge'),
            ('Resources', 'resources'),
            ('O.R.\u0186.A.M', 'ordam'),
            ('Bad Market Comics', 'bad-market-comics'),
        ]
        for title, slug in categories:
            cat, created = Category.objects.get_or_create(slug=slug, defaults={'title': title})
            status = 'Created' if created else 'Exists'
            self.stdout.write(f'  {status}: {title}')

        # Create admin user
        email = os.environ.get('ADMIN_EMAIL', 'lagobrian@outlook.com')
        password = os.environ.get('ADMIN_PASSWORD', '')
        if email and password:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'full_name': 'Lago Brian',
                    'is_author': True,
                    'is_analyst': True,
                    'is_staff': True,
                    'is_superuser': True,
                }
            )
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(self.style.SUCCESS(f'Created admin user: {email}'))
            else:
                # Ensure existing user has correct flags
                user.is_author = True
                user.is_analyst = True
                user.is_staff = True
                user.is_superuser = True
                user.save()
                self.stdout.write(f'Updated admin user: {email}')
        else:
            self.stdout.write(self.style.WARNING('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to create admin user'))

        self.stdout.write(self.style.SUCCESS('Seed complete!'))
