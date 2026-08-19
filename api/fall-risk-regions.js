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
//
// Inlined rather than read from disk on purpose. This project has no package.json,
// so Vercel transpiles these ESM handlers to CommonJS — and that rewrite leaves
// `import.meta.url` untouched, which is a syntax error in CJS and kills the whole
// function on load. No fs, no path resolution, nothing for the bundler to miss.
//
// Regenerate with: python3 scripts/build-who-fall-data.py
// SNAPSHOT-START — generated, do not edit by hand
var snapshot = {"source":"WHO Global Health Observatory","sourceUrl":"https://ghoapi.azureedge.net/api/SA_0000001442","indicator":"SA_0000001442","indicatorName":"Age-standardised death rates, falls, per 100 000 population","dataYear":2004,"retrieved":"2026-08-18","countries":[{"iso3":"NRU","name":"Naoero","region":"Western Pacific","rates":{"male":0.0,"female":29.8,"all":17.8}},{"iso3":"HUN","name":"Hungary","region":"Europe","rates":{"female":12.6,"all":16.6,"male":21.4}},{"iso3":"LAO","name":"Lao People's Democratic Republic","region":"Western Pacific","rates":{"male":17.2,"female":10.6,"all":13.7}},{"iso3":"IND","name":"India","region":"South-East Asia","rates":{"female":9.3,"male":15.1,"all":12.2}},{"iso3":"BTN","name":"Bhutan","region":"South-East Asia","rates":{"male":15.0,"all":12.2,"female":9.5}},{"iso3":"CZE","name":"Czechia","region":"Europe","rates":{"female":10.2,"all":12.1,"male":13.8}},{"iso3":"PAK","name":"Pakistan","region":"Eastern Mediterranean","rates":{"all":12.0,"female":10.0,"male":14.0}},{"iso3":"IRQ","name":"Iraq","region":"Eastern Mediterranean","rates":{"female":5.1,"male":18.7,"all":11.9}},{"iso3":"FIN","name":"Finland","region":"Europe","rates":{"female":7.4,"all":11.5,"male":16.5}},{"iso3":"BGD","name":"Bangladesh","region":"South-East Asia","rates":{"male":13.0,"all":11.1,"female":9.4}},{"iso3":"MDV","name":"Maldives","region":"South-East Asia","rates":{"all":10.7,"female":9.4,"male":11.9}},{"iso3":"SVN","name":"Slovenia","region":"Europe","rates":{"male":14.4,"female":7.1,"all":10.6}},{"iso3":"LTU","name":"Lithuania","region":"Europe","rates":{"male":19.1,"female":3.5,"all":10.4}},{"iso3":"CUB","name":"Cuba","region":"Americas","rates":{"male":10.8,"all":10.4,"female":9.8}},{"iso3":"BLR","name":"Belarus","region":"Europe","rates":{"all":10.3,"female":4.0,"male":17.9}},{"iso3":"HRV","name":"Croatia","region":"Europe","rates":{"female":8.2,"male":11.2,"all":9.8}},{"iso3":"LVA","name":"Latvia","region":"Europe","rates":{"female":5.0,"all":9.5,"male":14.9}},{"iso3":"PNG","name":"Papua New Guinea","region":"Western Pacific","rates":{"male":11.7,"female":7.3,"all":9.5}},{"iso3":"SOM","name":"Somalia","region":"Eastern Mediterranean","rates":{"all":9.5,"female":9.8,"male":9.3}},{"iso3":"MLT","name":"Malta","region":"Europe","rates":{"all":9.2,"female":8.7,"male":8.9}},{"iso3":"CHN","name":"China","region":"Western Pacific","rates":{"all":9.0,"male":11.6,"female":6.3}},{"iso3":"NPL","name":"Nepal","region":"South-East Asia","rates":{"all":8.9,"male":10.6,"female":7.5}},{"iso3":"MMR","name":"Myanmar","region":"South-East Asia","rates":{"male":11.0,"all":8.9,"female":7.0}},{"iso3":"TLS","name":"Timor-Leste","region":"South-East Asia","rates":{"male":10.6,"all":8.5,"female":6.4}},{"iso3":"KOR","name":"Republic of Korea","region":"Western Pacific","rates":{"female":5.3,"male":11.3,"all":8.3}},{"iso3":"RUS","name":"Russian Federation","region":"Europe","rates":{"male":13.9,"female":3.2,"all":8.2}},{"iso3":"TUR","name":"T\u00fcrkiye","region":"Europe","rates":{"all":8.0,"male":9.4,"female":6.7}},{"iso3":"IDN","name":"Indonesia","region":"Western Pacific","rates":{"male":9.6,"all":8.0,"female":6.6}},{"iso3":"VNM","name":"Viet Nam","region":"Western Pacific","rates":{"female":6.1,"male":9.9,"all":7.9}},{"iso3":"CHE","name":"Switzerland","region":"Europe","rates":{"male":9.5,"female":5.5,"all":7.4}},{"iso3":"POL","name":"Poland","region":"Europe","rates":{"male":9.7,"female":5.1,"all":7.3}},{"iso3":"AGO","name":"Angola","region":"Africa","rates":{"all":7.2,"male":10.3,"female":4.3}},{"iso3":"NOR","name":"Norway","region":"Europe","rates":{"all":7.2,"male":9.0,"female":5.8}},{"iso3":"SAU","name":"Saudi Arabia","region":"Eastern Mediterranean","rates":{"female":1.3,"male":11.4,"all":7.0}},{"iso3":"MNG","name":"Mongolia","region":"Western Pacific","rates":{"female":2.2,"all":6.9,"male":11.7}},{"iso3":"SVK","name":"Slovakia","region":"Europe","rates":{"female":2.8,"male":11.9,"all":6.9}},{"iso3":"EST","name":"Estonia","region":"Europe","rates":{"female":3.9,"all":6.9,"male":10.5}},{"iso3":"CIV","name":"Cote d'Ivoire","region":"Africa","rates":{"female":4.2,"male":9.3,"all":6.9}},{"iso3":"ITA","name":"Italy","region":"Europe","rates":{"female":5.9,"all":6.8,"male":7.7}},{"iso3":"UKR","name":"Ukraine","region":"Europe","rates":{"female":2.4,"all":6.7,"male":11.9}},{"iso3":"BLZ","name":"Belize","region":"Americas","rates":{"all":6.7,"male":8.9,"female":4.2}},{"iso3":"YEM","name":"Yemen","region":"Eastern Mediterranean","rates":{"all":6.7,"female":3.5,"male":10.1}},{"iso3":"AUT","name":"Austria","region":"Europe","rates":{"male":9.2,"female":4.2,"all":6.5}},{"iso3":"MCO","name":"Monaco","region":"Europe","rates":{"female":5.7,"male":6.7,"all":6.3}},{"iso3":"BEL","name":"Belgium","region":"Europe","rates":{"female":5.1,"male":7.4,"all":6.3}},{"iso3":"SLE","name":"Sierra Leone","region":"Africa","rates":{"male":9.2,"all":6.2,"female":3.5}},{"iso3":"LUX","name":"Luxembourg","region":"Europe","rates":{"all":6.2,"female":4.1,"male":8.3}},{"iso3":"BRA","name":"Brazil","region":"Americas","rates":{"female":4.0,"all":6.1,"male":8.3}},{"iso3":"VCT","name":"Saint Vincent and the Grenadines","region":"Americas","rates":{"male":10.7,"all":6.1,"female":1.4}},{"iso3":"MDA","name":"Republic of Moldova","region":"Europe","rates":{"all":5.9,"female":2.4,"male":10.4}},{"iso3":"SWZ","name":"Eswatini","region":"Africa","rates":{"female":5.2,"all":5.8,"male":6.4}},{"iso3":"ROU","name":"Romania","region":"Europe","rates":{"female":2.1,"male":9.5,"all":5.6}},{"iso3":"PRK","name":"Democratic People's Republic of Korea","region":"South-East Asia","rates":{"female":4.4,"male":6.8,"all":5.5}},{"iso3":"LBN","name":"Lebanon","region":"Eastern Mediterranean","rates":{"all":5.5,"male":7.8,"female":3.3}},{"iso3":"KHM","name":"Cambodia","region":"Western Pacific","rates":{"all":5.4,"male":6.5,"female":4.4}},{"iso3":"CAF","name":"Central African Republic","region":"Africa","rates":{"female":3.7,"male":7.2,"all":5.4}},{"iso3":"IRL","name":"Ireland","region":"Europe","rates":{"all":5.4,"female":4.2,"male":6.5}},{"iso3":"SLV","name":"El Salvador","region":"Americas","rates":{"all":5.3,"male":7.7,"female":3.2}},{"iso3":"AFG","name":"Afghanistan","region":"Eastern Mediterranean","rates":{"female":3.2,"male":7.3,"all":5.3}},{"iso3":"ZWE","name":"Zimbabwe","region":"Africa","rates":{"male":7.0,"female":3.7,"all":5.3}},{"iso3":"DJI","name":"Djibouti","region":"Eastern Mediterranean","rates":{"all":5.3,"male":8.6,"female":2.2}},{"iso3":"BWA","name":"Botswana","region":"Africa","rates":{"male":5.3,"female":4.6,"all":5.1}},{"iso3":"GAB","name":"Gabon","region":"Africa","rates":{"all":5.1,"male":5.5,"female":4.6}},{"iso3":"BDI","name":"Burundi","region":"Africa","rates":{"female":2.9,"male":7.8,"all":5.1}},{"iso3":"SDN","name":"Sudan","region":"Eastern Mediterranean","rates":{"female":3.0,"all":5.1,"male":7.2}},{"iso3":"RWA","name":"Rwanda","region":"Africa","rates":{"all":5.0,"female":3.4,"male":7.1}},{"iso3":"VEN","name":"Venezuela (Bolivarian Republic of)","region":"Americas","rates":{"female":3.8,"all":5.0,"male":6.0}},{"iso3":"NAM","name":"Namibia","region":"Africa","rates":{"female":3.9,"all":4.9,"male":5.8}},{"iso3":"KNA","name":"Saint Kitts and Nevis","region":"Americas","rates":{"male":10.0,"all":4.9,"female":0.0}},{"iso3":"NZL","name":"New Zealand","region":"Western Pacific","rates":{"male":6.1,"all":4.9,"female":3.9}},{"iso3":"NER","name":"Niger","region":"Africa","rates":{"female":2.9,"male":6.5,"all":4.8}},{"iso3":"DEU","name":"Germany","region":"Europe","rates":{"male":6.1,"female":3.7,"all":4.8}},{"iso3":"KEN","name":"Kenya","region":"Africa","rates":{"female":3.6,"all":4.8,"male":6.0}},{"iso3":"MYS","name":"Malaysia","region":"Western Pacific","rates":{"female":3.7,"all":4.8,"male":5.9}},{"iso3":"NGA","name":"Nigeria","region":"Africa","rates":{"female":3.3,"male":6.3,"all":4.7}},{"iso3":"GIN","name":"Guinea","region":"Africa","rates":{"male":6.0,"female":3.4,"all":4.7}},{"iso3":"UGA","name":"Uganda","region":"Africa","rates":{"male":5.9,"female":3.3,"all":4.6}},{"iso3":"MOZ","name":"Mozambique","region":"Africa","rates":{"male":6.1,"female":3.3,"all":4.6}},{"iso3":"FRA","name":"France","region":"Europe","rates":{"male":6.1,"female":3.4,"all":4.6}},{"iso3":"GNQ","name":"Equatorial Guinea","region":"Africa","rates":{"male":5.8,"all":4.6,"female":3.5}},{"iso3":"PRT","name":"Portugal","region":"Europe","rates":{"all":4.6,"male":6.3,"female":3.1}},{"iso3":"COD","name":"Democratic Republic of the Congo","region":"Africa","rates":{"female":2.7,"male":6.7,"all":4.6}},{"iso3":"THA","name":"Thailand","region":"South-East Asia","rates":{"male":4.8,"female":4.0,"all":4.5}},{"iso3":"TCD","name":"Chad","region":"Africa","rates":{"male":6.1,"all":4.5,"female":3.1}},{"iso3":"COL","name":"Colombia","region":"Americas","rates":{"male":7.6,"all":4.5,"female":1.8}},{"iso3":"GTM","name":"Guatemala","region":"Americas","rates":{"all":4.5,"female":2.8,"male":6.5}},{"iso3":"GRD","name":"Grenada","region":"Americas","rates":{"male":10.9,"female":0.9,"all":4.5}},{"iso3":"CHL","name":"Chile","region":"Americas","rates":{"male":6.2,"female":3.0,"all":4.5}},{"iso3":"BFA","name":"Burkina Faso","region":"Africa","rates":{"female":3.4,"male":5.9,"all":4.5}},{"iso3":"ZMB","name":"Zambia","region":"Africa","rates":{"all":4.4,"female":3.2,"male":5.8}},{"iso3":"TZA","name":"United Republic of Tanzania","region":"Africa","rates":{"all":4.4,"female":2.9,"male":5.9}},{"iso3":"ECU","name":"Ecuador","region":"Americas","rates":{"all":4.4,"male":7.4,"female":1.4}},{"iso3":"MLI","name":"Mali","region":"Africa","rates":{"female":3.0,"male":6.2,"all":4.4}},{"iso3":"IRN","name":"Iran (Islamic Republic of)","region":"Eastern Mediterranean","rates":{"all":4.4,"female":2.6,"male":6.3}},{"iso3":"LBR","name":"Liberia","region":"Africa","rates":{"male":6.3,"all":4.3,"female":2.4}},{"iso3":"COG","name":"Congo","region":"Africa","rates":{"all":4.3,"male":5.5,"female":3.2}},{"iso3":"SUR","name":"Suriname","region":"Americas","rates":{"male":4.9,"all":4.3,"female":3.7}},{"iso3":"CMR","name":"Cameroon","region":"Africa","rates":{"female":3.3,"male":5.3,"all":4.2}},{"iso3":"KGZ","name":"Kyrgyzstan","region":"Europe","rates":{"all":4.2,"male":7.5,"female":1.3}},{"iso3":"GHA","name":"Ghana","region":"Africa","rates":{"male":4.5,"all":4.1,"female":3.6}},{"iso3":"SGP","name":"Singapore","region":"Western Pacific","rates":{"female":2.9,"all":4.1,"male":5.4}},{"iso3":"MRT","name":"Mauritania","region":"Africa","rates":{"female":3.2,"all":4.1,"male":5.2}},{"iso3":"JAM","name":"Jamaica","region":"Americas","rates":{"female":2.7,"all":4.1,"male":5.5}},{"iso3":"SEN","name":"Senegal","region":"Africa","rates":{"male":5.1,"all":4.1,"female":3.1}},{"iso3":"USA","name":"United States of America","region":"Americas","rates":{"all":4.0,"male":5.2,"female":2.9}},{"iso3":"STP","name":"Sao Tome and Principe","region":"Africa","rates":{"female":2.6,"male":5.3,"all":3.9}},{"iso3":"DZA","name":"Algeria","region":"Africa","rates":{"female":3.9,"all":3.9,"male":3.7}},{"iso3":"GMB","name":"Gambia","region":"Africa","rates":{"female":3.0,"male":5.0,"all":3.9}},{"iso3":"ETH","name":"Ethiopia","region":"Africa","rates":{"female":2.4,"male":5.3,"all":3.8}},{"iso3":"TGO","name":"Togo","region":"Africa","rates":{"female":2.7,"all":3.8,"male":4.9}},{"iso3":"MEX","name":"Mexico","region":"Americas","rates":{"all":3.8,"male":5.9,"female":1.8}},{"iso3":"NLD","name":"Netherlands (Kingdom of the)","region":"Europe","rates":{"female":3.0,"all":3.8,"male":4.7}},{"iso3":"GUY","name":"Guyana","region":"Americas","rates":{"male":4.7,"female":2.6,"all":3.8}},{"iso3":"MWI","name":"Malawi","region":"Africa","rates":{"male":5.1,"all":3.7,"female":2.5}},{"iso3":"CAN","name":"Canada","region":"Americas","rates":{"male":4.7,"female":2.6,"all":3.6}},{"iso3":"PHL","name":"Philippines","region":"Western Pacific","rates":{"male":4.6,"all":3.6,"female":2.4}},{"iso3":"BEN","name":"Benin","region":"Africa","rates":{"female":2.6,"all":3.6,"male":4.7}},{"iso3":"LBY","name":"Libya","region":"Eastern Mediterranean","rates":{"all":3.6,"male":5.0,"female":1.9}},{"iso3":"ERI","name":"Eritrea","region":"Africa","rates":{"male":4.6,"all":3.6,"female":2.8}},{"iso3":"ZAF","name":"South Africa","region":"Africa","rates":{"all":3.5,"female":2.3,"male":4.8}},{"iso3":"ISL","name":"Iceland","region":"Europe","rates":{"female":1.7,"male":5.6,"all":3.5}},{"iso3":"KAZ","name":"Kazakhstan","region":"Europe","rates":{"female":1.7,"male":5.6,"all":3.5}},{"iso3":"GNB","name":"Guinea-Bissau","region":"Africa","rates":{"male":4.7,"female":2.3,"all":3.5}},{"iso3":"TUN","name":"Tunisia","region":"Eastern Mediterranean","rates":{"male":5.1,"all":3.5,"female":1.9}},{"iso3":"MDG","name":"Madagascar","region":"Africa","rates":{"male":4.5,"female":2.6,"all":3.5}},{"iso3":"GBR","name":"United Kingdom of Great Britain and Northern Ireland","region":"Europe","rates":{"all":3.5,"male":4.3,"female":2.7}},{"iso3":"LSO","name":"Lesotho","region":"Africa","rates":{"female":2.8,"male":4.2,"all":3.4}},{"iso3":"LKA","name":"Sri Lanka","region":"South-East Asia","rates":{"all":3.3,"female":1.1,"male":5.7}},{"iso3":"OMN","name":"Oman","region":"Eastern Mediterranean","rates":{"female":0.4,"male":5.2,"all":3.3}},{"iso3":"CPV","name":"Cabo Verde","region":"Africa","rates":{"male":3.7,"all":3.3,"female":3.0}},{"iso3":"NIC","name":"Nicaragua","region":"Americas","rates":{"female":1.1,"male":5.6,"all":3.2}},{"iso3":"BGR","name":"Bulgaria","region":"Europe","rates":{"female":1.1,"all":3.1,"male":5.5}},{"iso3":"MAR","name":"Morocco","region":"Eastern Mediterranean","rates":{"all":3.1,"female":1.8,"male":4.5}},{"iso3":"DNK","name":"Denmark","region":"Europe","rates":{"all":3.1,"female":2.0,"male":4.4}},{"iso3":"GRC","name":"Greece","region":"Europe","rates":{"male":4.6,"female":1.5,"all":3.0}},{"iso3":"PAN","name":"Panama","region":"Americas","rates":{"female":1.7,"male":4.3,"all":3.0}},{"iso3":"SWE","name":"Sweden","region":"Europe","rates":{"female":1.8,"male":4.2,"all":2.9}},{"iso3":"CRI","name":"Costa Rica","region":"Americas","rates":{"male":5.3,"all":2.8,"female":0.5}},{"iso3":"BHS","name":"Bahamas","region":"Americas","rates":{"male":3.6,"all":2.7,"female":1.9}},{"iso3":"UZB","name":"Uzbekistan","region":"Europe","rates":{"female":1.1,"male":4.3,"all":2.6}},{"iso3":"TTO","name":"Trinidad and Tobago","region":"Americas","rates":{"female":0.8,"all":2.6,"male":4.6}},{"iso3":"EGY","name":"Egypt","region":"Eastern Mediterranean","rates":{"all":2.6,"female":1.2,"male":4.2}},{"iso3":"JPN","name":"Japan","region":"Western Pacific","rates":{"all":2.5,"male":3.8,"female":1.4}},{"iso3":"COM","name":"Comoros","region":"Africa","rates":{"all":2.5,"male":3.2,"female":1.9}},{"iso3":"BRN","name":"Brunei Darussalam","region":"Western Pacific","rates":{"male":4.7,"female":0.6,"all":2.4}},{"iso3":"ESP","name":"Spain","region":"Europe","rates":{"female":1.3,"all":2.3,"male":3.4}},{"iso3":"JOR","name":"Jordan","region":"Eastern Mediterranean","rates":{"all":2.2,"female":0.9,"male":3.4}},{"iso3":"AUS","name":"Australia","region":"Western Pacific","rates":{"female":1.5,"all":2.2,"male":3.0}},{"iso3":"MUS","name":"Mauritius","region":"Africa","rates":{"all":2.2,"female":0.5,"male":4.0}},{"iso3":"AND","name":"Andorra","region":"Europe","rates":{"male":2.9,"female":1.4,"all":2.1}},{"iso3":"ALB","name":"Albania","region":"Europe","rates":{"female":1.2,"all":2.1,"male":3.1}},{"iso3":"DOM","name":"Dominican Republic","region":"Americas","rates":{"male":2.1,"female":2.1,"all":2.1}},{"iso3":"MKD","name":"North Macedonia","region":"Europe","rates":{"all":2.0,"female":1.4,"male":2.6}},{"iso3":"KWT","name":"Kuwait","region":"Eastern Mediterranean","rates":{"all":2.0,"female":0.9,"male":2.8}},{"iso3":"TKM","name":"Turkmenistan","region":"Europe","rates":{"male":3.1,"all":1.9,"female":0.9}},{"iso3":"ARE","name":"United Arab Emirates","region":"Eastern Mediterranean","rates":{"female":0.8,"male":2.1,"all":1.8}},{"iso3":"ARM","name":"Armenia","region":"Europe","rates":{"all":1.7,"female":1.2,"male":2.6}},{"iso3":"HTI","name":"Haiti","region":"Americas","rates":{"all":1.4,"female":0.8,"male":2.2}},{"iso3":"HND","name":"Honduras","region":"Americas","rates":{"all":1.3,"male":1.6,"female":1.0}},{"iso3":"SYR","name":"Syrian Arab Republic","region":"Eastern Mediterranean","rates":{"male":1.3,"female":1.0,"all":1.2}},{"iso3":"DMA","name":"Dominica","region":"Americas","rates":{"male":2.5,"female":0.0,"all":1.2}},{"iso3":"TJK","name":"Tajikistan","region":"Europe","rates":{"all":1.2,"female":0.5,"male":2.0}},{"iso3":"ISR","name":"Israel","region":"Europe","rates":{"female":0.5,"male":1.9,"all":1.2}},{"iso3":"QAT","name":"Qatar","region":"Eastern Mediterranean","rates":{"male":1.8,"all":1.2,"female":0.0}},{"iso3":"BHR","name":"Bahrain","region":"Eastern Mediterranean","rates":{"all":1.0,"male":1.7,"female":0.2}},{"iso3":"ATG","name":"Antigua and Barbuda","region":"Americas","rates":{"all":1.0,"male":2.0,"female":0.0}},{"iso3":"URY","name":"Uruguay","region":"Americas","rates":{"female":0.4,"all":0.9,"male":1.6}},{"iso3":"SYC","name":"Seychelles","region":"Africa","rates":{"male":1.4,"female":0.4,"all":0.9}},{"iso3":"PRY","name":"Paraguay","region":"Americas","rates":{"female":0.3,"all":0.8,"male":1.3}},{"iso3":"ARG","name":"Argentina","region":"Americas","rates":{"male":1.3,"female":0.3,"all":0.8}},{"iso3":"BRB","name":"Barbados","region":"Americas","rates":{"female":0.8,"all":0.8,"male":1.0}},{"iso3":"BOL","name":"Bolivia (Plurinational State of)","region":"Americas","rates":{"female":0.3,"male":1.0,"all":0.6}},{"iso3":"GEO","name":"Georgia","region":"Europe","rates":{"male":0.9,"all":0.6,"female":0.3}},{"iso3":"PER","name":"Peru","region":"Americas","rates":{"female":0.3,"male":0.9,"all":0.6}},{"iso3":"AZE","name":"Azerbaijan","region":"Europe","rates":{"male":0.7,"female":0.4,"all":0.5}},{"iso3":"BIH","name":"Bosnia and Herzegovina","region":"Europe","rates":{"female":0.4,"all":0.4,"male":0.5}},{"iso3":"CYP","name":"Cyprus","region":"Europe","rates":{"all":0.4,"female":0.4,"male":0.3}},{"iso3":"LCA","name":"Saint Lucia","region":"Americas","rates":{"male":0.0,"female":0.5,"all":0.3}},{"iso3":"SLB","name":"Solomon Islands","region":"Western Pacific","rates":{"female":0.3,"male":0.0,"all":0.2}},{"iso3":"VUT","name":"Vanuatu","region":"Western Pacific","rates":{"female":0.1,"all":0.1,"male":0.0}},{"iso3":"TUV","name":"Tuvalu","region":"Western Pacific","rates":{"all":0.1,"male":0.0,"female":0.2}},{"iso3":"COK","name":"Cook Islands","region":"Western Pacific","rates":{"female":0.0,"male":0.0,"all":0.0}},{"iso3":"FSM","name":"Micronesia (Federated States of)","region":"Western Pacific","rates":{"male":0.0,"female":0.1,"all":0.0}},{"iso3":"MHL","name":"Marshall Islands","region":"Western Pacific","rates":{"all":0.0,"male":0.0,"female":0.1}},{"iso3":"WSM","name":"Samoa","region":"Western Pacific","rates":{"female":0.0,"male":0.0,"all":0.0}},{"iso3":"PLW","name":"Palau","region":"Western Pacific","rates":{"all":0.0,"female":0.1,"male":0.0}},{"iso3":"FJI","name":"Fiji","region":"Western Pacific","rates":{"male":0.0,"female":0.1,"all":0.0}},{"iso3":"NIU","name":"Niue","region":"Western Pacific","rates":{"all":0.0,"male":0.0,"female":0.1}},{"iso3":"TON","name":"Tonga","region":"Western Pacific","rates":{"all":0.0,"male":0.0,"female":0.0}}]};
// SNAPSHOT-END

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
