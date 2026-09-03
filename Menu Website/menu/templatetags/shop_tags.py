from decimal import Decimal, InvalidOperation
from urllib.parse import quote

from django import template
from django.urls import reverse
from django.utils.translation import get_language

from ..models import ShopSettings

register = template.Library()


@register.filter
def price(value):
    """Format a decimal price consistently, e.g. "1,250 EGP" or "149.50 EGP"."""
    try:
        amount = Decimal(value).quantize(Decimal("0.01"))
    except (InvalidOperation, TypeError, ValueError):
        return ""
    if amount == amount.to_integral_value():
        text = f"{int(amount):,}"
    else:
        text = f"{amount:,}"
    return f"{text} EGP"


@register.simple_tag(takes_context=True)
def language_url(context, lang_code):
    """Absolute URL of the current page in another language (hreflang alternates)."""
    request = context.get("request")
    path = f"/{lang_code}/"
    if request is not None:
        path_info = request.path_info
        current = (get_language() or "en").split("-")[0]
        prefix = f"/{current}/"
        rest = path_info[len(prefix):] if path_info.startswith(prefix) else path_info.lstrip("/")
        path = f"/{lang_code}/" + rest
        return request.build_absolute_uri(path)
    return path


@register.simple_tag
def dashboard_url(name, *args):
    return reverse(name, args=args)


@register.simple_tag
def whatsapp_product_url(product_name):
    """A wa.me link with a per-product custom message asking about the item."""
    s = ShopSettings.load()
    if not s.whatsapp_number:
        return ""
    digits = "".join(ch for ch in s.whatsapp_number if ch.isdigit())
    if not digits:
        return ""
    text = quote(f"كنت حابب أسأل عن {product_name}")
    return f"https://wa.me/{digits}?text={text}"
