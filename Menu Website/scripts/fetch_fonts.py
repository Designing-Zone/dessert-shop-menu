"""
Download the site's fonts from Google Fonts and self-host them.

Generates:
  static/fonts/*.woff2
  static/css/fonts.css

Run:  python scripts/fetch_fonts.py
"""
import re
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
FONTS_DIR = BASE_DIR / "static" / "fonts"
CSS_PATH = BASE_DIR / "static" / "css" / "fonts.css"

# Subsets to keep per family (Google serves one file per unicode-range).
WANTED_SUBSETS = ("latin", "arabic")

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0 Safari/537.36"
)

CSS_API = (
    "https://fonts.googleapis.com/css2?"
    "family=Fraunces:opsz,wght@9..144,300..700"
    "&family=Figtree:wght@400..700"
    "&family=El+Messiri:wght@400..700"
    "&family=Almarai:wght@300;400;700"
    "&display=swap"
)


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def main():
    FONTS_DIR.mkdir(parents=True, exist_ok=True)
    CSS_PATH.parent.mkdir(parents=True, exist_ok=True)

    css = fetch(CSS_API).decode("utf-8")

    # Split into /* subset */ comment + @font-face block pairs.
    blocks = re.findall(r"/\*\s*([a-z0-9-]+)\s*\*/\s*(@font-face\s*\{[^}]+\})", css)
    out_css = []
    seen = set()

    for subset, block in blocks:
        if subset not in WANTED_SUBSETS:
            continue
        family = re.search(r"font-family:\s*'([^']+)'", block).group(1)
        style = re.search(r"font-style:\s*(\w+)", block).group(1)
        weight = re.search(r"font-weight:\s*([\d ]+)", block).group(1).strip()
        url = re.search(r"src:\s*url\(([^)]+\.woff2)\)", block).group(1)

        fname = f"{family.lower().replace(' ', '-')}-{weight.replace(' ', '-')}-{style}-{subset}.woff2"
        if fname in seen:
            continue
        seen.add(fname)

        data = fetch(url)
        (FONTS_DIR / fname).write_bytes(data)
        print(f"  {fname}  ({len(data) // 1024} KB)")

        new_block = re.sub(r"src:\s*url\([^)]+\)\s*format\('woff2'\)",
                           f"src: url('../fonts/{fname}') format('woff2')", block)
        new_block = re.sub(r"\n}", "\n}\n", new_block)
        out_css.append(f"/* {family} — {subset} */\n{new_block}")

    CSS_PATH.write_text("\n".join(out_css), encoding="utf-8")
    print(f"Wrote {CSS_PATH}")


if __name__ == "__main__":
    main()
