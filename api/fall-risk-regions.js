// Serves the global panel behind the Fall Risk Check: age-standardised fall
// mortality by country, ranked, with WHO-region rollups.
//
// Source is the WHO Global Health Observatory OData API — public, unauthenticated,
// indicator SA_0000001442 (WHO Global Health Estimates, age-standardised fall death
// rates per 100,000, 189 member states, male/female/both). It is the only
// country-level fall-mortality series the GHO exposes; the newer GHE cause series
// (GHECAUSES_GHE155) is published at region level only, with no country breakdown.
//
// No questionnaire answers ever reach this endpoint. It takes a sex and an optional
// region and nothing else — the score is computed and kept in the browser.
//
// GET /api/fall-risk-regions?sex=all|male|female&region=Europe&limit=5

import { readFileSync } from 'node:fs';

var GHO_INDICATOR = 'SA_0000001442';
var GHO_URL = 'https://ghoapi.azureedge.net/api/' + GHO_INDICATOR;
var SEX_CODES = { all: 'SEX_BTSX', male: 'SEX_MLE', female: 'SEX_FMLE' };

// UN population under roughly 300,000. An age-standardised rate over a population
// that small turns on a handful of deaths in a single year — Nauru lands at the top
// of the raw 2004 table on a female rate of 29.8 against a male rate of 0.0, which is
// noise, not epidemiology. Excluded from ranking rather than from the dataset.
var MICROSTATES = [
  'AND', 'ATG', 'BRB', 'COK', 'DMA', 'FSM', 'GRD', 'KIR', 'KNA', 'LCA', 'LIE',
  'MCO', 'MHL', 'NIU', 'NRU', 'PLW', 'SMR', 'STP', 'SYC', 'TON', 'TUV', 'VCT', 'WSM'
];

// Committed fallback so the panel still renders if WHO is unreachable.
// Regenerate with: python3 scripts/build-who-fall-data.py
var snapshot = JSON.parse(
  readFileSync(new URL('../data/who-fall-mortality.json', import.meta.url), 'utf8')
);

var CACHE_MS = 6 * 60 * 60 * 1000;
var cache = { at: 0, payload: null };

async function fetchFromWho() {
  var res = await fetch(GHO_URL, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('WHO GHO responded ' + res.status);
  var rows = (await res.json()).value || [];

  var sexByCode = { SEX_BTSX: 'all', SEX_MLE: 'male', SEX_FMLE: 'female' };
  var years = rows.filter(function (r) { return sexByCode[r.Dim1]; }).map(function (r) { return r.TimeDim; });
  if (!years.length) throw new Error('WHO GHO returned no usable rows');
  var year = Math.max.apply(null, years);

  var byIso = Object.create(null);
  rows.forEach(function (r) {
    var sex = sexByCode[r.Dim1];
    if (!sex || r.TimeDim !== year || r.SpatialDimType !== 'COUNTRY') return;
    if (r.NumericValue === null || r.NumericValue === undefined) return;
    var c = byIso[r.SpatialDim] || (byIso[r.SpatialDim] = {
      iso3: r.SpatialDim, name: r.SpatialDim, region: r.ParentLocation, rates: {}
    });
    c.rates[sex] = Math.round(r.NumericValue * 10) / 10;
  });

  var countries = Object.keys(byIso).map(function (k) { return byIso[k]; });
  if (countries.length < 100) throw new Error('WHO GHO returned a thin dataset');

  // The indicator carries ISO3 codes only; names come from the country dimension.
  // A failure here is cosmetic, so fall back to the snapshot's names rather than
  // discarding an otherwise good live fetch.
  try {
    var dimRes = await fetch('https://ghoapi.azureedge.net/api/DIMENSION/COUNTRY/DimensionValues');
    if (dimRes.ok) {
      var names = Object.create(null);
      ((await dimRes.json()).value || []).forEach(function (d) { names[d.Code] = d.Title; });
      countries.forEach(function (c) { if (names[c.iso3]) c.name = names[c.iso3]; });
    }
  } catch (err) {
    countries.forEach(function (c) {
      var known = snapshot.countries.find(function (s) { return s.iso3 === c.iso3; });
      if (known) c.name = known.name;
    });
  }

  return {
    source: 'WHO Global Health Observatory',
    sourceUrl: GHO_URL,
    indicator: GHO_INDICATOR,
    indicatorName: 'Age-standardised death rates, falls, per 100 000 population',
    dataYear: year,
    countries: countries
  };
}

function median(values) {
  if (!values.length) return null;
  var s = values.slice().sort(function (a, b) { return a - b; });
  var mid = Math.floor(s.length / 2);
  var m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  return Math.round(m * 10) / 10;
}

function build(dataset, sex, region, limit) {
  var ranked = dataset.countries
    .filter(function (c) { return MICROSTATES.indexOf(c.iso3) === -1; })
    .map(function (c) {
      var rate = c.rates[sex];
      if (rate === undefined || rate === null) rate = c.rates.all;
      return { iso3: c.iso3, name: c.name, region: c.region, rate: rate };
    })
    .filter(function (c) { return typeof c.rate === 'number' && c.rate > 0; })
    .sort(function (a, b) { return b.rate - a.rate; });

  var regions = {};
  ranked.forEach(function (c) {
    (regions[c.region] || (regions[c.region] = [])).push(c);
  });

  var regionRows = Object.keys(regions).map(function (name) {
    var members = regions[name];
    return {
      region: name,
      medianRate: median(members.map(function (c) { return c.rate; })),
      highest: { name: members[0].name, iso3: members[0].iso3, rate: members[0].rate },
      countries: members.length
    };
  }).sort(function (a, b) { return b.medianRate - a.medianRate; });

  var scoped = region ? ranked.filter(function (c) { return c.region === region; }) : ranked;

  return {
    source: dataset.source,
    sourceUrl: dataset.sourceUrl,
    indicator: dataset.indicator,
    indicatorName: dataset.indicatorName,
    dataYear: dataset.dataYear,
    unit: 'deaths per 100,000 population, age-standardised',
    sex: sex,
    region: region || null,
    countriesRanked: ranked.length,
    globalMedian: median(ranked.map(function (c) { return c.rate; })),
    topCountries: scoped.slice(0, limit),
    topRegions: regionRows.slice(0, limit),
    allRegions: regionRows
  };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var q = req.query || {};
  var sex = SEX_CODES[q.sex] ? q.sex : 'all';
  var region = typeof q.region === 'string' && q.region.trim() ? q.region.trim() : null;
  var limit = Math.min(Math.max(parseInt(q.limit, 10) || 5, 1), 25);

  var dataset = null;
  var live = false;

  if (cache.payload && Date.now() - cache.at < CACHE_MS) {
    dataset = cache.payload;
    live = true;
  } else {
    try {
      dataset = await fetchFromWho();
      cache = { at: Date.now(), payload: dataset };
      live = true;
    } catch (err) {
      console.error('WHO GHO fetch failed, serving snapshot:', err.message);
      dataset = snapshot;
    }
  }

  var payload = build(dataset, sex, region, limit);
  payload.live = live;
  if (!live) payload.snapshotRetrieved = snapshot.retrieved;

  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=86400');
  return res.status(200).json(payload);
}
