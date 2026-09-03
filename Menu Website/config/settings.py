"""
Django settings for the Dessert Shop website.

Development uses SQLite; see the DATABASES section for switching to
PostgreSQL in production without any code changes.
"""

import os
from pathlib import Path

from django.utils.translation import gettext_lazy as _

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Security
# ------------------------------------------------------------------

SECRET_KEY = os.environ.get(
    "DJANGO_SECRET_KEY",
    "django-insecure-=o!3vzptv0(@%)=gg*_!02rn17!%ws#$u)b367(m%+x+)(xr8h",
)

DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() in ("1", "true", "yes")

ALLOWED_HOSTS = [
    host.strip()
    for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

# In production, add your domain, e.g.:
# CSRF_TRUSTED_ORIGINS = ["https://dessertshop.example.com"]


# Applications
# ------------------------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "menu",
    "dashboard",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.template.context_processors.i18n",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
                "menu.context_processors.shop",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# Database
# ------------------------------------------------------------------
# Development uses SQLite. For PostgreSQL, install psycopg[binary] and
# set DJANGO_DB_* environment variables (or edit this block directly):

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# PostgreSQL example:
#
# DATABASES = {
#     "default": {
#         "ENGINE": "django.db.backends.postgresql",
#         "NAME": os.environ.get("DJANGO_DB_NAME", "dessert_shop"),
#         "USER": os.environ.get("DJANGO_DB_USER", "postgres"),
#         "PASSWORD": os.environ.get("DJANGO_DB_PASSWORD", ""),
#         "HOST": os.environ.get("DJANGO_DB_HOST", "localhost"),
#         "PORT": os.environ.get("DJANGO_DB_PORT", "5432"),
#     }
# }


# Authentication
# ------------------------------------------------------------------

LOGIN_URL = "dashboard:login"
LOGIN_REDIRECT_URL = "dashboard:overview"
LOGOUT_REDIRECT_URL = "dashboard:login"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization
# ------------------------------------------------------------------
# The interface ships in English and Arabic (with full RTL support).
# Translatable UI strings live in locale/<lang>/LC_MESSAGES/django.po.
# Compile them with:  python scripts/build_translations.py

LANGUAGE_CODE = "en"

LANGUAGES = [
    ("en", _("English")),
    ("ar", _("Arabic")),
]

LOCALE_PATHS = [BASE_DIR / "locale"]

TIME_ZONE = "Africa/Cairo"

USE_I18N = True

USE_TZ = True


# Static and media files
# ------------------------------------------------------------------

STATIC_URL = "static/"
STATICFILES_DIRS = [BASE_DIR / "static"]
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

# Uploaded product images larger than this are rejected (5 MB).
MAX_UPLOAD_SIZE = 5 * 1024 * 1024


# Security headers
# ------------------------------------------------------------------

X_FRAME_OPTIONS = "DENY"
SECURE_CONTENT_TYPE_NOSNIFF = True

# For production (behind HTTPS), also set:
# SECURE_SSL_REDIRECT = True
# SESSION_COOKIE_SECURE = True
# CSRF_COOKIE_SECURE = True
# SECURE_HSTS_SECONDS = 31536000


DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
