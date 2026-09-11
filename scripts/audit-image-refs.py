#!/usr/bin/env python3
"""Find root images no page references — resolving JavaScript-built filenames too.

    python3 scripts/audit-image-refs.py            # report
    python3 scripts/audit-image-refs.py --check    # exit 1 if a referenced file is missing

Why this exists. A markup-only sweep is WRONG on this site and has already caused a
gallery 404 regression. Two traps:

1. ~41 live images appear in no HTML at all. The product pages assemble their filenames
   at runtime — see GOWN/SCRUBS below. On the scrubs page a non-empty colour suffix also
   flips the date in the filename.
2. Several filenames contain spaces and are written unencoded (src="MEND - Hero
   Banner - 2026-06-15.jpg"). A scanner that splits on whitespace misses them and
   reports live images as unused. That is not hypothetical: it happened while writing
   this script, and nearly retired the homepage hero.

Anything this reports as unreferenced goes to assets/retired-web/ (git- and
Vercel-ignored), never straight to rm.
"""
import glob, itertools, json, os, re, sys, urllib.parse

EXT = ('.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif')
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')

# Filenames the product-page JS builds. Keep in sync with those pages.
GOWN_COLORS = ['', 'Blue', 'Blush', 'Charcoal', 'Navy', 'Oatmeal', 'Print', 'Sage', 'Stripe']
SCRUB_SUFFIXES = ['', ' - Ceil Blue', ' - Charcoal', ' - Navy']


def constructed():
    for g, v, c in itertools.product(['Female', 'Male'], ['Front', 'Back'], GOWN_COLORS):
        yield f"Concept - Hospital Gown - {g} {v}{f' - {c}' if c else ''} - 2026-06-15-web.jpg"
    for g, v, s in itertools.product(['Female', 'Male'], ['Front', 'Back'], SCRUB_SUFFIXES):
        yield f"Concept - Nurse Scrubs - {g} {v}{s} - {'2026-06-17' if s else '2026-06-15'}-web.jpg"


def names_in(value):
    """(basename, was_a_path) for every image reference inside one string.

    was_a_path distinguishes a real URL from things like download="mend-brand-preview.png",
    which names a file the browser will create, not one that has to exist.
    """
    found = []
    for part in re.split(r'[,\s]+', value.strip()):
        if part.lower().endswith(EXT):
            found.append(part)
    if value.strip().lower().endswith(EXT):       # the whole value may BE a spaced filename
        found.append(value.strip())
    return [(urllib.parse.unquote(p.split('/')[-1].split('?')[0]), '/' in p) for p in found]


def main():
    os.chdir(ROOT)
    on_disk = {f for f in os.listdir('.') if f.lower().endswith(EXT) and os.path.isfile(f)}
    sources = [f for f in sorted(
        glob.glob('*.html') + glob.glob('products/*.html') + glob.glob('*.js') +
        glob.glob('*.css') + glob.glob('components/*.js') + glob.glob('components/*.jsx') +
        glob.glob('api/*.js') + ['sitemap.xml', 'robots.txt', 'llms.txt']) if os.path.exists(f)]

    literal, as_path = set(), set()
    scanners = [re.compile(r'"([^"]*)"'), re.compile(r"'([^']*)'"), re.compile(r'url\(([^)]*)\)')]
    raw = re.compile(r'[^\s"\'()<>,]+?(?:' + '|'.join(map(re.escape, EXT)) + r')', re.I)
    for f in sources:
        txt = open(f, encoding='utf-8', errors='replace').read()
        for sc in scanners:
            for val in sc.findall(txt):
                for name, is_path in names_in(val.strip('\'" ')):
                    literal.add(name)
                    if is_path:
                        as_path.add(name)
        for m in raw.findall(txt):          # catches %20-encoded tokens; fragments included
            literal.add(urllib.parse.unquote(m.split('/')[-1].split('?')[0]))

    built = set(constructed())
    referenced = (literal | built) & on_disk
    unreferenced = sorted(on_disk - referenced)
    # Only a real path can be "missing". Bare tokens from the raw pass are fragments of
    # spaced filenames, and a download="..." attribute names a file the browser creates.
    missing = sorted(n for n in ((as_path | built) - on_disk) if n.lower().endswith(EXT))

    print(f"on disk {len(on_disk)} · referenced {len(referenced)} "
          f"(JS-only {len(built & on_disk - literal)}) · unreferenced {len(unreferenced)}")
    for n in unreferenced:
        print(f"  unreferenced  {os.path.getsize(n)/1024:6.0f} KB  {n}")
    for n in missing:
        print(f"  MISSING (referenced but not on disk)  {n}")

    if '--check' in sys.argv and missing:
        sys.exit(f"\n{len(missing)} referenced image(s) missing from disk")


if __name__ == '__main__':
    main()
