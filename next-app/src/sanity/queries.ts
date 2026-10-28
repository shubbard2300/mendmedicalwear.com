import {defineQuery} from 'next-sanity'

// Each query takes the whole document and expands only document-level references (menus, linked products).
// Images stay as stored: `alt` plus the asset reference. P3d turns a reference into a URL and size.
// After any change here, run `npm run typegen` in studio/ so types.ts matches.

// `file` is the stored (percent-encoded) file name; the share-image URLs keep today's address, https://www.mendmedicalwear.com/<file> (D13).
export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]{
  ...,
  socialCard{..., "file": asset->originalFilename}
}`)

// Each card photo's `file` and each linked product's offer kind and breadcrumb name feed the home ItemList: its image is the card photo.
export const HOME_QUERY = defineQuery(`*[_type == "homePage"][0]{
  ...,
  navMenu->,
  footerMenu->,
  productsSection{..., cards[]{
    ...,
    images[]{..., "file": asset->originalFilename},
    product->{"slug": slug.current, offerKind, "breadcrumbName": seo.breadcrumbName}
  }}
}`)

// `heroImage.file` is the stored file name: the share image and the structured-data image keep today's address (D13).
export const PRODUCT_QUERY = defineQuery(`*[_type == "product" && slug.current == $slug][0]{
  ...,
  heroImage{..., "file": asset->originalFilename},
  navMenu->,
  footerMenu->,
  bundleOffer{..., product->{name, "slug": slug.current, variantGroups}}
}`)

export const PAGE_QUERY = defineQuery(`*[_type == "page" && slug.current == $slug][0]{
  ...,
  navMenu->,
  footerMenu->
}`)

export const FAQ_QUERY = defineQuery(`*[_type == "faqGroup"] | order(order asc){
  ...,
  "items": *[_type == "faqItem" && group._ref == ^._id] | order(order asc)
}`)
