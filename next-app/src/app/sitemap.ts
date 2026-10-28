import type {MetadataRoute} from 'next'
import {SITE_URL} from '@/lib/site'
import {sanityFetch} from '@/sanity/fetch'
import {SITEMAP_QUERY} from '@/sanity/queries'

// The 12 URLs, in the live file's order, with the frequency and priority the live file states. lastmod comes from the document's
// _updatedAt, so an edit in Sanity moves it (the live file's dates are typed by hand). A page with no document fails the build.
const PAGES: [path: string, changeFrequency: 'weekly' | 'monthly', priority: number][] = [
  ['/', 'weekly', 1],
  ['/products/stylish-washable-hospital-gown', 'weekly', 0.8],
  ['/products/residential-nurse-scrub-set', 'weekly', 0.8],
  ['/products/compression-socks', 'weekly', 0.8],
  ['/products/airguard-collar', 'weekly', 0.8],
  ['/products/mend-pulse', 'weekly', 0.8],
  ['/products/mend-oxi', 'weekly', 0.8],
  ['/products/mend-app', 'weekly', 0.8],
  ['/fall-risk-assessment', 'monthly', 0.7],
  ['/facilities', 'monthly', 0.8],
  ['/FAQ', 'monthly', 0.5],
  ['/Privacy-Terms', 'monthly', 0.3],
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const docs = await sanityFetch({query: SITEMAP_QUERY})
  return PAGES.map(([path, changeFrequency, priority]) => {
    const doc = docs.find((d) => d.path === path)
    if (!doc) throw new Error(`sitemap: no document for ${path}`)
    return {url: `${SITE_URL}${path}`, lastModified: doc._updatedAt.slice(0, 10), changeFrequency, priority}
  })
}
