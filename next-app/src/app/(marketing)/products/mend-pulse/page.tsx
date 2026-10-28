import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {JsonLd} from '@/components/JsonLd'
import {CtaFinal, Features, Hero, MarketingFooter, MarketingHeader, Specs, Statement} from '@/components/Marketing'
import {OgTypeProduct} from '@/components/Pdp'
import {AppSection, Benefits, DesignSection, Ecosystem} from '@/components/Pulse'
import {MARKETING_PAGES} from '@/components/variants'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd, productLd} from '@/sanity/jsonld'
import {PRODUCT_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
// The marketing pages carry all their CSS in one inline block live; this is that block, and nothing else loads here.
import '@/styles/pages/mend-pulse.css'

const SLUG = 'mend-pulse'
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

export default async function PulsePage() {
  const {doc} = await load()
  // The sections run: hero, statement, features, design, ecosystem, benefits, the morning timeline (beside the benefits copy), app, specs, closing band.
  const [hero, statement, features, design, ecosystem, benefits, morning, app, specs, cta] = doc.sections ?? []
  if (
    hero?._type !== 'heroSection' ||
    statement?._type !== 'statementSection' ||
    features?._type !== 'cardSection' ||
    design?._type !== 'cardSection' ||
    ecosystem?._type !== 'stepsSection' ||
    benefits?._type !== 'richSection' ||
    morning?._type !== 'stepsSection' ||
    app?._type !== 'cardSection' ||
    specs?._type !== 'specSection' ||
    cta?._type !== 'ctaSection'
  ) {
    throw new Error(`${SLUG}: the sections are not in the order the page lays out`)
  }
  const {cardDelays, designDelays} = MARKETING_PAGES[SLUG]

  return (
    <>
      <OgTypeProduct />
      <JsonLd data={productLd(doc.seo, {heroFile: doc.heroImage?.file, offerKind: doc.offerKind}, PATH)} />
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <MarketingHeader menu={doc.navMenu} />
      <Hero s={hero} imageStyle={{borderRadius: '28px'}} />
      <Statement s={statement} />
      <Features s={features} delays={cardDelays} />
      <DesignSection s={design} delays={designDelays ?? []} />
      <Ecosystem s={ecosystem} />
      <Benefits copy={benefits} morning={morning} />
      <AppSection s={app} />
      <Specs s={specs} />
      <CtaFinal s={cta} />
      <MarketingFooter note={doc.footerNote} menu={doc.footerMenu} />
    </>
  )
}
