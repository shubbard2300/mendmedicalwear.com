import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {JsonLd} from '@/components/JsonLd'
import {CtaFinal, Features, Hero, MarketingFooter, MarketingHeader, Pair, Specs, Statement} from '@/components/Marketing'
import {OgTypeProduct} from '@/components/Pdp'
import {MARKETING_PAGES} from '@/components/variants'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd} from '@/sanity/jsonld'
import {PRODUCT_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
// The marketing pages carry all their CSS in one inline block live; this is that block, and nothing else loads here.
import '@/styles/pages/mend-oxi.css'

const SLUG = 'mend-oxi'
const PATH = `/products/${SLUG}`

// generateMetadata and the page both load this; Next dedupes the fetches.
async function load() {
  const [doc, settings] = await Promise.all([sanityFetch({query: PRODUCT_QUERY, params: {slug: SLUG}}), sanityFetch({query: SITE_SETTINGS_QUERY})])
  if (!doc || !settings) notFound()
  return {doc, settings}
}

export async function generateMetadata(): Promise<Metadata> {
  const {doc, settings} = await load()
  return pageMetadata({seo: doc.seo, path: PATH, settings, product: {file: doc.heroImage?.file, alt: doc.heroImage?.alt ?? ''}})
}

export default async function OxiPage() {
  const {doc} = await load()
  const [hero, statement, features, pair, specs, cta] = doc.sections ?? []
  if (
    hero?._type !== 'heroSection' ||
    statement?._type !== 'statementSection' ||
    features?._type !== 'cardSection' ||
    pair?._type !== 'relatedSection' ||
    specs?._type !== 'specSection' ||
    cta?._type !== 'ctaSection'
  ) {
    throw new Error(`${SLUG}: the sections are not in the order the page lays out`)
  }
  const {cardDelays, pairDelays} = MARKETING_PAGES[SLUG]

  return (
    <>
      <OgTypeProduct />
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <MarketingHeader menu={doc.navMenu} />
      <Hero s={hero} />
      <Statement s={statement} />
      <Features s={features} delays={cardDelays} />
      <Pair s={pair} delays={pairDelays ?? []} />
      <Specs s={specs} />
      <CtaFinal s={cta} />
      <MarketingFooter note={doc.footerNote} menu={doc.footerMenu} />
    </>
  )
}
