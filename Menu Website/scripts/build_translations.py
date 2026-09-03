"""
Build the Arabic translation catalog for Dessert Shop.

- Extracts every translatable string from templates and Python code.
- Cross-checks it against the ARABIC dictionary below and reports gaps.
- Writes locale/ar/LC_MESSAGES/django.po
- Compiles locale/ar/LC_MESSAGES/django.mo  (pure Python — no gettext needed)

Run:  python scripts/build_translations.py
"""
import re
import sys
import time
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOCALE_DIR = BASE_DIR / "locale" / "ar" / "LC_MESSAGES"

TEMPLATE_DIRS = [BASE_DIR / "templates"]
PYTHON_FILES = [
    BASE_DIR / "dashboard" / "views.py",
    BASE_DIR / "dashboard" / "forms.py",
    BASE_DIR / "menu" / "context_processors.py",
    BASE_DIR / "menu" / "models.py",
    BASE_DIR / "menu" / "admin.py",
]

# ------------------------------------------------------------------ data

ARABIC = {
    # --- public: header / footer / shared
    "Baked fresh daily": "يُخبَز طازجًا يوميًا",
    "Baked fresh daily.": "يُخبَز طازجًا يوميًا.",
    "Cakes, cheesecakes, cookies and kahk — baked from scratch every morning at "
    "Dessert Shop. Browse the menu and order on WhatsApp.":
        "كيك وتشيز كيك وكوكيز وكحك — تُخبَز كل صباح من الصفر في ديسيرت شوب. "
        "تصفّح القائمة واطلب عبر واتساب.",
    "Main navigation": "التنقّل الرئيسي",
    "home": "الرئيسية",
    "Menu": "القائمة",
    "Featured": "مميّز",
    "Contact": "تواصل معنا",
    "Language": "اللغة",
    "Order": "اطلب",
    "Skip to the menu": "الانتقال إلى القائمة",
    "Footer": "تذييل الصفحة",

    # --- public: hero / strip
    "Browse the full Dessert Shop menu: cakes, cupcakes, cookies, cheesecake, "
    "cinnamon rolls, kahk and more. Freshly baked every day — order on WhatsApp.":
        "تصفّح قائمة ديسيرت شوب الكاملة: كيك وكب كيك وكوكيز وتشيز كيك ولفائف "
        "القرفة وكحك والمزيد. يُخبَز طازجًا كل يوم — اطلب عبر واتساب.",
    "Baked fresh every morning": "يُخبَز طازجًا كل صباح",
    "Sweet things,<br>made properly.": "حلويات،<br>بإتقانٍ حقيقي.",
    "Cakes, cheesecakes, cookies and kahk — everything is baked from scratch in "
    "small batches and leaves the shop the same day.":
        "كيك وتشيز كيك وكوكيز وكحك — كل شيء يُخبَز من الصفر بكميات صغيرة "
        "ويغادر المحل في اليوم نفسه.",
    "Browse the menu": "تصفّح القائمة",
    "Order on WhatsApp": "اطلب عبر واتساب",
    "Small batches": "دفعات صغيرة",
    "Real ingredients": "مكوّنات حقيقية",
    "Custom orders": "طلبات خاصة",
    "Freshly baked desserts at Dessert Shop": "حلويات طازجة من ديسيرت شوب",
    "From the oven": "من الفرن مباشرة",
    "Sold out": "نفدت الكمية",
    "Baked daily": "يُخبَز يوميًا",

    # --- public: menu
    "Menu categories": "أقسام القائمة",
    "%(counter)s item": ("لا أصناف", "صنف واحد", "صنفان",
                         "%(counter)s أصناف", "%(counter)s صنفًا", "%(counter)s صنف"),
    "%(counter)s items": None,  # plural twin — handled with the singular above
    "New items are coming to this section soon.": "أصناف جديدة ستُضاف إلى هذا القسم قريبًا.",

    # --- public: featured / about / order
    "Signature": "مختاراتنا",
    "Featured this week": "مميّز هذا الأسبوع",
    "Our promise": "وعدنا",
    "Real butter, real vanilla, no shortcuts.": "زبدة حقيقية وفانيليا حقيقية وبلا اختصارات.",
    "Our menu is short on purpose. Fewer things, done properly — baked the same "
    "morning they leave the shop, with ingredients we would serve at our own table.":
        "قائمتنا قصيرة عن قصد: أشياء أقل نُتقنها جيدًا — تُخبَز في الصباح نفسه "
        "الذي تغادر فيه المحل، بمكوّنات نضعها بكل ثقة على مائدتنا.",
    "Small batches, straight from the oven — never day-old.":
        "دفعات صغيرة من الفرن مباشرة — لا شيء متبقٍ من الأمس.",
    "Birthday cakes and event trays, made to order.":
        "كيك أعياد الميلاد وصواني المناسبات، تُجهَّز حسب الطلب.",
    "Pickup & delivery": "استلام وتوصيل",
    "Message us on WhatsApp and we arrange the rest.": "راسلنا على واتساب ونتولّى الباقي.",
    "Ordering": "الطلب",
    "Save yourself a trip — just message us.": "وفّر على نفسك الزحمة — راسلنا فقط.",
    "Tell us what you're craving and we'll have it boxed, fresh and ready for "
    "pickup or delivery.":
        "أخبرنا بما تشتهيه، وسنجده لك معبّأً طازجًا وجاهزًا للاستلام أو التوصيل.",
    "Call the shop": "اتصل بالمحل",
    "Address": "العنوان",
    "Hours": "مواعيد العمل",
    "Phone": "الهاتف",
    "Instagram": "إنستغرام",

    # --- error pages
    "Page not found": "الصفحة غير موجودة",
    "This page is out of the oven.": "يبدو أن هذه الصفحة اختفت من الفرن.",
    "The page you're looking for doesn't exist — but the menu certainly does.":
        "الصفحة التي تبحث عنها غير موجودة — لكن القائمة موجودة بالتأكيد.",
    "Back to the menu": "العودة إلى القائمة",
    "Something went wrong": "حدث خطأ ما",
    "A cake collapsed in the kitchen.": "يبدو أن شيئًا ما احترق في المطبخ.",
    "Something went wrong on our side. Please try again in a moment.":
        "حدث خطأ من جهتنا. حاول مجددًا بعد قليل.",

    # --- dashboard: auth / shell
    "Log in": "تسجيل الدخول",
    "Username": "اسم المستخدم",
    "Password": "كلمة المرور",
    "Welcome back": "أهلًا بعودتك",
    "← Back to the site": "→ العودة إلى الموقع",
    "Dashboard": "لوحة التحكم",
    "Dashboard navigation": "تنقّل لوحة التحكم",
    "Products": "المنتجات",
    "Categories": "الأقسام",
    "Settings": "الإعدادات",
    "View site": "عرض الموقع",
    "Log out": "تسجيل الخروج",

    # --- dashboard: overview
    "Overview": "نظرة عامة",
    "Good to see you": "سعيدٌ برؤيتك",
    "Here's what your menu looks like today.": "هذه صورة قائمتك اليوم.",
    "Add product": "إضافة منتج",
    "Total products": "إجمالي المنتجات",
    "Available": "متوفّر",
    "Hidden": "مخفي",
    "Recent products": "أحدث المنتجات",
    "View all": "عرض الكل",
    "added": "أُضيف في",
    "Edit": "تعديل",
    "Quick actions": "إجراءات سريعة",
    "Add a product": "أضف منتجًا",
    "New cakes, cookies and more.": "كيك وكوكيز والمزيد.",
    "Add a category": "أضف قسمًا",
    "Organize the menu your way.": "نظّم القائمة على طريقتك.",
    "Shop settings": "إعدادات المحل",
    "WhatsApp number, hours and address.": "رقم واتساب ومواعيد العمل والعنوان.",
    "No products yet. Add your first one to fill the menu.":
        "لا توجد منتجات بعد. أضف أول منتج لتكتمل القائمة.",

    # --- dashboard: products list
    "Everything on the menu, in display order.": "كل ما في القائمة، بترتيب العرض.",
    "Search products…": "ابحث في المنتجات…",
    "Search products": "البحث في المنتجات",
    "Filter by category": "تصفية حسب القسم",
    "All categories": "كل الأقسام",
    "Filter": "تصفية",
    "Clear": "مسح",
    "Product": "المنتج",
    "Category": "القسم",
    "Price": "السعر",
    "Status": "الحالة",
    "Sort": "الترتيب",
    "Actions": "الإجراءات",
    "Move up": "تقديم لأعلى",
    "Move down": "تأخير لأسفل",
    "Hide from menu": "الإخفاء من القائمة",
    "Show on menu": "الإظهار في القائمة",
    "Mark as sold out": "تعليمه: نفدت الكمية",
    "Mark as available": "تعليمه: متوفّر",
    "Feature": "تمييز",
    "Unfeature": "إلغاء التمييز",
    "Delete": "حذف",
    "No products found.": "لا توجد منتجات مطابقة.",
    "Try a different search, or add your first product to the menu.":
        "جرّب بحثًا مختلفًا، أو أضف أول منتج إلى القائمة.",
    "Previous": "السابق",
    "Next": "التالي",
    "Page %(number)s of %(total)s": "صفحة %(number)s من %(total)s",
    "Pagination": "تصفّح الصفحات",

    # --- dashboard: product form / delete
    "Please fix the highlighted fields below.": "يرجى تصحيح الحقول المميّزة أدناه.",
    "English": "الإنجليزية",
    "Name (English)": "الاسم (بالإنجليزية)",
    "Name (Arabic)": "الاسم (بالعربية)",
    "Description (English)": "الوصف (بالإنجليزية)",
    "Description (Arabic)": "الوصف (بالعربية)",
    "e.g. Chocolate Fudge Cake": "مثال: كيكة الشوكولاتة",
    "e.g. كيكة الشوكولاتة": "مثال: كيكة الشوكولاتة",
    "e.g. Cakes": "مثال: كيك",
    "e.g. كيك": "مثال: كيك",
    "A short, appetizing description.": "وصف قصير وشهي.",
    "Display order": "ترتيب العرض",
    "Product image": "صورة المنتج",
    "Currently:": "الحالي:",
    "uploading a new file replaces it.": "رفع ملف جديد سيستبدله.",
    "JPG, PNG or WebP, up to %(max_mb)s MB. Large photos are resized automatically.":
        "صيغ JPG أو PNG أو WebP حتى %(max_mb)s ميغابايت. تُصغَّر الصور الكبيرة تلقائيًا.",
    "Visibility": "الظهور",
    "Uncheck to mark it as sold out on the menu.": "أزل التحديد لتظهر في القائمة كنفدت الكمية.",
    "Visible on menu": "ظاهر في القائمة",
    "Uncheck to hide this product completely.": "أزل التحديد لإخفاء هذا المنتج تمامًا.",
    "Show it in the featured strip on the homepage.": "لإظهاره في شريط المميّزة بالصفحة الرئيسية.",
    "Save changes": "حفظ التغييرات",
    "Cancel": "إلغاء",
    "Edit product": "تعديل منتج",
    "view image": "عرض الصورة",
    "Delete product": "حذف منتج",
    "Are you sure you want to delete <strong>%(name)s</strong>? This cannot be undone.":
        "هل أنت متأكد من حذف <strong>%(name)s</strong>؟ لا يمكن التراجع عن هذه الخطوة.",
    "Yes, delete it": "نعم، احذفه",

    # --- dashboard: categories
    "Sections of your menu, in display order.": "أقسام قائمتك، بترتيب العرض.",
    "Add category": "إضافة قسم",
    "Visible": "ظاهر",
    "Hide on menu": "الإخفاء من القائمة",
    "No categories yet.": "لا توجد أقسام بعد.",
    "Create your first category — for example Cakes or Cookies — and add products to it.":
        "أنشئ أول قسم — مثل «كيك» أو «كوكيز» — ثم أضف إليه منتجات.",
    "Edit category": "تعديل قسم",
    "Hidden categories keep their products but disappear from the site.":
        "الأقسام المخفية تحتفظ بمنتجاتها لكنها تختفي من الموقع.",
    "Delete category": "حذف قسم",
    "“%(name)s” still contains <strong>%(counter)s product</strong>. It must be "
    "empty before it can be deleted.":
        ("القسم «%(name)s» لا يحتوي على أي منتجات. يمكن حذفه الآن.",
         "لا يزال قسم «%(name)s» يحتوي على <strong>منتج واحد</strong>. يجب أن يفرغ قبل حذفه.",
         "لا يزال قسم «%(name)s» يحتوي على <strong>منتجين</strong>. يجب أن يفرغ قبل حذفه.",
         "لا يزال قسم «%(name)s» يحتوي على <strong>%(counter)s منتجات</strong>. يجب أن يفرغ قبل حذفه.",
         "لا يزال قسم «%(name)s» يحتوي على <strong>%(counter)s منتجًا</strong>. يجب أن يفرغ قبل حذفه.",
         "لا يزال قسم «%(name)s» يحتوي على <strong>%(counter)s منتج</strong>. يجب أن يفرغ قبل حذفه."),
    "“%(name)s” still contains <strong>%(counter)s products</strong>. It must be "
    "empty before it can be deleted.": None,
    "Show its products": "عرض منتجاته",

    # --- dashboard: settings
    "Contact details shown on the website. Everything is optional.":
        "بيانات التواصل التي تظهر على الموقع. كل الحقول اختيارية.",
    "WhatsApp number": "رقم واتساب",
    "Digits only, including the country code (e.g. 201234567890).":
        "أرقام فقط مع رمز الدولة (مثال: 201234567890).",
    "Phone number": "رقم الهاتف",
    "Visit us": "زورونا",
    "Address (English)": "العنوان (بالإنجليزية)",
    "Address (Arabic)": "العنوان (بالعربية)",
    "Opening hours (English)": "مواعيد العمل (بالإنجليزية)",
    "Opening hours (Arabic)": "مواعيد العمل (بالعربية)",
    "Instagram URL": "رابط إنستغرام",
    "Hero image": "صورة الغلاف",
    "The large photo in the homepage hero. Without one, your first featured product is used.":
        "الصورة الكبيرة في مقدمة الصفحة الرئيسية. بدونها، يُستخدم أول منتج مميّز.",
    "Save settings": "حفظ الإعدادات",

    # --- dashboard: messages / validation (python)
    "“%(name)s” was added.": "تمت إضافة «%(name)s».",
    "“%(name)s” was updated.": "تم تحديث «%(name)s».",
    "“%(name)s” was deleted.": "تم حذف «%(name)s».",
    "“%(name)s” is now sold out.": "«%(name)s»: نفدت الكمية الآن.",
    "“%(name)s” is available again.": "«%(name)s»: متوفّر مرة أخرى.",
    "“%(name)s” is now hidden from the menu.": "تم إخفاء «%(name)s» من القائمة.",
    "“%(name)s” is visible on the menu again.": "ظهر «%(name)s» في القائمة من جديد.",
    "“%(name)s” was marked as featured.": "تم تمييز «%(name)s».",
    "“%(name)s” is no longer featured.": "أُلغي تمييز «%(name)s».",
    "Category “%(name)s” was added.": "تمت إضافة القسم «%(name)s».",
    "Category “%(name)s” was updated.": "تم تحديث القسم «%(name)s».",
    "Category “%(name)s” was deleted.": "تم حذف القسم «%(name)s».",
    "This category still has products. Move or delete them first.":
        "لا يزال هذا القسم يحتوي على منتجات. انقلها أو احذفها أولًا.",
    "Shop settings were saved.": "تم حفظ إعدادات المحل.",
    "Please enter a realistic price.": "يرجى إدخال سعر منطقي.",
    "The image is too large. Please use a file under 5 MB.":
        "الصورة كبيرة جدًا. يرجى استخدام ملف أصغر من 5 ميغابايت.",
    "Hello! I'd like to place an order.": "مرحبًا! أودّ تقديم طلب.",
}

# Plural msgids that share a catalog entry with their singular twin.
PLURAL_TWINS = {
    "%(counter)s item": "%(counter)s items",
    "“%(name)s” still contains <strong>%(counter)s product</strong>. It must be "
    "empty before it can be deleted.":
        "“%(name)s” still contains <strong>%(counter)s products</strong>. It must be "
        "empty before it can be deleted.",
}

# ------------------------------------------------------------------ extraction

TRANS_RE = re.compile(r"""\{%\s*trans\s+(["'])(.+?)\1[\s%]*%\}""", re.S)
BLOCKTRANS_RE = re.compile(
    r"\{%\s*blocktrans\b(?P<opts>[^%]*)%\}(?P<body>.*?)"
    r"(?:\{%\s*plural\s*%\}(?P<plural>.*?))?"
    r"\{%\s*endblocktrans\s*%\}",
    re.S,
)
VAR_RE = re.compile(r"\{\{\s*([^}]+?)\s*\}\}")
PY_STR_RE = re.compile(r"""_\(\s*"((?:[^"\\]|\\.)*)"\s*\)""")


def normalize(text):
    """Collapse whitespace the way Django's blocktrans does."""
    return " ".join(text.split())


def to_msgid(body):
    return VAR_RE.sub(lambda m: "%(" + m.group(1).strip() + ")s", normalize(body))


def extract_from_templates():
    msgids = set()
    plural_pairs = {}
    for directory in TEMPLATE_DIRS:
        for path in sorted(directory.rglob("*.html")):
            text = path.read_text(encoding="utf-8")
            for match in TRANS_RE.finditer(text):
                msgids.add(normalize(match.group(2)))
            for match in BLOCKTRANS_RE.finditer(text):
                singular = to_msgid(match.group("body"))
                if match.group("plural"):
                    plural = to_msgid(match.group("plural"))
                    plural_pairs[singular] = plural
                msgids.add(singular)
    return msgids, plural_pairs


def extract_from_python():
    msgids = set()
    for path in PYTHON_FILES:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        for match in PY_STR_RE.finditer(text):
            raw = match.group(1)
            raw = raw.replace('\\"', '"').replace("\\\\", "\\").replace("\\n", "\n")
            msgids.add(raw)
    return msgids


# ------------------------------------------------------------------ po / mo

PO_HEADER = """\
# Arabic translations for the Dessert Shop website.
msgid ""
msgstr ""
"Project-Id-Version: Dessert Shop\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: {now}\\n"
"PO-Revision-Date: {now}\\n"
"Last-Translator: \\n"
"Language-Team: Arabic\\n"
"Language: ar\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Plural-Forms: nplurals=6; plural=(n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 "
"&& n%100<=10 ? 3 : n%100>=11 && n%100!=100 ? 4 : 5);\\n"
"""


def po_quote(text):
    return (
        text.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\n", "\\n")
        .replace("\t", "\\t")
    )


def po_unquote(text):
    return (
        text.replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace('\\"', '"')
        .replace("\\\\", "\\")
    )


def write_po(entries):
    parts = [PO_HEADER.format(now=time.strftime("%Y-%m-%d %H:%M+0000"))]
    for msgid, data in entries:
        if data["plural"] is not None:
            parts.append(f'msgid "{po_quote(msgid)}"')
            parts.append(f'msgid_plural "{po_quote(data["plural"])}"')
            for index, form in enumerate(data["msgstr"]):
                parts.append(f'msgstr[{index}] "{po_quote(form)}"')
        else:
            parts.append(f'msgid "{po_quote(msgid)}"')
            parts.append(f'msgstr "{po_quote(data["msgstr"])}"')
        parts.append("")
    (LOCALE_DIR / "django.po").write_text("\n".join(parts), encoding="utf-8")


def parse_po(text):
    """Minimal gettext .po parser → list of (msgid, plural, [forms])."""
    entries = []
    msgid = plural = None
    msgstrs = {}
    mode = None  # 'id' | 'id_plural' | 'str' | ('str', n)

    def flush():
        nonlocal msgid, plural, msgstrs, mode
        if msgid is not None:
            forms = [msgstrs[i] for i in sorted(msgstrs)] if msgstrs else [""]
            entries.append((msgid, plural, forms))
        msgid = plural = None
        msgstrs = {}
        mode = None

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("msgid_plural "):
            plural = po_unquote(line[len("msgid_plural "):].strip().strip('"'))
            mode = "id_plural"
            continue
        if line.startswith("msgid "):
            flush()
            msgid = po_unquote(line[len("msgid "):].strip().strip('"'))
            mode = "id"
            continue
        match = re.match(r"msgstr\[(\d+)\]\s+(.*)", line)
        if match:
            index = int(match.group(1))
            msgstrs[index] = po_unquote(match.group(2).strip().strip('"'))
            mode = ("str", index)
            continue
        if line.startswith("msgstr "):
            msgstrs[0] = po_unquote(line[len("msgstr "):].strip().strip('"'))
            mode = ("str", 0)
            continue
        if line.startswith('"') and mode is not None:
            continuation = po_unquote(line.strip('"'))
            if mode == "id" and msgid is not None:
                msgid += continuation
            elif mode == "id_plural" and plural is not None:
                plural += continuation
            elif isinstance(mode, tuple) and mode[0] == "str":
                msgstrs[mode[1]] += continuation
    flush()
    return entries


def write_mo(entries):
    """Compile to GNU gettext .mo (machine object) format."""
    import struct

    catalog = []
    for msgid, plural, forms in entries:
        key = msgid.encode("utf-8")
        if plural is not None:
            key = key + b"\x00" + plural.encode("utf-8")
            value = "\x00".join(forms).encode("utf-8")
        else:
            value = forms[0].encode("utf-8")
        catalog.append((key, value))
    catalog.sort(key=lambda item: item[0])

    n = len(catalog)
    keystart = 7 * 4 + 16 * n
    key_blob = b"".join(key + b"\x00" for key, _ in catalog)
    value_blob = b"".join(value + b"\x00" for _, value in catalog)
    valuestart = keystart + len(key_blob)

    key_lengths = []
    key_offset = keystart
    for key, _ in catalog:
        key_lengths.append((len(key), key_offset))
        key_offset += len(key) + 1
    value_lengths = []
    value_offset = valuestart
    for _, value in catalog:
        value_lengths.append((len(value), value_offset))
        value_offset += len(value) + 1

    output = struct.pack(
        "<Iiiiiii",
        0x950412DE,  # magic
        0,           # version
        n,           # number of entries
        7 * 4,       # offset of key index
        7 * 4 + n * 8,  # offset of value index
        0, 0,        # hash table
    )
    for length, offset in key_lengths:
        output += struct.pack("<ii", length, offset)
    for length, offset in value_lengths:
        output += struct.pack("<ii", length, offset)
    output += key_blob + value_blob
    (LOCALE_DIR / "django.mo").write_bytes(output)


# ------------------------------------------------------------------ main

def main():
    LOCALE_DIR.mkdir(parents=True, exist_ok=True)

    template_ids, extracted_pairs = extract_from_templates()
    python_ids = extract_from_python()
    all_ids = template_ids | python_ids

    entries = []
    missing = []
    for msgid in sorted(all_ids):
        if msgid in extracted_pairs and msgid not in PLURAL_TWINS:
            # A plural blocktrans whose singular key wasn't in the dict map.
            data_plural = extracted_pairs[msgid]
        elif msgid in PLURAL_TWINS:
            data_plural = PLURAL_TWINS[msgid]
        else:
            data_plural = None

        translation = ARABIC.get(msgid)
        if translation is None:
            missing.append(msgid)
            if data_plural:
                translation = [""] * 6
            else:
                translation = ""
        if isinstance(translation, tuple):
            translation = list(translation)

        if data_plural:
            # Normalize: plural entries must have exactly 6 forms for Arabic.
            if isinstance(translation, str):
                translation = [translation] * 6
            while len(translation) < 6:
                translation.append(translation[-1] if translation else "")
            entries.append({
                "msgid": msgid,
                "plural": data_plural,
                "msgstr": translation[:6],
            })
        else:
            if isinstance(translation, list):
                translation = translation[1] if len(translation) > 1 else ""
            entries.append({"msgid": msgid, "plural": None, "msgstr": translation})

    write_po([(e["msgid"], e) for e in entries])

    po_text = (LOCALE_DIR / "django.po").read_text(encoding="utf-8")
    parsed = parse_po(po_text)
    write_mo(parsed)

    print(f"Extracted {len(all_ids)} strings ({len(parsed)} catalog entries).")
    print(f"Wrote {LOCALE_DIR / 'django.po'}")
    print(f"Compiled {LOCALE_DIR / 'django.mo'}")
    if missing:
        print("\nMissing Arabic translations (falling back to English):")
        for msgid in missing:
            print(f"  ! {msgid}")
        sys.exit(1)


if __name__ == "__main__":
    main()
