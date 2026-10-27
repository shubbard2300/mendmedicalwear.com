import {sanityClient} from '@/sanity/client'
import {dataset, missingEnv, projectId} from '@/sanity/env'

// Read at request time so the env check reflects the deployment's real environment, not the build's.
export const dynamic = 'force-dynamic'

export default async function Home() {
  const missing = missingEnv()
  let documents: number | null = null
  let error: string | null = null

  if (!missing.includes('NEXT_PUBLIC_SANITY_PROJECT_ID') && !missing.includes('NEXT_PUBLIC_SANITY_DATASET')) {
    try {
      documents = await sanityClient().fetch<number>('count(*)')
    } catch (e) {
      error = e instanceof Error ? e.message : 'Sanity request failed'
    }
  }

  return (
    <main>
      <h1>MEND next preview</h1>
      <p>Placeholder for the Next.js and Sanity port. The live site is unchanged.</p>
      <h2>Environment check</h2>
      <ul>
        <li>Missing variables: {missing.length ? missing.join(', ') : 'none'}</li>
        <li>
          Sanity project {projectId ?? 'unset'}, dataset {dataset ?? 'unset'}
        </li>
        <li>Documents in that dataset: {documents ?? 'not checked'}</li>
        {error && <li>Sanity error: {error}</li>}
      </ul>
    </main>
  )
}
