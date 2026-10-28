import {defineQuery} from 'next-sanity'

// Each query takes the whole document and expands only document-level references (menus, linked products).
// Images stay as stored: `alt` plus the asset reference. P3d turns a reference into a URL and size.
// After any change here, run `npm run typegen` in studio/ so types.ts matches.

export const SITE_SETTINGS_QUERY = defineQuery(`*[_type == "siteSettings"][0]`)

export const HOME_QUERY = defineQuery(`*[_type == "homePage"][0]{
  ...,
  navMenu->,
  footerMenu->,
  productsSection{..., cards[]{..., product->{"slug": slug.current}}}
}`)

export const PRODUCT_QUERY = defineQuery(`*[_type == "product" && slug.current == $slug][0]{
  ...,
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
