import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {BrandIt} from '@/components/BrandIt'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {JsonLd} from '@/components/JsonLd'
import {BundleNote, CtaRow, Description, Gallery, OgTypeProduct, PdpFrame, ProductIntro, SpecList, findPhoto, photoTable, sockPhotos} from '@/components/Pdp'
import {BundleOffer, ColorPicker, FitPicker, SizePicker, groupsOf} from '@/components/Pickers'
import {ProductBehavior} from '@/components/ProductBehavior'
import {Sections} from '@/components/Sections'
import {APPAREL_PAGES, PRODUCT_VARIANTS} from '@/components/variants'
import {ViewsGrid} from '@/components/ViewsGrid'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd, productLd} from '@/sanity/jsonld'
import {PRODUCT_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
// Live order: the shared sheet (layout), the page's own block, pdp.css (it wins where they disagree), then a small extra block that wins over pdp.css.
import '@/styles/pages/scrubs.css'
import '@/styles/pdp.css'
import '@/styles/pages/scrubs-extra.css'

const SLUG = 'residential-nurse-scrub-set'
const PATH = `/products/${SLUG}`
const PAGE = APPAREL_PAGES[SLUG]

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

export default async function ScrubsPage() {
  const {doc, settings} = await load()
  // The sections run: the bundle note (info column), the steps, the views section, the comparison grid, then the branding copy and its button.
  const [bundle, steps, views, ...rest] = doc.sections ?? []
  const [brand, brandCta] = rest.slice(-2)
  const compare = rest.slice(0, -2)
  if (bundle?._type !== 'richSection' || bundle.anchorId !== 'bundle-note' || steps?._type !== 'stepsSection' || views?._type !== 'richSection' || brand?._type !== 'richSection' || brandCta?._type !== 'ctaSection') {
    throw new Error(`${SLUG}: expected a bundle note, steps, a views section, the comparison and the branding copy and button`)
  }
  if (!doc.bundleOffer || !PAGE.bundleColor) throw new Error(`${SLUG}: expected a bundle offer`)

  const thumbs = PAGE.thumbs.map((t) => ({
    photo: findPhoto(doc.imageMatrix, PAGE.views.match(t.key)),
    alt: t.alt,
    view: t.key.view,
    gender: t.showGender ? t.key.gender : undefined,
    ariaLabel: t.ariaLabel,
  }))
  const below = PRODUCT_VARIANTS[SLUG].below
  // What the pickers can reach, as a table for the browser (the build fails if any combination has no photo), and the bundle's sock photos
  // (the socks product's matrix, loaded with the same query).
  const values = (g: {options?: {value?: string}[]}) => (g.options ?? []).map((o) => o.value ?? '')
  const photos = photoTable(doc.imageMatrix, {gender: values(groupsOf(doc, 'fit')[0]), view: ['front', 'back', 'pockets'], color: values(groupsOf(doc, 'color')[0])})
  const socksDoc = await sanityFetch({query: PRODUCT_QUERY, params: {slug: doc.bundleOffer.product?.slug ?? ''}})
  if (!socksDoc) throw new Error(`${SLUG}: the bundle's product is missing`)
  const sockColors = (doc.bundleOffer.product?.variantGroups?.find((g) => g.kind === 'color')?.options ?? []).map((o) => o.value ?? o.label ?? '')
  const socks = sockPhotos(socksDoc.imageMatrix, sockColors)

  return (
    <>
      <OgTypeProduct />
      <JsonLd data={productLd(doc.seo, {heroFile: doc.heroImage?.file, offerKind: doc.offerKind}, PATH)} />
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <div className="wrap">
        <Header menu={doc.navMenu} />
        <PdpFrame gallery={<Gallery image={doc.heroImage} thumbs={thumbs} />}>
          <ProductIntro product={doc} />
          <FitPicker group={groupsOf(doc, 'fit')[0]} />
          <ColorPicker group={groupsOf(doc, 'color')[0]} showValue={PAGE.colorShowsValue} />
          <SizePicker groups={groupsOf(doc, 'size')} guide={doc.sizeGuide} defaultSize={PAGE.defaultSize} />
          <CtaRow ctas={doc.ctas} firstId="ctaPrimary" />
          <BundleOffer offer={doc.bundleOffer} defaultColor={PAGE.bundleColor} />
          <BundleNote blocks={bundle.body} />
          <Description blocks={doc.description} />
          <SpecList specs={doc.specs} />
        </PdpFrame>
        <Sections sections={[steps]} variants={below.slice(0, 1)} settings={settings} page={SLUG} />
        <ViewsGrid heading={views.heading} product={doc} spec={PAGE.views} />
        <Sections sections={compare} variants={below.slice(1)} settings={settings} page={SLUG} />
        <BrandIt heading={brand.heading} body={brand.body} cta={brandCta.ctas?.[0]} footnote={brandCta.footnote} />
        <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
        <ProductBehavior page="scrubs" data={{photos, socks}} />
      </div>
    </>
  )
}
