import os
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.translation import get_language, gettext_lazy as _
from PIL import Image as PILImage

# Uploaded images are downscaled so a huge photo can never slow the menu down.
MAX_IMAGE_DIMENSION = 1400
JPEG_QUALITY = 82

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def optimize_uploaded_image(field_file):
    """Resize/re-encode an uploaded image in place to keep pages fast."""
    try:
        path = field_file.path
        ext = os.path.splitext(path)[1].lower()
        if ext not in IMAGE_EXTENSIONS:
            return
        with PILImage.open(path) as img:
            needs_work = img.width > MAX_IMAGE_DIMENSION or img.height > MAX_IMAGE_DIMENSION
            if ext in (".jpg", ".jpeg"):
                if not needs_work:
                    return
                img = img.convert("RGB")
                img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), PILImage.LANCZOS)
                img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
            elif ext == ".webp":
                if not needs_work:
                    return
                img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), PILImage.LANCZOS)
                img.save(path, "WEBP", quality=JPEG_QUALITY, method=4)
            else:  # png -> store photos as JPEG to keep files small
                if img.mode in ("RGBA", "LA", "P"):
                    background = PILImage.new("RGB", img.size, (251, 247, 240))
                    rgba = img.convert("RGBA")
                    background.paste(rgba, mask=rgba.split()[-1])
                    img = background
                else:
                    img = img.convert("RGB")
                img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), PILImage.LANCZOS)
                new_path = os.path.splitext(path)[0] + ".jpg"
                img.save(new_path, "JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
                if new_path != path:
                    try:
                        os.remove(path)
                    except OSError:
                        pass
                    field_file.name = os.path.relpath(
                        new_path, os.path.dirname(field_file.storage.location)
                    ).replace("\\", "/")
    except Exception:
        # Never let image post-processing break saving the product.
        pass


class Category(models.Model):
    name_en = models.CharField(max_length=120, verbose_name=_("Name (English)"))
    name_ar = models.CharField(
        max_length=120, blank=True, verbose_name=_("Name (Arabic)")
    )
    slug = models.SlugField(max_length=140, unique=True, blank=True)
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["display_order", "id"]
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name_en

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = self._unique_slug(self.name_en or "category")
        super().save(*args, **kwargs)

    def _unique_slug(self, source):
        from django.utils.text import slugify

        base = slugify(source) or "category"
        slug, counter = base, 2
        while Category.objects.filter(slug=slug).exclude(pk=self.pk).exists():
            slug = f"{base}-{counter}"
            counter += 1
        return slug

    @property
    def display_name(self):
        lang = get_language() or "en"
        if lang.startswith("ar") and self.name_ar:
            return self.name_ar
        return self.name_en or self.name_ar

    @property
    def published_count(self):
        return self.products.filter(is_published=True).count()


class Product(models.Model):
    category = models.ForeignKey(
        Category, on_delete=models.PROTECT, related_name="products"
    )
    name_en = models.CharField(max_length=150, verbose_name=_("Name (English)"))
    name_ar = models.CharField(
        max_length=150, blank=True, verbose_name=_("Name (Arabic)")
    )
    description_en = models.TextField(blank=True, verbose_name=_("Description (English)"))
    description_ar = models.TextField(blank=True, verbose_name=_("Description (Arabic)"))
    price = models.DecimalField(
        max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal("0"))]
    )
    image = models.ImageField(upload_to="products/%Y/%m/", blank=True)
    is_available = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["category__display_order", "category__id", "display_order", "id"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_image = self.image.name if self.image else None

    def __str__(self):
        return self.name_en

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.image and self.image.name != self._original_image:
            optimize_uploaded_image(self.image)
            self._original_image = self.image.name

    @property
    def display_name(self):
        lang = get_language() or "en"
        if lang.startswith("ar") and self.name_ar:
            return self.name_ar
        return self.name_en or self.name_ar

    @property
    def display_description(self):
        lang = get_language() or "en"
        if lang.startswith("ar"):
            return self.description_ar or self.description_en
        return self.description_en or self.description_ar

    @property
    def status_label(self):
        if not self.is_published:
            return "hidden"
        return "available" if self.is_available else "sold_out"


class ShopSettings(models.Model):
    """Single-row store of editable shop contact information."""

    whatsapp_number = models.CharField(
        max_length=32, blank=True, help_text="Digits only, with country code, e.g. 201234567890"
    )
    phone = models.CharField(max_length=32, blank=True)
    address_en = models.CharField(max_length=255, blank=True, verbose_name=_("Address (English)"))
    address_ar = models.CharField(max_length=255, blank=True, verbose_name=_("Address (Arabic)"))
    hours_en = models.CharField(max_length=255, blank=True, verbose_name=_("Opening hours (English)"))
    hours_ar = models.CharField(max_length=255, blank=True, verbose_name=_("Opening hours (Arabic)"))
    instagram_url = models.URLField(blank=True)
    hero_image = models.ImageField(upload_to="site/", blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = verbose_name_plural = "shop settings"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._original_hero_image = self.hero_image.name if self.hero_image else None

    def __str__(self):
        return "Shop settings"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.hero_image and self.hero_image.name != self._original_hero_image:
            optimize_uploaded_image(self.hero_image)
            self._original_hero_image = self.hero_image.name

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    @property
    def address(self):
        lang = get_language() or "en"
        if lang.startswith("ar"):
            return self.address_ar or self.address_en
        return self.address_en or self.address_ar

    @property
    def hours(self):
        lang = get_language() or "en"
        if lang.startswith("ar"):
            return self.hours_ar or self.hours_en
        return self.hours_en or self.hours_ar
