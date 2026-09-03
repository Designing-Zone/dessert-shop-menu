"""URL configuration for the Dessert Shop website."""
from django.conf import settings
from django.conf.urls.i18n import i18n_patterns
from django.conf.urls.static import static
from django.urls import include, path

urlpatterns = [
    path("i18n/", include("django.conf.urls.i18n")),  # set_language view
]

urlpatterns += i18n_patterns(
    path("", include("menu.urls")),
    path("dashboard/", include("dashboard.urls")),
)

handler404 = "menu.views.error_404"
handler500 = "menu.views.error_500"

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
