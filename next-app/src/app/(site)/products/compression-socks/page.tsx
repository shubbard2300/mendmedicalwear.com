import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {BrandIt} from '@/components/BrandIt'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {JsonLd} from '@/components/JsonLd'
import {BundleNote, CtaRow, Description, Gallery, OgTypeProduct, PdpFrame, ProductIntro, SpecList} from '@/components/Pdp'
import {SockColorPicker, SockSizePicker, groupsOf} from '@/components/Pickers'
import {ProductBehavior} from '@/components/ProductBehavior'
import {RichText} from '@/components/RichText'
import {Sections} from '@/components/Sections'
import {PRODUCT_VARIANTS, SOCKS_DEFAULT_SIZE} from '@/components/variants'
import {ColorGrid, FeatureSection} from '@/components/Webbing'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd} from '@/sanity/jsonld'
import {PRODUCT_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
// Live order: the shared sheet (layout), the page's own block, pdp.css (it wins where they disagree), then a small extra block that wins over pdp.css.
import '@/styles/pages/socks.css'
import '@/styles/pdp.css'
import '@/styles/pages/socks-extra.css'

const SLUG = 'compression-socks'
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

export default async function SocksPage() {
  const {doc, settings} = await load()
  // The sections run: the tagline, the bundle note and the source note (all three sit in the info column), the steps, the webbing block, the
  // color grid, the non-slip block with its wide photo (a section of its own in the document), the comparison grid, then the branding copy and button.
  const [tagline, bundle, source, steps, webbing, colors, nonSlip, widePhoto, compare, brand, brandCta] = doc.sections ?? []
  if (
    tagline?._type !== 'richSection' || tagline.anchorId !== 'tagline' ||
    bundle?._type !== 'richSection' || bundle.anchorId !== 'bundle-note' ||
    source?._type !== 'richSection' ||
    steps?._type !== 'stepsSection' ||
    webbing?._type !== 'richSection' ||
    colors?._type !== 'cardSection' ||
    nonSlip?._type !== 'richSection' ||
    widePhoto?._type !== 'richSection' ||
    compare?._type !== 'comparisonSection' ||
    brand?._type !== 'richSection' ||
    brandCta?._type !== 'ctaSection'
  ) {
    throw new Error(`${SLUG}: the sections are not in the order the page lays out`)
  }

  // The strip shows every matrix photo in order: the eight colors, then the detail shots (named by their label).
  const thumbs = (doc.imageMatrix ?? []).map((photo) => ({photo, alt: photo.color ?? photo.label ?? '', color: photo.color ?? 'detail', withSrc: true}))
  const below = PRODUCT_VARIANTS[SLUG].below

  return (
    <>
      <OgTypeProduct />
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <div className="wrap">
        <Header menu={doc.navMenu} />
        <PdpFrame gallery={<Gallery image={doc.heroImage} thumbs={thumbs} thumbsId="thumbsGrid" />}>
          <ProductIntro product={doc} tagline={tagline.eyebrow} />
          <SockColorPicker group={groupsOf(doc, 'color')[0]} matrix={doc.imageMatrix} />
          <SockSizePicker group={groupsOf(doc, 'size')[0]} defaultSize={SOCKS_DEFAULT_SIZE} />
          <CtaRow ctas={doc.ctas} />
          <BundleNote blocks={bundle.body} />
          <Description blocks={doc.description} />
          <SpecList specs={doc.specs} />
          <RichText value={source.body} />
        </PdpFrame>
        <Sections sections={[steps]} variants={below.slice(0, 1)} settings={settings} page={SLUG} />
        <FeatureSection heading={webbing.heading} body={webbing.body} image={webbing.image} />
        <ColorGrid heading={colors.heading} cards={colors.cards} />
        <FeatureSection heading={nonSlip.heading} body={nonSlip.body} image={nonSlip.image} widePhoto={widePhoto.image} />
        <Sections sections={[compare]} variants={below.slice(1)} settings={settings} page={SLUG} />
        <BrandIt heading={brand.heading} body={brand.body} cta={brandCta.ctas?.[0]} footnote={brandCta.footnote} />
        <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
        <ProductBehavior page="socks" />
      </div>
    </>
  )
}
