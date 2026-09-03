from urllib.parse import quote

from django.conf import settings
from django.utils.translation import gettext as _

from .models import ShopSettings


def shop(request):
    """Expose shop settings, the WhatsApp order link and SEO image to all templates."""
    s = ShopSettings.load()

    whatsapp_url = None
    if s.whatsapp_number:
        digits = "".join(ch for ch in s.whatsapp_number if ch.isdigit())
        if digits:
            text = quote(_("Hello! I'd like to place an order."))
            whatsapp_url = f"https://wa.me/{digits}?text={text}"

    og_image = ""
    if s.hero_image:
        og_image = request.build_absolute_uri(s.hero_image.url)

    has_contact = bool(
        whatsapp_url or s.phone or s.address or s.hours or s.instagram_url
    )

    return {
        "shop_settings": s,
        "whatsapp_url": whatsapp_url,
        "og_image_url": og_image,
        "has_contact_section": has_contact,
        "MAX_UPLOAD_SIZE_MB": settings.MAX_UPLOAD_SIZE // (1024 * 1024),
    }
