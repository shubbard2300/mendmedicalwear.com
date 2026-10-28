import type {Metadata} from 'next'
import {INDEXABLE, SITE_URL} from '@/lib/site'
import {imageInfo} from './image'
import type {SITE_SETTINGS_QUERY_RESULT, Seo} from './types'

type Settings = NonNullable<SITE_SETTINGS_QUERY_RESULT>

export const absolute = (path: string) => SITE_URL + path

// The rules of check_docs.py `derive_head`, in code: every tag comes from the page's `seo` object and the site settings.
// Open Graph and Twitter tags exist only where the page stores an `ogTitle` (FAQ and Privacy-Terms have none).
export function pageMetadata({seo, path, settings, social = false}: {seo?: Seo; path: string; settings: Settings; social?: boolean}): Metadata {
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
  const image =
    social && card?.file && card.asset
      ? {url: `${SITE_URL}/${card.file}`, alt: seo.ogImageAlt || card.alt, width: imageInfo(card.asset._ref).width, height: imageInfo(card.asset._ref).height}
      : undefined
  meta.openGraph = {
    type: 'website',
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
