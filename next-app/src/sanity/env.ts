// Env names only; values come from Vercel (Preview) or a local .env.local that is never committed.
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
export const readToken = process.env.SANITY_API_READ_TOKEN
export const revalidateSecret = process.env.SANITY_REVALIDATE_SECRET
export const apiVersion = '2025-02-19'
