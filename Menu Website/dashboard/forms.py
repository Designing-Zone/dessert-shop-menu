from django import forms
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from django.utils.translation import gettext_lazy as _

from config.settings import MAX_UPLOAD_SIZE
from menu.models import Category, Product, ShopSettings

ALLOWED_IMAGE_TYPES = ["jpg", "jpeg", "png", "webp"]


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            "category",
            "name_en",
            "name_ar",
            "description_en",
            "description_ar",
            "price",
            "image",
            "is_available",
            "is_published",
            "is_featured",
            "display_order",
        ]
        widgets = {
            "name_en": forms.TextInput(attrs={"placeholder": _("e.g. Chocolate Fudge Cake")}),
            "name_ar": forms.TextInput(
                attrs={"placeholder": _("e.g. كيكة الشوكولاتة"), "dir": "auto"}
            ),
            "description_en": forms.Textarea(
                attrs={"rows": 3, "placeholder": _("A short, appetizing description.")}
            ),
            "description_ar": forms.Textarea(
                attrs={"rows": 3, "dir": "auto"}
            ),
            "price": forms.NumberInput(),
            "display_order": forms.NumberInput(attrs={"min": 0}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["price"].widget.attrs.update({"step": "0.01", "min": "0"})
        self.fields["image"].validators.append(
            FileExtensionValidator(ALLOWED_IMAGE_TYPES)
        )

    def clean_price(self):
        price = self.cleaned_data.get("price")
        if price is not None and price > 99999999:
            raise ValidationError(_("Please enter a realistic price."))
        return price

    def clean_image(self):
        image = self.cleaned_data.get("image")
        if image and hasattr(image, "size") and image.size > MAX_UPLOAD_SIZE:
            raise ValidationError(
                _("The image is too large. Please use a file under 5 MB.")
            )
        return image


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ["name_en", "name_ar", "display_order", "is_active"]
        widgets = {
            "name_en": forms.TextInput(attrs={"placeholder": _("e.g. Cakes")}),
            "name_ar": forms.TextInput(
                attrs={"placeholder": _("e.g. كيك"), "dir": "auto"}
            ),
            "display_order": forms.NumberInput(attrs={"min": 0}),
        }


class ShopSettingsForm(forms.ModelForm):
    class Meta:
        model = ShopSettings
        fields = [
            "whatsapp_number",
            "phone",
            "address_en",
            "address_ar",
            "hours_en",
            "hours_ar",
            "instagram_url",
            "hero_image",
        ]
        widgets = {
            "address_en": forms.TextInput(attrs={"dir": "auto"}),
            "address_ar": forms.TextInput(attrs={"dir": "auto"}),
            "hours_en": forms.TextInput(attrs={"dir": "auto"}),
            "hours_ar": forms.TextInput(attrs={"dir": "auto"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["whatsapp_number"].help_text = _(
            "Digits only, including the country code (e.g. 201234567890)."
        )
        self.fields["hero_image"].validators.append(
            FileExtensionValidator(ALLOWED_IMAGE_TYPES)
        )

    def clean_hero_image(self):
        image = self.cleaned_data.get("hero_image")
        if image and hasattr(image, "size") and image.size > MAX_UPLOAD_SIZE:
            raise ValidationError(
                _("The image is too large. Please use a file under 5 MB.")
            )
        return image
