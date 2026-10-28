import type {NextConfig} from 'next'

// What vercel.json did (redirects and security headers), moved here in P3e, plus a long cache on the two versioned font files.
// The apex-to-www and http-to-https redirects stay Vercel domain settings.
const LEGACY: [name: string, slug: string][] = [
  ['Product Detail - AirGuard Collar', 'airguard-collar'],
  ['Product Detail - Compression Socks', 'compression-socks'],
  ['Product Detail - MEND App', 'mend-app'],
  ['Product Detail - MEND Oxi', 'mend-oxi'],
  ['Product Detail - MEND Pulse', 'mend-pulse'],
  ['Product Detail - Residential Nurse Scrub Set', 'residential-nurse-scrub-set'],
  ['Product Detail - Stylish Washable Hospital Gown', 'stylish-washable-hospital-gown'],
]

const SECURITY = [
  {key: 'X-Content-Type-Options', value: 'nosniff'},
  {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
  {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
  {key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=(), interest-cohort=()'},
]

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {remotePatterns: [{protocol: 'https', hostname: 'cdn.sanity.io'}]},
  async redirects() {
    return [
      // vercel.json lists each legacy name twice, with spaces and with %20; both are kept.
      ...LEGACY.flatMap(([name, slug]) =>
        [name, name.replaceAll(' ', '%20')].map((from) => ({source: `/${from}`, destination: `/products/${slug}`, permanent: true})),
      ),
      // cleanUrls on the live site: any .html name redirects to the clean URL (index.html to the home page).
      {source: '/index.html', destination: '/', permanent: true},
      {source: '/:path+.html', destination: '/:path+', permanent: true},
    ]
  },
  async headers() {
    return [
      {source: '/:path*', headers: SECURITY},
      // The font file names carry their version, so they can be cached for a year. With max-age=0 the browser revalidates the font on
      // every load, and Chrome then warns that the preloaded font "was not used" (the live site does the same today).
      ...['inter-latin-v20.woff2', 'inter-latin-ext-v20.woff2'].map((file) => ({
        source: `/${file}`,
        headers: [{key: 'Cache-Control', value: 'public, max-age=31536000, immutable'}],
      })),
    ]
  },
}

export default nextConfig
