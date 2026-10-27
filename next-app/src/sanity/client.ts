import 'server-only'
import {createClient} from 'next-sanity'
import {apiVersion, dataset, projectId, readToken} from './env'

/**
 * Server-only Sanity client. Published content goes through the CDN; draft content (preview) uses the
 * read token and bypasses the CDN. The token is never exposed to the browser: this module cannot be
 * imported from a client component.
 */
export function sanityClient({draft = false}: {draft?: boolean} = {}) {
  if (!projectId || !dataset) throw new Error('Sanity is not configured: NEXT_PUBLIC_SANITY_PROJECT_ID or NEXT_PUBLIC_SANITY_DATASET is unset')
  if (draft && !readToken) throw new Error('Draft reads need SANITY_API_READ_TOKEN')
  return createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: !draft,
    ...(draft ? {token: readToken, perspective: 'drafts' as const} : {}),
  })
}
