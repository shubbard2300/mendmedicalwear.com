import type {Metadata} from 'next'
import {INDEXABLE, SITE_URL} from '@/lib/site'
import {imageInfo} from './image'
import type {SITE_SETTINGS_QUERY_RESULT, Seo} from './types'

type Settings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

export const absolute = (path: string) => SITE_URL + path

// The rules of check_docs.py `derive_head`, in code: every tag comes from the page's `seo` object and the site settings.
// Open Graph and Twitter tags exist only where the page stores an `ogTitle` (FAQ and Privacy-Terms have none).
// `product` marks a product page: the share image is the product's hero photo at today's address, with no stated size (og:type "product" comes from the page).
export function pageMetadata({
  seo,
  path,
  settings,
  social = false,
  product,
}: {
  seo?: Seo
  path: string
  settings: Settings
  social?: boolean
  product?: {file?: string | null; alt: string}
}): Metadata {
  const url = absolute(path)
  const meta: Metadata = {
    title: seo?.title,
    description: seo?.description,
    alternates: {canonical: url},
    robots: INDEXABLE ? seo?.robots : 'noindex, nofollow',
    ...(seo?.keywords ? {keywords: seo.keywords} : {}),
    ...(seo?.author ? {authors: [{name: seo.author}]} : {}),
    ...(seo?.themeColor ? {other: {'theme-color': seo.themeColor}} : {}),
  }
  if (!seo?.ogTitle) return meta

  const card = settings.socialCard
  const image: {url: string; alt: string; width?: number; height?: number} | undefined =
    social && card?.file && card.asset
      ? {url: `${SITE_URL}/${card.file}`, alt: seo.ogImageAlt || card.alt, width: imageInfo(card.asset._ref).width, height: imageInfo(card.asset._ref).height}
      : product?.file
        ? {url: `${SITE_URL}/${product.file}`, alt: seo.ogImageAlt || product.alt}
        : undefined
  meta.openGraph = {
    // Next rejects the Open Graph type "product" (its list leaves it out), so a product page renders that one tag itself (OgTypeProduct).
    ...(product ? {} : {type: 'website' as const}),
    siteName: seo.brandName || settings.siteName,
    title: seo.ogTitle,
    description: seo.ogDescription,
    url,
    ...(image ? {images: [image]} : {}),
  }
  meta.twitter = {
    card: 'summary_large_image',
    title: seo.ogTitle,
    description: seo.twitterDescription || seo.ogDescription,
    ...(image ? {images: [{url: image.url, alt: image.alt}]} : {}),
  }
  return meta
}
