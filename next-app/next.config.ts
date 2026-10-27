import type {NextConfig} from 'next'

// P1 scaffold. Redirects, security headers and the sitemap move over from vercel.json in P3.
const nextConfig: NextConfig = {
  images: {remotePatterns: [{protocol: 'https', hostname: 'cdn.sanity.io'}]},
}

export default nextConfig
