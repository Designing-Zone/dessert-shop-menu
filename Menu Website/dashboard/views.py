from django.contrib import messages
from django.contrib.auth.decorators import user_passes_test
from django.contrib.auth.views import LoginView as AuthLoginView, LogoutView as AuthLogoutView
from django.core.paginator import Paginator
from django.db.models import Q
from django.db.models.deletion import ProtectedError
from django.http import Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse, reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from django.utils.translation import gettext as _
from django.views.decorators.http import require_POST

from menu.models import Category, Product, ShopSettings

from .forms import CategoryForm, ProductForm, ShopSettingsForm


def safe_next(request, fallback):
    candidate = request.POST.get("next") or request.GET.get("next")
    if candidate and url_has_allowed_host_and_scheme(candidate, request.get_host()):
        return candidate
    return fallback


# ------------------------------------------------------------------ auth

login_view = AuthLoginView.as_view(
    template_name="dashboard/login.html", redirect_authenticated_user=True
)
logout_view = AuthLogoutView.as_view()

# Route dashboard access through the branded login page instead of the
# stock Django admin login.
staff_member_required = user_passes_test(
    lambda u: u.is_active and u.is_staff,
    login_url=reverse_lazy("dashboard:login"),
)


# ------------------------------------------------------------------ overview

@staff_member_required
def overview(request):
    stats = {
        "total_products": Product.objects.count(),
        "available_products": Product.objects.filter(is_published=True, is_available=True).count(),
        "hidden_products": Product.objects.filter(is_published=False).count(),
        "total_categories": Category.objects.filter(is_active=True).count(),
        "featured_products": Product.objects.filter(is_published=True, is_featured=True).count(),
    }
    recent_products = Product.objects.select_related("category").order_by("-created_at")[:6]
    context = {
        "stats": stats,
        "recent_products": recent_products,
        "active_nav": "overview",
    }
    return render(request, "dashboard/overview.html", context)


# ------------------------------------------------------------------ products

@staff_member_required
def product_list(request):
    products = Product.objects.select_related("category").order_by(
        "category__display_order", "category__id", "display_order", "id"
    )

    query = request.GET.get("q", "").strip()
    category_id = request.GET.get("category", "")
    if query:
        products = products.filter(
            Q(name_en__icontains=query)
            | Q(name_ar__icontains=query)
            | Q(description_en__icontains=query)
            | Q(description_ar__icontains=query)
        )
    if category_id.isdigit():
        products = products.filter(category_id=int(category_id))

    paginator = Paginator(products, 15)
    page = paginator.get_page(request.GET.get("page"))

    context = {
        "page_obj": page,
        "products": page.object_list,
        "categories": Category.objects.order_by("display_order", "id"),
        "query": query,
        "selected_category": category_id,
        "active_nav": "products",
    }
    return render(request, "dashboard/product_list.html", context)


@staff_member_required
def product_create(request):
    form = ProductForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and form.is_valid():
        product = form.save()
        messages.success(request, _("“%(name)s” was added.") % {"name": product.display_name})
        return redirect("dashboard:products")
    context = {"form": form, "is_new": True, "active_nav": "products",
               "page_title": _("Add product")}
    return render(request, "dashboard/product_form.html", context)


@staff_member_required
def product_edit(request, pk):
    product = get_object_or_404(Product, pk=pk)
    form = ProductForm(request.POST or None, request.FILES or None, instance=product)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, _("“%(name)s” was updated.") % {"name": product.display_name})
        return redirect(safe_next(request, reverse("dashboard:products")))
    context = {
        "form": form,
        "product": product,
        "is_new": False,
        "active_nav": "products",
        "page_title": _("Edit product"),
    }
    return render(request, "dashboard/product_form.html", context)


@staff_member_required
def product_delete(request, pk):
    product = get_object_or_404(Product, pk=pk)
    if request.method == "POST":
        name = product.display_name
        product.delete()
        messages.success(request, _("“%(name)s” was deleted.") % {"name": name})
        return redirect("dashboard:products")
    return render(request, "dashboard/product_delete.html",
                  {"product": product, "active_nav": "products"})


@staff_member_required
@require_POST
def product_toggle(request, pk, action):
    product = get_object_or_404(Product, pk=pk)
    if action == "availability":
        product.is_available = not product.is_available
        product.save(update_fields=["is_available", "updated_at"])
        messages.success(
            request,
            _("“%(name)s” is now sold out.") % {"name": product.display_name}
            if not product.is_available
            else _("“%(name)s” is available again.") % {"name": product.display_name},
        )
    elif action == "published":
        product.is_published = not product.is_published
        product.save(update_fields=["is_published", "updated_at"])
        messages.success(
            request,
            _("“%(name)s” is now hidden from the menu.") % {"name": product.display_name}
            if not product.is_published
            else _("“%(name)s” is visible on the menu again.") % {"name": product.display_name},
        )
    elif action == "featured":
        product.is_featured = not product.is_featured
        product.save(update_fields=["is_featured", "updated_at"])
        messages.success(
            request,
            _("“%(name)s” was marked as featured.") % {"name": product.display_name}
            if product.is_featured
            else _("“%(name)s” is no longer featured.") % {"name": product.display_name},
        )
    else:
        raise Http404()
    return redirect(safe_next(request, reverse("dashboard:products")))


@staff_member_required
@require_POST
def product_move(request, pk):
    product = get_object_or_404(Product, pk=pk)
    direction = request.POST.get("direction")
    siblings = list(
        Product.objects.filter(category=product.category).order_by("display_order", "id")
    )
    index = siblings.index(product)
    new_index = index - 1 if direction == "up" else index + 1
    if 0 <= new_index < len(siblings):
        siblings[index], siblings[new_index] = siblings[new_index], siblings[index]
        for order, sibling in enumerate(siblings):
            if sibling.display_order != order:
                sibling.display_order = order
                sibling.save(update_fields=["display_order", "updated_at"])
    return redirect(safe_next(request, reverse("dashboard:products")))


# ------------------------------------------------------------------ categories

@staff_member_required
def category_list(request):
    categories = (
        Category.objects.order_by("display_order", "id")
    )
    context = {
        "categories": categories,
        "active_nav": "categories",
    }
    return render(request, "dashboard/category_list.html", context)


@staff_member_required
def category_create(request):
    form = CategoryForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        category = form.save()
        messages.success(request, _("Category “%(name)s” was added.") % {"name": category.display_name})
        return redirect("dashboard:categories")
    return render(request, "dashboard/category_form.html",
                  {"form": form, "is_new": True, "active_nav": "categories",
                   "page_title": _("Add category")})


@staff_member_required
def category_edit(request, pk):
    category = get_object_or_404(Category, pk=pk)
    form = CategoryForm(request.POST or None, instance=category)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, _("Category “%(name)s” was updated.") % {"name": category.display_name})
        return redirect("dashboard:categories")
    return render(request, "dashboard/category_form.html",
                  {"form": form, "category": category, "is_new": False,
                   "active_nav": "categories", "page_title": _("Edit category")})


@staff_member_required
def category_delete(request, pk):
    category = get_object_or_404(Category, pk=pk)
    product_count = category.products.count()
    if request.method == "POST":
        name = category.display_name
        try:
            category.delete()
            messages.success(request, _("Category “%(name)s” was deleted.") % {"name": name})
            return redirect("dashboard:categories")
        except ProtectedError:
            messages.error(
                request,
                _("This category still has products. Move or delete them first."),
            )
            return redirect("dashboard:categories")
    return render(request, "dashboard/category_delete.html",
                  {"category": category, "product_count": product_count,
                   "active_nav": "categories"})


@staff_member_required
@require_POST
def category_toggle(request, pk):
    category = get_object_or_404(Category, pk=pk)
    category.is_active = not category.is_active
    category.save(update_fields=["is_active", "updated_at"])
    return redirect(safe_next(request, reverse("dashboard:categories")))


@staff_member_required
@require_POST
def category_move(request, pk):
    category = get_object_or_404(Category, pk=pk)
    direction = request.POST.get("direction")
    siblings = list(Category.objects.order_by("display_order", "id"))
    index = siblings.index(category)
    new_index = index - 1 if direction == "up" else index + 1
    if 0 <= new_index < len(siblings):
        siblings[index], siblings[new_index] = siblings[new_index], siblings[index]
        for order, sibling in enumerate(siblings):
            if sibling.display_order != order:
                sibling.display_order = order
                sibling.save(update_fields=["display_order", "updated_at"])
    return redirect(safe_next(request, reverse("dashboard:categories")))


# ------------------------------------------------------------------ settings

@staff_member_required
def shop_settings(request):
    settings_obj = ShopSettings.load()
    form = ShopSettingsForm(request.POST or None, request.FILES or None, instance=settings_obj)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, _("Shop settings were saved."))
        return redirect("dashboard:settings")
    return render(request, "dashboard/settings_form.html",
                  {"form": form, "active_nav": "settings",
                   "page_title": _("Shop settings")})
