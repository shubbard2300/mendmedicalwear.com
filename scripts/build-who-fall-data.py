#!/usr/bin/env python3
"""Regenerate data/who-fall-mortality.json from the WHO Global Health Observatory.

The GHO OData API (ghoapi.azureedge.net) is public and unauthenticated. Indicator
SA_0000001442 is the only country-level fall-mortality series it exposes: WHO Global
Health Estimates age-standardised fall death rates per 100,000, 189 member states,
both sexes plus male/female breakdowns.

The serverless endpoint (api/fall-risk-regions.js) queries that API live; this
snapshot is the fallback it serves when WHO is unreachable, so the page never
renders an empty panel. It is written straight into that file between the
SNAPSHOT-START/SNAPSHOT-END markers rather than kept as a separate JSON file,
because Vercel transpiles the handler to CommonJS and `import.meta.url` does not
survive that rewrite. Rerun after any WHO data revision:

    python3 scripts/build-who-fall-data.py
"""
import json, os, shutil, subprocess, sys
from datetime import date

GHO = "https://ghoapi.azureedge.net/api"
INDICATOR = "SA_0000001442"
SEXES = {"SEX_BTSX": "all", "SEX_MLE": "male", "SEX_FMLE": "female"}
OUT = os.path.join(os.path.dirname(__file__), "..", "api", "fall-risk-regions.js")
START = "// SNAPSHOT-START — generated, do not edit by hand"
END = "// SNAPSHOT-END"


def get(url):
    # curl rather than urllib: on machines behind a TLS-inspecting proxy, the
    # python.org build trusts its own bundled roots and not the system keychain,
    # so urllib fails the handshake where curl succeeds.
    if not shutil.which("curl"):
        sys.exit("curl is required")
    out = subprocess.run(
        ["curl", "-sSf", "--max-time", "90", url],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit(f"Fetch failed for {url}: {out.stderr.strip()}")
    return json.loads(out.stdout)["value"]


def main():
    rows = get(f"{GHO}/{INDICATOR}")
    names = {c["Code"]: c["Title"] for c in get(f"{GHO}/DIMENSION/COUNTRY/DimensionValues")}

    # Keep the most recent year present, so a WHO revision is picked up automatically.
    year = max(r["TimeDim"] for r in rows if r["Dim1"] in SEXES)

    out = {}
    for r in rows:
        sex = SEXES.get(r["Dim1"])
        if not sex or r["TimeDim"] != year or r["NumericValue"] is None:
            continue
        if r["SpatialDimType"] != "COUNTRY":
            continue
        iso3 = r["SpatialDim"]
        out.setdefault(iso3, {
            "iso3": iso3,
            "name": names.get(iso3, iso3),
            "region": r["ParentLocation"],
            "rates": {},
        })["rates"][sex] = round(r["NumericValue"], 1)

    countries = sorted(out.values(), key=lambda c: -c["rates"].get("all", 0))
    if len(countries) < 100:
        sys.exit(f"Refusing to write a thin snapshot: only {len(countries)} countries")

    payload = {
        "source": "WHO Global Health Observatory",
        "sourceUrl": f"{GHO}/{INDICATOR}",
        "indicator": INDICATOR,
        "indicatorName": "Age-standardised death rates, falls, per 100 000 population",
        "dataYear": year,
        "retrieved": date.today().isoformat(),
        "countries": countries,
    }
    with open(OUT) as f:
        source = f.read()
    if START not in source or END not in source:
        sys.exit(f"Marker block missing from {OUT}")

    head, rest = source.split(START, 1)
    _, tail = rest.split(END, 1)
    block = "var snapshot = " + json.dumps(payload, separators=(",", ":")) + ";"
    with open(OUT, "w") as f:
        f.write(head + START + "\n" + block + "\n" + END + tail)
    print(f"Inlined {len(countries)} countries (WHO {year}) -> {os.path.normpath(OUT)}")


if __name__ == "__main__":
    main()
