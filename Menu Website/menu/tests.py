from decimal import Decimal

from django.test import TestCase, override_settings, Client

from .models import Category, Product, ShopSettings
from .templatetags.shop_tags import price


class PriceFilterTests(TestCase):
    def test_whole_numbers(self):
        self.assertEqual(price("120"), "120 EGP")

    def test_decimal_prices(self):
        self.assertEqual(price("149.50"), "149.50 EGP")

    def test_thousands_separator(self):
        self.assertEqual(price("1250"), "1,250 EGP")

    def test_invalid_value_returns_blank(self):
        self.assertEqual(price("not-a-price"), "")


class MenuPageTests(TestCase):
    def setUp(self):
        self.cake = Category.objects.create(
            name_en="Cakes", name_ar="الكيك", display_order=0
        )
        self.cookies = Category.objects.create(
            name_en="Cookies", name_ar="الكوكيز", display_order=1, is_active=False
        )
        Product.objects.create(
            category=self.cake,
            name_en="Chocolate Fudge Cake",
            name_ar="كيكة الشوكولاتة الفادج",
            description_en="Rich ganache.",
            description_ar="غاناش غني.",
            price=Decimal("420.00"),
            is_featured=True,
            display_order=0,
        )
        Product.objects.create(
            category=self.cake,
            name_en="Hidden Cake",
            name_ar="كيكة مخفية",
            price=Decimal("100.00"),
            is_published=False,
            display_order=1,
        )
        Product.objects.create(
            category=self.cake,
            name_en="Sold-out Cookie",
            name_ar="كوكيز نفد",
            price=Decimal("10.00"),
            is_available=False,
            display_order=2,
        )

    def test_menu_shows_published_products_with_egp(self):
        client = Client()
        response = client.get("/en/")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn("Chocolate Fudge Cake", body)
        self.assertIn("420 EGP", body)
        self.assertIn('<html lang="en" dir="ltr">', body)

    def test_hidden_products_and_inactive_categories_are_excluded(self):
        client = Client()
        body = client.get("/en/").content.decode()
        self.assertNotIn("Hidden Cake", body)
        self.assertNotIn("Cookies", body)

    def test_sold_out_marker_is_shown(self):
        client = Client()
        body = client.get("/en/").content.decode()
        self.assertIn("Sold-out Cookie", body)
        self.assertIn("Sold out", body)

    def test_arabic_page_is_rtl_and_translated(self):
        client = Client()
        response = client.get("/ar/")
        self.assertEqual(response.status_code, 200)
        body = response.content.decode()
        self.assertIn('<html lang="ar" dir="rtl">', body)
        self.assertIn("كيكة الشوكولاتة الفادج", body)

    def test_whatsapp_link_appears_when_configured(self):
        settings = ShopSettings.load()
        settings.whatsapp_number = "201234567890"
        settings.save()
        client = Client()
        body = client.get("/en/").content.decode()
        self.assertIn("https://wa.me/201234567890", body)
        self.assertIn("Order", body)

    def test_per_product_whatsapp_url_has_custom_message(self):
        settings = ShopSettings.load()
        settings.whatsapp_number = "201234567890"
        settings.save()
        client = Client()
        body = client.get("/en/").content.decode()
        self.assertIn("price-badge", body)
        # The available product (Chocolate Fudge Cake) has an order button
        # opening WhatsApp with a custom message containing its encoded name.
        self.assertIn("https://wa.me/201234567890?text=", body)
        self.assertIn("Chocolate%20Fudge%20Cake", body)
        # The sold-out product must NOT have an order button.
        sold_out_html = body[body.index("Sold-out Cookie"):body.index("Sold-out Cookie") + 4000]
        self.assertNotIn("order-btn", sold_out_html)


class ErrorPageTests(TestCase):
    def test_custom_404(self):
        client = Client()
        response = client.get("/en/this-page-does-not-exist/")
        self.assertEqual(response.status_code, 404)
        self.assertIn("Page not found", response.content.decode())


class ModelFallbackTests(TestCase):
    def test_category_display_name_falls_back_between_languages(self):
        category = Category.objects.create(name_en="Cakes")
        with override_settings(LANGUAGE_CODE="ar"):
            self.assertEqual(category.display_name, "Cakes")