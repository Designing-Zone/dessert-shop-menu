from django.urls import path

from . import views

app_name = "dashboard"

urlpatterns = [
    path("", views.overview, name="overview"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("products/", views.product_list, name="products"),
    path("products/add/", views.product_create, name="product_add"),
    path("products/<int:pk>/edit/", views.product_edit, name="product_edit"),
    path("products/<int:pk>/delete/", views.product_delete, name="product_delete"),
    path("products/<int:pk>/toggle/<str:action>/", views.product_toggle, name="product_toggle"),
    path("products/<int:pk>/move/", views.product_move, name="product_move"),
    path("categories/", views.category_list, name="categories"),
    path("categories/add/", views.category_create, name="category_add"),
    path("categories/<int:pk>/edit/", views.category_edit, name="category_edit"),
    path("categories/<int:pk>/delete/", views.category_delete, name="category_delete"),
    path("categories/<int:pk>/toggle/", views.category_toggle, name="category_toggle"),
    path("categories/<int:pk>/move/", views.category_move, name="category_move"),
    path("settings/", views.shop_settings, name="settings"),
]
