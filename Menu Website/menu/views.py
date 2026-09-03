from django.shortcuts import render

from .models import Category, Product, ShopSettings


def menu_view(request):
    menu_categories = []
    for category in Category.objects.filter(is_active=True).order_by("display_order", "id"):
        products = list(
            Product.objects.filter(category=category, is_published=True).order_by(
                "display_order", "id"
            )
        )
        menu_categories.append(
            {
                "slug": category.slug,
                "display_name": category.display_name,
                "products": products,
            }
        )

    featured = list(
        Product.objects.filter(is_published=True, is_featured=True)
        .select_related("category")
        .order_by("display_order", "id")[:3]
    )

    # Hero visual: the configured hero image wins, else the first featured product.
    shop_settings = ShopSettings.load()
    hero_image_url = ""
    hero_product = None
    hero_alt = ""
    if shop_settings.hero_image:
        hero_image_url = shop_settings.hero_image.url
        hero_alt = shop_settings.hero_image.name
    elif featured and featured[0].image:
        hero_product = featured[0]
        hero_image_url = hero_product.image.url
        hero_alt = hero_product.display_name

    return render(
        request,
        "menu/index.html",
        {
            "menu_categories": menu_categories,
            "featured_products": featured,
            "hero_image_url": hero_image_url,
            "hero_product": hero_product,
            "hero_alt": hero_alt,
        },
    )


def error_404(request, exception=None):
    return render(request, "menu/404.html", status=404)


def error_500(request):
    return render(request, "menu/500.html", status=500)


def robots_txt(request):
    return render(request, "menu/robots.txt", content_type="text/plain")
