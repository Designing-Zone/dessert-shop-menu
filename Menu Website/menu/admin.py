from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import Category, Product, ShopSettings


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "product_count", "display_order", "is_active")
    list_editable = ("display_order", "is_active")
    list_display_links = ("name_en",)
    prepopulated_fields = {"slug": ("name_en",)}
    search_fields = ("name_en", "name_ar")

    @admin.display(description=_("Products"))
    def product_count(self, obj):
        return obj.products.count()


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name_en", "name_ar", "category", "price", "is_available",
                    "is_published", "is_featured", "display_order")
    list_filter = ("category", "is_available", "is_published", "is_featured")
    list_editable = ("display_order",)
    list_display_links = ("name_en",)
    search_fields = ("name_en", "name_ar", "description_en", "description_ar")
    autocomplete_fields = ("category",)


@admin.register(ShopSettings)
class ShopSettingsAdmin(admin.ModelAdmin):
    list_display = ("whatsapp_number", "phone")

    def has_add_permission(self, request):
        # A single settings row is created automatically.
        return not ShopSettings.objects.exists()

    def has_delete_permission(self, request):
        return False
