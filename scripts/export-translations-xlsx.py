#!/usr/bin/env python3
"""Export all site translations (UI + institutional) into a review spreadsheet."""

from __future__ import annotations

import json
import re
import sys
from collections import OrderedDict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".tmp" / "pydeps"))

from openpyxl import Workbook
from openpyxl.styles import Alignment, Font, PatternFill, Border, Side
from openpyxl.utils import get_column_letter

LOCALES = ("en", "pt-BR", "es", "zh-CN")
LOCALE_HEADERS = ("EN", "PT-BR", "ES", "ZH-CN")
OUT = ROOT / "docs" / "translations-review.xlsx"

HEADER_FILL = PatternFill("solid", fgColor="01203F")
HEADER_FONT = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
ALT_FILL = PatternFill("solid", fgColor="F1F5F1")
THIN = Border(
    left=Side(style="thin", color="D0D5D0"),
    right=Side(style="thin", color="D0D5D0"),
    top=Side(style="thin", color="D0D5D0"),
    bottom=Side(style="thin", color="D0D5D0"),
)
WRAP = Alignment(wrap_text=True, vertical="top")


def flatten(obj, prefix=""):
    rows = []
    if isinstance(obj, dict):
        for key, value in obj.items():
            path = f"{prefix}.{key}" if prefix else key
            rows.extend(flatten(value, path))
    elif isinstance(obj, list):
        for i, value in enumerate(obj):
            path = f"{prefix}[{i}]"
            rows.extend(flatten(value, path))
    else:
        rows.append((prefix, "" if obj is None else str(obj)))
    return rows


def load_messages():
    by_locale = {}
    for loc in LOCALES:
        path = ROOT / "messages" / f"{loc}.json"
        by_locale[loc] = json.loads(path.read_text(encoding="utf-8"))
    return by_locale


def merge_message_section(by_locale, section: str):
    """Align keys across locales for one top-level messages section."""
    keys = OrderedDict()
    for loc in LOCALES:
        section_data = by_locale[loc].get(section, {})
        for key, value in flatten(section_data):
            keys.setdefault(key, {})
            keys[key][loc] = value
    rows = []
    for key, values in keys.items():
        rows.append(
            {
                "source": "messages",
                "key": f"{section}.{key}" if key else section,
                **{loc: values.get(loc, "") for loc in LOCALES},
            }
        )
    return rows


def strip_ts_string(raw: str) -> str:
    s = raw.strip()
    if (s.startswith('"') and s.endswith('"')) or (s.startswith("'") and s.endswith("'")):
        s = s[1:-1]
    # unescape common sequences
    s = (
        s.replace("\\n", "\n")
        .replace("\\t", "\t")
        .replace('\\"', '"')
        .replace("\\'", "'")
        .replace("\\\\", "\\")
    )
    return s


STRING_LIT = r'(?:"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\')'


def extract_loc_calls(text: str, fn_names=("loc", "homeLoc", "L")):
    """Extract loc(en, pt?, es?, zh?) calls. Returns list of {en,pt-BR,es,zh-CN}."""
    pattern = re.compile(
        rf"(?:{'|'.join(fn_names)})\s*\(\s*"
        rf"({STRING_LIT})"
        rf"(?:\s*,\s*({STRING_LIT}))?"
        rf"(?:\s*,\s*({STRING_LIT}))?"
        rf"(?:\s*,\s*({STRING_LIT}))?"
        rf"\s*\)",
        re.MULTILINE,
    )
    out = []
    for m in pattern.finditer(text):
        en = strip_ts_string(m.group(1))
        pt = strip_ts_string(m.group(2)) if m.group(2) else en
        es = strip_ts_string(m.group(3)) if m.group(3) else en
        zh = strip_ts_string(m.group(4)) if m.group(4) else en
        out.append({"en": en, "pt-BR": pt, "es": es, "zh-CN": zh})
    return out


def extract_home_i18n_labeled(text: str):
    """Extract homeLoc with nearest key path from HOME_I18N object."""
    # Match "key: homeLoc(...)"
    pattern = re.compile(
        rf"([A-Za-z0-9_]+)\s*:\s*homeLoc\s*\(\s*"
        rf"({STRING_LIT})\s*,\s*"
        rf"({STRING_LIT})\s*,\s*"
        rf"({STRING_LIT})\s*,\s*"
        rf"({STRING_LIT})\s*\)",
        re.MULTILINE,
    )
    rows = []
    for m in pattern.finditer(text):
        key = m.group(1)
        rows.append(
            {
                "source": "homepage-i18n",
                "key": key,
                "en": strip_ts_string(m.group(2)),
                "pt-BR": strip_ts_string(m.group(3)),
                "es": strip_ts_string(m.group(4)),
                "zh-CN": strip_ts_string(m.group(5)),
            }
        )
    return rows


def extract_object_loc_fields(text: str, source: str):
    """
    Extract patterns like:
      title: loc("en", "pt", "es", "zh"),
      description: loc(...),
    Prefer labeled keys when available.
    """
    pattern = re.compile(
        rf"([A-Za-z0-9_]+)\s*:\s*(?:loc|L|homeLoc)\s*\(\s*"
        rf"({STRING_LIT})"
        rf"(?:\s*,\s*({STRING_LIT}))?"
        rf"(?:\s*,\s*({STRING_LIT}))?"
        rf"(?:\s*,\s*({STRING_LIT}))?"
        rf"\s*\)",
        re.MULTILINE,
    )
    rows = []
    for i, m in enumerate(pattern.finditer(text), start=1):
        key = m.group(1)
        en = strip_ts_string(m.group(2))
        pt = strip_ts_string(m.group(3)) if m.group(3) else en
        es = strip_ts_string(m.group(4)) if m.group(4) else en
        zh = strip_ts_string(m.group(5)) if m.group(5) else en
        rows.append(
            {
                "source": source,
                "key": f"{key}#{i}",
                "en": en,
                "pt-BR": pt,
                "es": es,
                "zh-CN": zh,
            }
        )
    return rows


def extract_exported_string_consts(path: Path, locale_map: dict[str, str]):
    """Extract export const FOO = \"...\" or multi-line template-ish string literals."""
    text = path.read_text(encoding="utf-8")
    pattern = re.compile(
        rf"export const ([A-Z0-9_]+)\s*=\s*({STRING_LIT})\s*;",
        re.MULTILINE,
    )
    rows = []
    for m in pattern.finditer(text):
        name = m.group(1)
        value = strip_ts_string(m.group(2))
        row = {"source": path.name, "key": name, **{loc: "" for loc in LOCALES}}
        for loc, suffix in locale_map.items():
            if path.name.endswith(suffix) or (suffix == "" and "pt-BR" not in path.name):
                row[loc] = value
        rows.append(row)
    return rows


def extract_legal_sections(path: Path, locale: str, array_names: list[str]):
    """Extract title/text/items from LegalSection-like TS arrays."""
    text = path.read_text(encoding="utf-8")
    rows = []

    # title: "..."
    for i, m in enumerate(
        re.finditer(rf'title:\s*({STRING_LIT})', text), start=1
    ):
        rows.append(
            {
                "source": path.name,
                "key": f"section[{i}].title",
                **{loc: "" for loc in LOCALES},
                locale: strip_ts_string(m.group(1)),
            }
        )

    # text: "..."
    for i, m in enumerate(re.finditer(rf'text:\s*({STRING_LIT})', text), start=1):
        rows.append(
            {
                "source": path.name,
                "key": f"block[{i}].text",
                **{loc: "" for loc in LOCALES},
                locale: strip_ts_string(m.group(1)),
            }
        )

    # items: ["...", "..."]
    for bi, block in enumerate(
        re.finditer(r"items:\s*\[(.*?)\]", text, re.DOTALL), start=1
    ):
        for ii, sm in enumerate(
            re.finditer(STRING_LIT, block.group(1)), start=1
        ):
            rows.append(
                {
                    "source": path.name,
                    "key": f"list[{bi}].item[{ii}]",
                    **{loc: "" for loc in LOCALES},
                    locale: strip_ts_string(sm.group(0)),
                }
            )
    return rows


def merge_legal_by_key(en_rows, pt_rows=None):
    """Merge EN + optional PT legal rows on key; leave ES/ZH blank if missing."""
    by_key = OrderedDict()
    for row in en_rows:
        by_key[row["key"]] = row
    if pt_rows:
        for row in pt_rows:
            if row["key"] in by_key:
                by_key[row["key"]]["pt-BR"] = row.get("pt-BR") or row.get("en") or ""
            else:
                by_key[row["key"]] = row
    return list(by_key.values())


def sheet_name(name: str) -> str:
    cleaned = re.sub(r"[\[\]\*\:\?\/\\]", "-", name)
    return cleaned[:31]


def write_sheet(wb: Workbook, title: str, rows: list[dict], note: str = ""):
    ws = wb.create_sheet(title=sheet_name(title))
    headers = ["Source", "Key", *LOCALE_HEADERS, "Notes / Reviewer"]
    if note:
        ws.append([note])
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(headers))
        ws["A1"].font = Font(italic=True, color="004F7C")
        ws["A1"].alignment = WRAP
        start = 2
    else:
        start = 1

    for col, h in enumerate(headers, 1):
        cell = ws.cell(row=start, column=col, value=h)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(vertical="center")
        cell.border = THIN

    for r_i, row in enumerate(rows, start=start + 1):
        values = [
            row.get("source", ""),
            row.get("key", ""),
            row.get("en", ""),
            row.get("pt-BR", ""),
            row.get("es", ""),
            row.get("zh-CN", ""),
            "",
        ]
        for c_i, value in enumerate(values, 1):
            cell = ws.cell(row=r_i, column=c_i, value=value)
            cell.alignment = WRAP
            cell.border = THIN
            if (r_i - start) % 2 == 0:
                cell.fill = ALT_FILL

    widths = [18, 42, 42, 42, 42, 42, 28]
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[get_column_letter(i)].width = w
    ws.freeze_panes = f"A{start + 1}"
    ws.auto_filter.ref = f"A{start}:{get_column_letter(len(headers))}{start + max(len(rows), 1)}"
    return ws


# Map message top-level keys → sheet groups
MESSAGE_SHEETS = OrderedDict(
    [
        (
            "01_UI_Nav_Footer_Common",
            ["metadata", "cookies", "nav", "footer", "common", "pages"],
        ),
        (
            "02_UI_Home",
            [
                "hero",
                "companyOverview",
                "globalPresence",
                "solutions",
                "industries",
                "innovation",
                "sustainability",
                "news",
                "certifications",
                "cta",
                "homeCta",
                "homeEcosystem",
            ],
        ),
        ("03_UI_Shop", ["shop"]),
        ("04_UI_Solutions", ["solutionsPage"]),
        ("05_UI_About_Contact", ["aboutPage", "aboutV2", "contact"]),
        (
            "06_UI_Blog_News_FAQs_Cases",
            ["blog", "newsPage", "faqsPage", "caseStudies", "workWithUsPage"],
        ),
        ("07_UI_Legal_Admin", ["legalPage", "admin"]),
    ]
)


def main():
    by_locale = load_messages()
    wb = Workbook()
    # README
    ws0 = wb.active
    ws0.title = "00_README"
    readme = [
        ["Oboya Website — Translation Review Workbook"],
        [""],
        ["Locales: EN | PT-BR | ES | ZH-CN"],
        ["Generated for operational validation by country teams."],
        [""],
        ["How to use"],
        ["1. Each sheet is a site section (UI messages or institutional CMS/legal copy)."],
        ["2. Columns EN / PT-BR / ES / ZH-CN are side by side for comparison."],
        ["3. Use the Notes / Reviewer column to flag corrections."],
        ["4. Prefer editing the Key-aligned row; keep keys unchanged."],
        [""],
        ["Coverage"],
        ["- messages/*.json — all public + admin UI strings"],
        ["- Homepage CMS defaults (homepage-i18n + homepage-repository)"],
        ["- About page CMS defaults (about-page-repository)"],
        ["- Solutions page CMS defaults (solutions-page-repository)"],
        ["- FAQs CMS defaults (faqs-repository)"],
        ["- Case studies CMS defaults (case-studies-repository)"],
        ["- News page CMS defaults (news-page-repository)"],
        ["- Blog i18n helpers"],
        ["- Privacy Policy (EN + PT-BR; ES/ZH may need translation)"],
        ["- Terms of Use (EN base; other locales may need translation)"],
        [""],
        ["Notes"],
        ["- Some CMS content is authored in Admin and may differ live from these defaults."],
        ["- Privacy Policy controlling versions are EN and PT-BR."],
        ["- Terms of Use is currently English-primary in code."],
        ["- Empty cells mean missing translation (falls back to EN on the site)."],
    ]
    for r in readme:
        ws0.append(r)
    ws0.column_dimensions["A"].width = 100
    ws0["A1"].font = Font(bold=True, size=14, color="01203F")

    # Message sheets
    for sheet, sections in MESSAGE_SHEETS.items():
        rows = []
        for section in sections:
            rows.extend(merge_message_section(by_locale, section))
        write_sheet(
            wb,
            sheet,
            rows,
            note=f"UI strings from messages/*.json — sections: {', '.join(sections)}",
        )

    # Homepage i18n
    home_i18n = (ROOT / "src/lib/cms/homepage-i18n.ts").read_text(encoding="utf-8")
    home_repo = (ROOT / "src/lib/cms/repositories/homepage-repository.ts").read_text(
        encoding="utf-8"
    )
    write_sheet(
        wb,
        "08_CMS_Homepage",
        extract_home_i18n_labeled(home_i18n)
        + extract_object_loc_fields(home_repo, "homepage-repository"),
        note="Homepage institutional defaults (homepage-i18n.ts + homepage-repository.ts)",
    )

    # About
    about = (ROOT / "src/lib/cms/repositories/about-page-repository.ts").read_text(
        encoding="utf-8"
    )
    write_sheet(
        wb,
        "09_CMS_About",
        extract_object_loc_fields(about, "about-page-repository"),
        note="About page CMS defaults — hero, timeline, impact, culture, mission, vision, values, etc.",
    )

    # Solutions CMS
    solutions = (
        ROOT / "src/lib/cms/repositories/solutions-page-repository.ts"
    ).read_text(encoding="utf-8")
    write_sheet(
        wb,
        "10_CMS_Solutions",
        extract_object_loc_fields(solutions, "solutions-page-repository"),
        note="Solutions page CMS defaults (hero, crops, stage banners, CTA)",
    )

    # FAQs
    faqs = (ROOT / "src/lib/cms/repositories/faqs-repository.ts").read_text(
        encoding="utf-8"
    )
    write_sheet(
        wb,
        "11_CMS_FAQs",
        extract_object_loc_fields(faqs, "faqs-repository"),
        note="FAQ questions/answers CMS defaults",
    )

    # Case studies
    cases = (
        ROOT / "src/lib/cms/repositories/case-studies-repository.ts"
    ).read_text(encoding="utf-8")
    write_sheet(
        wb,
        "12_CMS_CaseStudies",
        extract_object_loc_fields(cases, "case-studies-repository"),
        note="Case studies CMS defaults",
    )

    # News page
    news = (ROOT / "src/lib/cms/repositories/news-page-repository.ts").read_text(
        encoding="utf-8"
    )
    write_sheet(
        wb,
        "13_CMS_NewsPage",
        extract_object_loc_fields(news, "news-page-repository"),
        note="News listing page CMS defaults",
    )

    # Blog i18n
    blog = (ROOT / "src/lib/cms/blog-i18n.ts").read_text(encoding="utf-8")
    write_sheet(
        wb,
        "14_CMS_Blog_i18n",
        extract_object_loc_fields(blog, "blog-i18n")
        + [
            {
                "source": "blog-i18n",
                "key": f"loc#{i}",
                **item,
            }
            for i, item in enumerate(extract_loc_calls(blog), start=1)
        ],
        note="Blog-related localized strings",
    )

    # Privacy
    privacy_en = extract_legal_sections(
        ROOT / "src/content/privacy-policy.ts", "en", ["PRIVACY_SECTIONS"]
    )
    privacy_en_consts = []
    for name, loc in [
        ("PRIVACY_UPDATED", "en"),
        ("PRIVACY_HERO_TITLE", "en"),
        ("PRIVACY_HERO_BODY", "en"),
    ]:
        pass
    # Consts from EN file
    en_text = (ROOT / "src/content/privacy-policy.ts").read_text(encoding="utf-8")
    for m in re.finditer(
        rf"export const (PRIVACY_[A-Z0-9_]+)\s*=\s*({STRING_LIT})\s*;", en_text
    ):
        privacy_en.insert(
            0,
            {
                "source": "privacy-policy.ts",
                "key": m.group(1),
                **{loc: "" for loc in LOCALES},
                "en": strip_ts_string(m.group(2)),
            },
        )
    # Contact block fields
    for m in re.finditer(
        rf"(company|headquarters|website|legalEntity|registeredAddress|privacyEmail)\s*:\s*({STRING_LIT})",
        en_text,
    ):
        privacy_en.insert(
            0,
            {
                "source": "privacy-policy.ts",
                "key": f"PRIVACY_CONTACT.{m.group(1)}",
                **{loc: "" for loc in LOCALES},
                "en": strip_ts_string(m.group(2)),
            },
        )

    privacy_pt = extract_legal_sections(
        ROOT / "src/content/privacy-policy.pt-BR.ts", "pt-BR", ["PRIVACY_SECTIONS_PT"]
    )
    pt_text = (ROOT / "src/content/privacy-policy.pt-BR.ts").read_text(encoding="utf-8")
    for m in re.finditer(
        rf"export const (PRIVACY_[A-Z0-9_]+)\s*=\s*({STRING_LIT})\s*;", pt_text
    ):
        privacy_pt.insert(
            0,
            {
                "source": "privacy-policy.pt-BR.ts",
                "key": m.group(1).replace("_PT", ""),
                **{loc: "" for loc in LOCALES},
                "pt-BR": strip_ts_string(m.group(2)),
            },
        )

    # Normalize PT keys: PRIVACY_HERO_TITLE_PT -> PRIVACY_HERO_TITLE
    for row in privacy_pt:
        row["key"] = (
            row["key"]
            .replace("_PT", "")
            .replace("PRIVACY_SECTIONS", "section")
        )

    write_sheet(
        wb,
        "15_Privacy_Policy",
        merge_legal_by_key(privacy_en, privacy_pt),
        note="Privacy Policy — EN + PT-BR in code. ES and ZH are blank if not authored (site may show EN).",
    )

    # Terms
    terms_en = extract_legal_sections(
        ROOT / "src/content/terms-of-use.ts", "en", ["TERMS_SECTIONS"]
    )
    terms_text = (ROOT / "src/content/terms-of-use.ts").read_text(encoding="utf-8")
    for m in re.finditer(
        rf"export const (TERMS_[A-Z0-9_]+)\s*=\s*({STRING_LIT})\s*;", terms_text
    ):
        terms_en.insert(
            0,
            {
                "source": "terms-of-use.ts",
                "key": m.group(1),
                **{loc: "" for loc in LOCALES},
                "en": strip_ts_string(m.group(2)),
            },
        )
    # TERMS_INTRO array
    intro_m = re.search(r"export const TERMS_INTRO\s*=\s*\[(.*?)\];", terms_text, re.DOTALL)
    if intro_m:
        for i, sm in enumerate(re.finditer(STRING_LIT, intro_m.group(1)), start=1):
            terms_en.insert(
                0,
                {
                    "source": "terms-of-use.ts",
                    "key": f"TERMS_INTRO[{i}]",
                    **{loc: "" for loc in LOCALES},
                    "en": strip_ts_string(sm.group(0)),
                },
            )
    # TERMS_CONTACT
    for m in re.finditer(
        rf"(company|headquarters|website|legalEntity|registeredAddress|privacyEmail|privacyNote)\s*:\s*({STRING_LIT})",
        terms_text,
    ):
        terms_en.insert(
            0,
            {
                "source": "terms-of-use.ts",
                "key": f"TERMS_CONTACT.{m.group(1)}",
                **{loc: "" for loc in LOCALES},
                "en": strip_ts_string(m.group(2)),
            },
        )

    write_sheet(
        wb,
        "16_Terms_of_Use",
        terms_en,
        note="Terms of Use — English primary in code. PT-BR / ES / ZH columns blank = need translation.",
    )

    # Catch-all: any remaining message top-level keys not mapped
    mapped = {s for secs in MESSAGE_SHEETS.values() for s in secs}
    leftover = [k for k in by_locale["en"].keys() if k not in mapped]
    if leftover:
        rows = []
        for section in leftover:
            rows.extend(merge_message_section(by_locale, section))
        write_sheet(
            wb,
            "17_UI_Other",
            rows,
            note=f"Other UI namespaces: {', '.join(leftover)}",
        )

    OUT.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT)

    # Summary counts
    total_rows = 0
    for name in wb.sheetnames:
        if name == "00_README":
            continue
        total_rows += max(wb[name].max_row - 2, 0)
    print(f"Wrote {OUT}")
    print(f"Sheets: {len(wb.sheetnames)}")
    print(f"Approx data rows: {total_rows}")


if __name__ == "__main__":
    main()
