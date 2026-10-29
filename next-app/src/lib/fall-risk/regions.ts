import {snapshot, type Country, type Dataset} from './snapshot'

// Ported from the live api/fall-risk-regions.js: age-standardised fall mortality by country, ranked, with WHO-region rollups, for the Fall Risk
// Check's global panel. Source is the WHO Global Health Observatory OData API (public, unauthenticated, indicator SA_0000001442). No questionnaire
// answer ever reaches this endpoint: it takes a sex, an optional region and a limit, and nothing else.
//
// GET /api/fall-risk-regions?sex=all|male|female&region=Europe&limit=5

const GHO_INDICATOR = 'SA_0000001442'
const GHO_URL = 'https://ghoapi.azureedge.net/api/' + GHO_INDICATOR
const SEX_CODES: Record<string, string> = {all: 'SEX_BTSX', male: 'SEX_MLE', female: 'SEX_FMLE'}

// UN population under roughly 300,000. An age-standardised rate over a population that small turns on a handful of deaths in a single year (Nauru
// lands at the top of the raw 2004 table on a female rate of 29.8 against a male rate of 0.0), which is noise, not epidemiology. Excluded from
// ranking rather than from the dataset.
const MICROSTATES = [
  'AND', 'ATG', 'BRB', 'COK', 'DMA', 'FSM', 'GRD', 'KIR', 'KNA', 'LCA', 'LIE',
  'MCO', 'MHL', 'NIU', 'NRU', 'PLW', 'SMR', 'STP', 'SYC', 'TON', 'TUV', 'VCT', 'WSM',
]

const CACHE_MS = 6 * 60 * 60 * 1000
let cache: {at: number; payload: Dataset | null} = {at: 0, payload: null}

interface GhoRow {
  Dim1: string
  TimeDim: number
  SpatialDimType: string
  SpatialDim: string
  ParentLocation: string
  NumericValue: number | null | undefined
}

// WHO's data. Fetched with Next's own data cache off: the six-hour memory cache above is the only cache, as on the live endpoint.
async function fetchFromWho(): Promise<Dataset> {
  const res = await fetch(GHO_URL, {headers: {Accept: 'application/json'}, cache: 'no-store'})
  if (!res.ok) throw new Error('WHO GHO responded ' + res.status)
  const rows: GhoRow[] = (await res.json()).value || []

  const sexByCode: Record<string, 'all' | 'male' | 'female'> = {SEX_BTSX: 'all', SEX_MLE: 'male', SEX_FMLE: 'female'}
  const years = rows.filter((r) => sexByCode[r.Dim1]).map((r) => r.TimeDim)
  if (!years.length) throw new Error('WHO GHO returned no usable rows')
  const year = Math.max.apply(null, years)

  const byIso: Record<string, Country> = Object.create(null)
  rows.forEach((r) => {
    const sex = sexByCode[r.Dim1]
    if (!sex || r.TimeDim !== year || r.SpatialDimType !== 'COUNTRY') return
    if (r.NumericValue === null || r.NumericValue === undefined) return
    const c = byIso[r.SpatialDim] || (byIso[r.SpatialDim] = {iso3: r.SpatialDim, name: r.SpatialDim, region: r.ParentLocation, rates: {}})
    c.rates[sex] = Math.round(r.NumericValue * 10) / 10
  })

  const countries = Object.keys(byIso).map((k) => byIso[k])
  if (countries.length < 100) throw new Error('WHO GHO returned a thin dataset')

  // The indicator carries ISO3 codes only; names come from the country dimension. A failure here is cosmetic, so fall back to the snapshot's names
  // rather than discarding an otherwise good live fetch.
  try {
    const dimRes = await fetch('https://ghoapi.azureedge.net/api/DIMENSION/COUNTRY/DimensionValues', {cache: 'no-store'})
    if (dimRes.ok) {
      const names: Record<string, string> = Object.create(null)
      ;((await dimRes.json()).value || []).forEach((d: {Code: string; Title: string}) => {
        names[d.Code] = d.Title
      })
      countries.forEach((c) => {
        if (names[c.iso3]) c.name = names[c.iso3]
      })
    }
  } catch {
    countries.forEach((c) => {
      const known = snapshot.countries.find((s) => s.iso3 === c.iso3)
      if (known) c.name = known.name
    })
  }

  return {
    source: 'WHO Global Health Observatory',
    sourceUrl: GHO_URL,
    indicator: GHO_INDICATOR,
    indicatorName: 'Age-standardised death rates, falls, per 100 000 population',
    dataYear: year,
    countries,
  }
}

function median(values: number[]) {
  if (!values.length) return null
  const s = values.slice().sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  const m = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
  return Math.round(m * 10) / 10
}

interface Ranked {
  iso3: string
  name: string
  region: string
  rate: number
}

export interface RegionsPayload {
  source: string
  sourceUrl: string
  indicator: string
  indicatorName: string
  dataYear: number
  unit: string
  sex: string
  region: string | null
  countriesRanked: number
  globalMedian: number | null
  topCountries: Ranked[]
  topRegions: RegionRow[]
  allRegions: RegionRow[]
  live: boolean
  snapshotRetrieved?: string
}

interface RegionRow {
  region: string
  medianRate: number | null
  highest: {name: string; iso3: string; rate: number}
  countries: number
}

function build(dataset: Dataset, sex: string, region: string | null, limit: number) {
  const ranked = dataset.countries
    .filter((c) => MICROSTATES.indexOf(c.iso3) === -1)
    .map((c) => {
      // `sex` is whatever passed the SEX_CODES check, so it can be a name an object inherits (`constructor`); the live handler read it the same way.
      let rate = (c.rates as Record<string, unknown>)[sex]
      if (rate === undefined || rate === null) rate = c.rates.all
      return {iso3: c.iso3, name: c.name, region: c.region, rate: rate as number}
    })
    .filter((c) => typeof c.rate === 'number' && c.rate > 0)
    .sort((a, b) => b.rate - a.rate)

  const regions: Record<string, Ranked[]> = {}
  ranked.forEach((c) => {
    ;(regions[c.region] || (regions[c.region] = [])).push(c)
  })

  const regionRows: RegionRow[] = Object.keys(regions)
    .map((name) => {
      const members = regions[name]
      return {
        region: name,
        medianRate: median(members.map((c) => c.rate)),
        highest: {name: members[0].name, iso3: members[0].iso3, rate: members[0].rate},
        countries: members.length,
      }
    })
    .sort((a, b) => (b.medianRate as number) - (a.medianRate as number))

  const scoped = region ? ranked.filter((c) => c.region === region) : ranked

  return {
    source: dataset.source,
    sourceUrl: dataset.sourceUrl,
    indicator: dataset.indicator,
    indicatorName: dataset.indicatorName,
    dataYear: dataset.dataYear,
    unit: 'deaths per 100,000 population, age-standardised',
    sex,
    region: region || null,
    countriesRanked: ranked.length,
    globalMedian: median(ranked.map((c) => c.rate)),
    topCountries: scoped.slice(0, limit),
    topRegions: regionRows.slice(0, limit),
    allRegions: regionRows,
  }
}

// What Node's `req.query` holds on the live function: a repeated parameter is a list, anything else a string.
export type Query = Record<string, string | string[] | undefined>

export async function regions(method: string, query: Query) {
  if (method !== 'GET') return {status: 405, json: {error: 'Method not allowed'}, allow: 'GET'}

  // Each read below is the live handler's, quirks included: a list or a missing value falls back to the default, and `limit` goes through parseInt.
  const sex = SEX_CODES[query.sex as string] ? (query.sex as string) : 'all'
  const region = typeof query.region === 'string' && query.region.trim() ? query.region.trim() : null
  const limit = Math.min(Math.max(parseInt(query.limit as string, 10) || 5, 1), 25)

  let dataset: Dataset
  let live = false

  if (cache.payload && Date.now() - cache.at < CACHE_MS) {
    dataset = cache.payload
    live = true
  } else {
    try {
      dataset = await fetchFromWho()
      cache = {at: Date.now(), payload: dataset}
      live = true
    } catch (err) {
      console.error('WHO GHO fetch failed, serving snapshot:', (err as Error).message)
      dataset = snapshot
    }
  }

  const payload: RegionsPayload = {...build(dataset, sex, region, limit), live}
  if (!live) payload.snapshotRetrieved = snapshot.retrieved
  return {status: 200, json: payload, cacheControl: 's-maxage=21600, stale-while-revalidate=86400'}
}
