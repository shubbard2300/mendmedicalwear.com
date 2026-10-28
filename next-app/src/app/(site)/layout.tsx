import type {Metadata} from 'next'
import {Behavior} from '@/components/Behavior'
import {SiteHead} from '@/components/SiteHead'
import '@/styles/styles.css'

// P3b shell for the pages that use the shared stylesheet: home, FAQ, legal, Facilities and the four product-detail pages.
// Per-page metadata and JSON-LD arrive in P3e; until then the preview stays out of search indexes.
export const metadata: Metadata = {
  title: 'MEND next preview',
  robots: {index: false, follow: false},
}

export default function SiteLayout({children}: {children: React.ReactNode}) {
  return (
    // suppressHydrationWarning: the head script adds the `js` class to <html>, which React did not render.
    <html lang="en" suppressHydrationWarning>
      <head>
        <SiteHead jsClass />
      </head>
      <body>
        {children}
        <Behavior kind="site" />
      </body>
    </html>
  )
}
