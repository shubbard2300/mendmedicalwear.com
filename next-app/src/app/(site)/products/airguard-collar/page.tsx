import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {BrandIt} from '@/components/BrandIt'
import {FallRiskTool} from '@/components/FallRiskTool'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {JsonLd} from '@/components/JsonLd'
import {BundleNote, ComingSoon, Description, Gallery, NotifyForm, OgTypeProduct, PdpFrame, ProductIntro, SpecList} from '@/components/Pdp'
import {ProductBehavior} from '@/components/ProductBehavior'
import {Sections} from '@/components/Sections'
import {PRODUCT_VARIANTS} from '@/components/variants'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd} from '@/sanity/jsonld'
import {PRODUCT_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
// Live order: the shared sheet (layout), then the page's own block, then pdp.css, then fall-risk.css. A later sheet wins a conflict, so the
// product block comes first and pdp.css overrides it where they disagree (for example the padding of the specification rows).
import '@/styles/pages/airguard.css'
import '@/styles/pdp.css'
import '@/styles/fall-risk.css'

const SLUG = 'airguard-collar'
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

export default async function AirGuardPage() {
  const {doc, settings} = await load()
  // The sections run: the bundle note (info column), the blocks below the product area, then the branding copy and its button.
  const [bundle, ...rest] = doc.sections ?? []
  const [brand, brandCta] = rest.slice(-2)
  const below = rest.slice(0, -2)
  if (bundle?._type !== 'richSection' || bundle.anchorId !== 'bundle-note' || brand?._type !== 'richSection' || brandCta?._type !== 'ctaSection') {
    throw new Error(`${SLUG}: expected a bundle note first and the branding copy and button last`)
  }

  return (
    <>
      <OgTypeProduct />
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <div className="wrap">
        <Header menu={doc.navMenu} />
        <PdpFrame gallery={<Gallery image={doc.heroImage} />}>
          <ProductIntro product={doc} priceStyle={{fontSize: '17px', fontWeight: 500, color: 'var(--muted)'}} />
          <ComingSoon text={doc.banner} />
          <NotifyForm cta={doc.ctas?.[0]} />
          <BundleNote blocks={bundle.body} />
          <Description blocks={doc.description} />
          <SpecList specs={doc.specs} />
        </PdpFrame>
        <Sections sections={below} variants={PRODUCT_VARIANTS[SLUG].below} settings={settings} page={SLUG} />
        <BrandIt heading={brand.heading} body={brand.body} cta={brandCta.ctas?.[0]} footnote={brandCta.footnote} />
        <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
        <ProductBehavior page="airguard" />
        <FallRiskTool />
      </div>
    </>
  )
}
