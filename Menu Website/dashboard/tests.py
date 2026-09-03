from decimal import Decimal

from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.urls import reverse

from menu.models import Category, Product, ShopSettings


class DashboardAuthTests(TestCase):
    def setUp(self):
        self.client = Client()
        self.staff = User.objects.create_user(
            "owner", "owner@example.com", "secret-pass", is_staff=True
        )

    def test_anonymous_visitors_are_sent_to_branded_login(self):
        response = self.client.get("/en/dashboard/", follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertIn("Welcome back", response.content.decode())
        self.assertIn("Dashboard", response.content.decode())

    def test_dashboard_login_url_is_not_the_django_admin(self):
        response = self.client.get("/en/dashboard/")
        self.assertEqual(response.status_code, 302)
        self.assertNotIn("django-admin", response["Location"])
        self.assertIn("dashboard/login", response["Location"])

    def test_non_staff_users_are_blocked(self):
        plain = User.objects.create_user("cust", "cust@example.com", "secret-pass")
        self.client.login(username="cust", password="secret-pass")
        response = self.client.get("/en/dashboard/products/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("dashboard/login", response["Location"])

    def test_staff_can_open_overview(self):
        self.client.login(username="owner", password="secret-pass")
        response = self.client.get(reverse("dashboard:overview"))
        self.assertEqual(response.status_code, 200)
        self.assertIn("Total products", response.content.decode())

    def test_logout_returns_to_login(self):
        self.client.login(username="owner", password="secret-pass")
        response = self.client.post(reverse("dashboard:logout"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("dashboard/login", response["Location"])


class DashboardProductCRUDTests(TestCase):
    def setUp(self):
        self.client = Client()
        User.objects.create_user("owner", "owner@example.com", "secret-pass", is_staff=True)
        self.client.login(username="owner", password="secret-pass")
        self.category = Category.objects.create(name_en="Cakes", name_ar="الكيك")

    def create_data(self, **overrides):
        data = {
            "category": self.category.pk,
            "name_en": "Brownie",
            "name_ar": "براوني",
            "description_en": "Chocolate square.",
            "description_ar": "مربع شوكولاتة.",
            "price": "85",
            "is_available": "on",
            "is_published": "on",
            "is_featured": "",
            "display_order": "0",
        }
        data.update(overrides)
        return data

    def test_add_product(self):
        response = self.client.post(reverse("dashboard:product_add"), self.create_data())
        self.assertEqual(response.status_code, 302)
        product = Product.objects.get(name_en="Brownie")
        self.assertEqual(product.price, Decimal("85.00"))
        self.assertEqual(product.category, self.category)

    def test_form_rejects_negative_price(self):
        response = self.client.post(
            reverse("dashboard:product_add"), self.create_data(price="-5")
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Product.objects.filter(name_en="Brownie").exists())

    def test_edit_product(self):
        product = Product.objects.create(
            category=self.category, name_en="Brownie", price=Decimal("85.00")
        )
        response = self.client.post(
            reverse("dashboard:product_edit", args=[product.pk]),
            self.create_data(price="90"),
        )
        self.assertEqual(response.status_code, 302)
        product.refresh_from_db()
        self.assertEqual(product.price, Decimal("90.00"))

    def test_toggle_publish_availability_featured(self):
        product = Product.objects.create(
            category=self.category, name_en="Brownie", price=Decimal("85.00")
        )
        self.client.post(reverse("dashboard:product_toggle", args=[product.pk, "published"]))
        product.refresh_from_db()
        self.assertFalse(product.is_published)

        self.client.post(reverse("dashboard:product_toggle", args=[product.pk, "availability"]))
        product.refresh_from_db()
        self.assertFalse(product.is_available)

        self.client.post(reverse("dashboard:product_toggle", args=[product.pk, "featured"]))
        product.refresh_from_db()
        self.assertTrue(product.is_featured)

    def test_delete_product(self):
        product = Product.objects.create(
            category=self.category, name_en="Brownie", price=Decimal("85.00")
        )
        self.client.post(reverse("dashboard:product_delete", args=[product.pk]))
        self.assertFalse(Product.objects.filter(pk=product.pk).exists())

    def test_product_search(self):
        Product.objects.create(
            category=self.category, name_en="Brownie", price=Decimal("85.00")
        )
        Product.objects.create(
            category=self.category, name_en="Croissant", price=Decimal("60.00")
        )
        response = self.client.get(reverse("dashboard:products"), {"q": "crois"})
        body = response.content.decode()
        self.assertIn("Croissant", body)
        self.assertNotIn("Brownie", body)


class DashboardCategoryTests(TestCase):
    def setUp(self):
        self.client = Client()
        User.objects.create_user("owner", "owner@example.com", "secret-pass", is_staff=True)
        self.client.login(username="owner", password="secret-pass")

    def test_add_and_edit_category(self):
        response = self.client.post(
            reverse("dashboard:category_add"),
            {"name_en": "Puddings", "name_ar": "البودينغ", "display_order": 2, "is_active": "on"},
        )
        self.assertEqual(response.status_code, 302)
        category = Category.objects.get(name_en="Puddings")
        self.assertEqual(category.name_ar, "البودينغ")

        response = self.client.post(
            reverse("dashboard:category_edit", args=[category.pk]),
            {"name_en": "Desserts", "name_ar": "", "display_order": 2, "is_active": "on"},
        )
        self.assertEqual(response.status_code, 302)
        category.refresh_from_db()
        self.assertEqual(category.name_en, "Desserts")

    def test_category_with_products_cannot_be_deleted(self):
        category = Category.objects.create(name_en="Cakes")
        Product.objects.create(category=category, name_en="Cake", price=Decimal("50"))
        response = self.client.post(reverse("dashboard:category_delete", args=[category.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertTrue(Category.objects.filter(pk=category.pk).exists())

    def test_empty_category_can_be_deleted(self):
        category = Category.objects.create(name_en="Empty")
        response = self.client.post(reverse("dashboard:category_delete", args=[category.pk]))
        self.assertEqual(response.status_code, 302)
        self.assertFalse(Category.objects.filter(pk=category.pk).exists())


class DashboardSettingsTests(TestCase):
    def setUp(self):
        self.client = Client()
        User.objects.create_user("owner", "owner@example.com", "secret-pass", is_staff=True)
        self.client.login(username="owner", password="secret-pass")

    def test_settings_saved_and_shown_on_public_site(self):
        response = self.client.post(
            reverse("dashboard:settings"),
            {
                "whatsapp_number": "201234567890",
                "phone": "+20 100 111 2222",
                "address_en": "Cairo, Egypt",
                "address_ar": "القاهرة، مصر",
                "hours_en": "Daily 10am–9pm",
                "hours_ar": "يومياً 10ص–9م",
                "instagram_url": "",
                "hero_image": "",
            },
        )
        self.assertEqual(response.status_code, 302)
        settings = ShopSettings.load()
        self.assertEqual(settings.whatsapp_number, "201234567890")
        self.assertEqual(settings.address_ar, "القاهرة، مصر")

        body = self.client.get("/en/").content.decode()
        self.assertIn("Cairo, Egypt", body)
        self.assertIn("wa.me/201234567890", body)