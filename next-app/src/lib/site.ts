export const SITE_URL = 'https://www.mendmedicalwear.com'

// Previews stay out of search indexes: every page says noindex, nofollow. Only a Production deployment is indexable (P8, D46).
export const INDEXABLE = process.env.VERCEL_ENV === 'production'
