#!/usr/bin/env python3
"""Generate the FAQPage JSON-LD in FAQ.html from the questions already on the page.

The markup is the single source of truth — this script only mirrors it, so the schema
can never drift from the visible copy. Run it after editing any FAQ answer.

    python3 scripts/build-faq-schema.py           # rewrite the block in place
    python3 scripts/build-faq-schema.py --check    # exit 1 if the block is stale

Note on rich results: since 2023 Google shows FAQ rich results only for government and
recognised health-authority sites, so this will almost certainly not draw an accordion in
the SERP. It is here because it is what answer engines and LLM crawlers read to lift a
clean question-answer pair, which is the part that still pays.
"""
import json, re, sys, pathlib
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent
FAQ = ROOT / "FAQ.html"
START, END = "<!-- FAQ-SCHEMA:START -->", "<!-- FAQ-SCHEMA:END -->"


class FaqParser(HTMLParser):
    """Pull (question, answer) pairs out of the .faq-q / .faq-a markup."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pairs, self._q, self._buf = [], None, []
        self._mode, self._depth = None, 0

    def handle_starttag(self, tag, attrs):
        cls = dict(attrs).get("class", "")
        if self._mode:
            self._depth += 1
            return
        if tag == "button" and "faq-q" in cls:
            self._mode, self._depth, self._buf = "q", 0, []
        elif tag == "div" and "faq-a" in cls:
            self._mode, self._depth, self._buf = "a", 0, []

    def handle_endtag(self, tag):
        if not self._mode:
            return
        if self._depth:
            self._depth -= 1
            return
        text = re.sub(r"\s+", " ", "".join(self._buf)).strip().rstrip("+").strip()
        if self._mode == "q":
            self._q = text
        elif self._q:
            self.pairs.append((self._q, text))
            self._q = None
        self._mode, self._buf = None, []

    def handle_data(self, data):
        if self._mode:
            self._buf.append(data)


def build(html):
    p = FaqParser()
    p.feed(html)
    if not p.pairs:
        sys.exit("no FAQ items found — did the markup change?")
    schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": "https://www.mendmedicalwear.com/FAQ",
        "mainEntity": [
            {
                "@type": "Question",
                "name": q,
                "acceptedAnswer": {"@type": "Answer", "text": a},
            }
            for q, a in p.pairs
        ],
    }
    body = json.dumps(schema, indent=2, ensure_ascii=False)
    return len(p.pairs), f'{START}\n<script type="application/ld+json">\n{body}\n</script>\n{END}'


def main():
    html = FAQ.read_text()
    count, block = build(html)

    if START in html and END in html:
        new = re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _: block, html, flags=re.S)
    else:  # first run — drop it in just after the canonical link
        anchor = '<link rel="canonical" href="https://www.mendmedicalwear.com/FAQ">'
        assert anchor in html, "canonical link not found; nowhere obvious to anchor the block"
        new = html.replace(anchor, anchor + "\n" + block, 1)

    if "--check" in sys.argv:
        print(f"{'stale' if new != html else 'current'}: {count} questions")
        sys.exit(1 if new != html else 0)

    FAQ.write_text(new)
    print(f"wrote FAQPage schema — {count} questions")


if __name__ == "__main__":
    main()
