import 'server-only'
import type {QueryParams} from 'next-sanity'
import {sanityClient} from './client'

// Published content is cached by Next and refreshed by the Sanity webhook (/api/revalidate), which expires this one tag.
// The hour is the fallback if the webhook ever stops arriving.
export const SANITY_TAG = 'sanity'

export function sanityFetch<const Query extends string>({query, params = {}}: {query: Query; params?: QueryParams}) {
  return sanityClient().fetch(query, params, {cache: 'force-cache', next: {tags: [SANITY_TAG], revalidate: 3600}})
}
