# /// script
# requires-python = ">=3.11"
# dependencies = ["pymupdf>=1.26", "pillow>=11"]
# ///
"""Extrae el dosier local; las equivalencias se revisan en data/overrides.json."""
from pathlib import Path
from io import BytesIO
import hashlib
import json
import re
import unicodedata

import pymupdf
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "DOSIER EDIFICIOS PRIMER PARCIAL .pdf"
OUT = ROOT / "public"


def slug(value):
    plain = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", plain).strip("-")


def main():
    doc = pymupdf.open(PDF)
    (OUT / "images").mkdir(parents=True, exist_ok=True)
    (OUT / "pages").mkdir(parents=True, exist_ok=True)
    overrides = json.loads((ROOT / "data/overrides.json").read_text())
    sources = []
    topic = None
    image_count = 0
    current = None
    field = None
    for page_number, page in enumerate(doc, 1):
        rows = []
        for block in page.get_text("blocks"):
            text = re.sub(r"\s+", " ", block[4]).strip()
            if not text:
                continue
            theme = re.fullmatch(r"TEMA\s+(\d+)", text)
            if theme:
                topic = int(theme[1])
                continue
            parts = re.split(r"(NOMBRE|ARQUITECTO|UBICACI[ÓO]N|FECHA):\s*", text)
            if len(parts) > 1:
                if parts[0].strip() and current and field:
                    current[field] = (current[field] + " " + parts[0].strip()).strip()
                for idx in range(1, len(parts), 2):
                    field = {"NOMBRE": "name", "ARQUITECTO": "architect", "UBICACIÓN": "location", "UBICACION": "location", "FECHA": "date"}[parts[idx]]
                    if field == "name":
                        current = {"sourceId": f"p{page_number:02}-{len(rows)+1:02}", "page": page_number, "pages": [page_number], "topic": topic, "name": "", "architect": "", "location": "", "date": "", "images": [], "y": block[1]}
                        rows.append(current)
                    if current:
                        current[field] = parts[idx + 1].strip()
                        if page_number not in current["pages"]:
                            current["pages"].append(page_number)
            elif current and field:
                current[field] = (current[field] + " " + text).strip()
                if page_number not in current["pages"]:
                    current["pages"].append(page_number)
        for info in page.get_image_info(xrefs=True):
            if not rows:
                raise ValueError(f"Imagen sin ficha en página {page_number}")
            # Las imágenes están alineadas con el comienzo de la ficha, no con
            # el centro de su texto (que varía mucho entre edificios).
            target = min(rows, key=lambda row: abs(info["bbox"][1] - row["y"]))
            image_count += 1
            original = doc.extract_image(info["xref"])
            path = f"images/p{page_number:02}-{image_count:03}.webp"
            photo = Image.open(BytesIO(original["image"])).convert("RGB")
            photo.thumbnail((1600, 1600))
            photo.save(OUT / path, "WEBP", quality=86, method=6)
            target["images"].append({"src": path, "width": photo.width, "height": photo.height, "page": page_number})
        preview = page.get_pixmap(matrix=pymupdf.Matrix(1.7, 1.7), alpha=False)
        Image.frombytes("RGB", (preview.width, preview.height), preview.samples).save(OUT / f"pages/{page_number:02}.webp", "WEBP", quality=86)
        for row in rows:
            row.pop("y")
            sources.append(row)
    # Correcciones de asociación visual, nunca de datos del documento.
    by_source = {row["sourceId"]: row for row in sources}
    for move in overrides.get("imageMoves", []):
        origin = by_source[move["from"]]
        image = next(image for image in origin["images"] if image["src"] == move["image"])
        origin["images"].remove(image)
        by_source[move["to"]]["images"].append(image)
        if image["page"] not in by_source[move["to"]]["pages"]:
            by_source[move["to"]]["pages"].append(image["page"])
            by_source[move["to"]]["pages"].sort()
    groups = {}
    aliases = overrides.get("aliases", {})
    for row in sources:
        ident = aliases.get(row["sourceId"], slug(row["name"]))
        groups.setdefault(ident, {"id": ident, "sources": [], "images": [], "notes": []})
        groups[ident]["sources"].append({k: v for k, v in row.items() if k != "images"})
        groups[ident]["images"].extend(row["images"])
    for building in groups.values():
        building["notes"] = overrides.get("notes", {}).get(building["id"], [])
        missing = [s for s in building["sources"] if any(not s[f] or s[f] == "-" for f in ("name", "architect", "location", "date"))]
        if missing:
            building["notes"].append("Hay campos sin dato en el dosier. Se conservan tal como aparecen.")
        if len(building["sources"]) > 1:
            building["notes"].append("El edificio aparece en varias fichas del dosier. Consulta las versiones y sus páginas de origen.")
    payload = {"pageCount": len(doc), "sourceCount": len(sources), "imageCount": image_count, "pdfSha256": hashlib.sha256(PDF.read_bytes()).hexdigest(), "buildings": list(groups.values())}
    (ROOT / "data/buildings.json").write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    print(f"{len(sources)} fichas, {len(groups)} edificios, {image_count} imágenes")
    for row in sources:
        print(row["sourceId"], len(row["images"]), row["name"], "|", row["architect"], "|", row["location"], "|", row["date"])


if __name__ == "__main__":
    main()
