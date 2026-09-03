"""Fill the database with demo categories and products.

Creates the example categories from the Dessert Shop brief plus a few
products in each (no images). Safe to run more than once:

    python manage.py seed_demo

Use --force to add the demo data even if the menu already has products.
"""
from decimal import Decimal

from django.core.management.base import BaseCommand

from menu.models import Category, Product, ShopSettings

CATEGORIES = [
    {
        "name_en": "Cakes",
        "name_ar": "الكيك",
        "products": [
            ("Chocolate Fudge Cake", "كيكة الشوكولاتة الفادج", Decimal("420.00"),
             "Layers of dark chocolate ganache over a moist sponge.", "طبقات من غاناش الشوكولاتة الداكنة فوق كيكة إسفنجية ناعمة."),
            ("Classic Vanilla Cake", "كيكة الفانيليا الكلاسيكية", Decimal("350.00"),
             "Three light vanilla layers with fresh cream frosting.", "ثلاث طبقات فانيليا خفيفة مع كريمة طازجة."),
            ("Red Velvet Cake", "كيكة الريد فيلفت", Decimal("450.00"),
             "Velvety cocoa sponge with cream cheese icing.", "كيكة كاكاو مخملية مع كريمة الجبنة."),
        ],
    },
    {
        "name_en": "Cupcakes",
        "name_ar": "الكب كيك",
        "products": [
            ("Vanilla Bean Cupcake", "كب كيك الفانيليا", Decimal("90.00"),
             "Madagascar vanilla buttercream on a soft cupcake.", "كريمة فانيليا مدغشقر فوق كب كيك هش."),
            ("Salted Caramel Cupcake", "كب كيك الكراميل المملح", Decimal("110.00"),
             "Caramel filling topped with a pinch of sea salt.", "حشوة كراميل مغطاة بلمسة ملح بحري."),
        ],
    },
    {
        "name_en": "Cheesecakes",
        "name_ar": "تشيز كيك",
        "products": [
            ("New York Cheesecake", "تشيز كيك نيويورك", Decimal("520.00"),
             "Dense and creamy on a buttery biscuit base.", "قوام كثيف وكريمي فوق قاعدة بسكويت زبدة."),
            ("Blueberry Cheesecake", "تشيز كيك التوت", Decimal("560.00"),
             "Fresh blueberry swirl baked into the cream.", "دوّامة توت طازج مخبوزة داخل الكريمة."),
        ],
    },
    {
        "name_en": "Cookies",
        "name_ar": "الكوكيز",
        "products": [
            ("Chocolate Chip Cookie", "كوكيز الشوكولاتة", Decimal("70.00"),
             "Crispy edges, soft middle, dark chocolate chunks.", "أطراف مقرمشة وقلب طري مع قطع شوكولاتة داكنة."),
            ("Brown Butter Cookie", "كوكيز الزبدة المحمّصة", Decimal("85.00"),
             "Nutty brown butter with a touch of fleur de sel.", "زبدة محمّصة بنكهة البندق مع رشة ملح."),
        ],
    },
    {
        "name_en": "Cinnamon Rolls",
        "name_ar": "لفائف القرفة",
        "products": [
            ("Classic Cinnamon Roll", "لفافة القرفة الكلاسيكية", Decimal("120.00"),
             "Soft bun, brown sugar cinnamon spiral, cream glaze.", "عجينة طرية وحشوة قرفة وسكر بني مع صقيع بالكريمة."),
        ],
    },
    {
        "name_en": "Eastern Desserts",
        "name_ar": "الحلويات الشرقية",
        "products": [
            ("Kunafa", "الكنافة", Decimal("180.00"),
             "Golden crispy kunafa with rich cream filling.", "كنافة ذهبية مقرمشة بحشوة كريمة غنية."),
            ("Basbousa", "البسبوسة", Decimal("140.00"),
             "Semolina cake soaked in syrup, topped with almonds.", "كيكة سميد مشبّعة بالشربات ومزينة باللوز."),
        ],
    },
]


class Command(BaseCommand):
    help = "Create demo categories and products for Dessert Shop."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force", action="store_true",
            help="Add demo data even if products already exist.",
        )

    def handle(self, *args, **options):
        if Product.objects.exists() and not options["force"]:
            self.stdout.write(self.style.WARNING(
                "The menu already has products. Use --force to add demo data anyway."
            ))
            return

        ShopSettings.load()

        created_products = 0
        for index, spec in enumerate(CATEGORIES):
            category, _ = Category.objects.get_or_create(
                name_en=spec["name_en"],
                defaults={
                    "name_ar": spec["name_ar"],
                    "display_order": index,
                },
            )
            for order, (name_en, name_ar, price, desc_en, desc_ar) in enumerate(spec["products"]):
                _, created = Product.objects.get_or_create(
                    category=category,
                    name_en=name_en,
                    defaults={
                        "name_ar": name_ar,
                        "price": price,
                        "description_en": desc_en,
                        "description_ar": desc_ar,
                        "display_order": order,
                        "is_featured": name_en in ("Chocolate Fudge Cake", "New York Cheesecake"),
                    },
                )
                if created:
                    created_products += 1

        self.stdout.write(self.style.SUCCESS(
            f"Done. {len(CATEGORIES)} categories, {created_products} products created."
        ))