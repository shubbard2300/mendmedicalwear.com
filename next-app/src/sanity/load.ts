import 'server-only'
import {notFound} from 'next/navigation'
import {sanityFetch} from './fetch'
import {PAGE_QUERY, SITE_SETTINGS_QUERY} from './queries'

/** A `page` document and the site settings, or a 404 when either is missing. generateMetadata and the page both call this; Next dedupes the fetches. */
export async function loadPage(slug: string) {
  const [doc, settings] = await Promise.all([sanityFetch({query: PAGE_QUERY, params: {slug}}), sanityFetch({query: SITE_SETTINGS_QUERY})])
  if (!doc || !settings) notFound()
  return {doc, settings}
}
