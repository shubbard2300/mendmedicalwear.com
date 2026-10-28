import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {JsonLd} from '@/components/JsonLd'
import {CtaFinal, Features, MarketingFooter, MarketingHeader, Specs, Statement} from '@/components/Marketing'
import {AppHero, Devices, Protocol, Security} from '@/components/MendApp'
import {OgTypeProduct} from '@/components/Pdp'
import {MARKETING_PAGES} from '@/components/variants'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd, FREE_PRICE, softwareLd} from '@/sanity/jsonld'
import {PRODUCT_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
// The marketing pages carry all their CSS in one inline block live; this is that block, and nothing else loads here.
import '@/styles/pages/mend-app.css'

const SLUG = 'mend-app'
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

export default async function AppPage() {
  const {doc} = await load()
  // The sections run: hero, statement, features, protocol, the HIPAA source note (it sits inside the protocol), security, devices, specs, closing band.
  const [hero, statement, features, protocol, note, security, devices, specs, cta] = doc.sections ?? []
  if (
    doc.schemaKind !== 'software' ||
    hero?._type !== 'heroSection' ||
    statement?._type !== 'statementSection' ||
    features?._type !== 'cardSection' ||
    protocol?._type !== 'stepsSection' ||
    note?._type !== 'richSection' ||
    security?._type !== 'cardSection' ||
    devices?._type !== 'relatedSection' ||
    specs?._type !== 'specSection' ||
    cta?._type !== 'ctaSection'
  ) {
    throw new Error(`${SLUG}: the document is not the software page with its sections in the order the page lays out`)
  }
  const {cardDelays, securityDelays, deviceDelays} = MARKETING_PAGES[SLUG]

  return (
    <>
      <OgTypeProduct />
      {doc.offerKind === 'free' && (
        <>
          <meta property="product:price:amount" content={FREE_PRICE.price} />
          <meta property="product:price:currency" content={FREE_PRICE.priceCurrency} />
        </>
      )}
      <JsonLd data={softwareLd(doc.seo, {heroFile: doc.heroImage?.file, offerKind: doc.offerKind})} />
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <MarketingHeader menu={doc.navMenu} />
      <AppHero s={hero} />
      <Statement s={statement} />
      <Features s={features} delays={cardDelays} />
      <Protocol s={protocol} note={note} />
      <Security s={security} delays={securityDelays ?? []} />
      <Devices s={devices} delays={deviceDelays ?? []} />
      <Specs s={specs} plain />
      <CtaFinal s={cta} />
      <MarketingFooter note={doc.footerNote} menu={doc.footerMenu} />
    </>
  )
}
