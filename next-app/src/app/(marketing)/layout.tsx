import type {Metadata} from 'next'
import {SiteHead} from '@/components/SiteHead'

// P3b shell for MEND App, Pulse and Oxi. These pages carry all their CSS inline and load none of the shared stylesheets, so this
// root layout imports no global CSS (each page imports its own file from src/styles/pages in P3d) and does not preload Inter.
export const metadata: Metadata = {
  title: 'MEND next preview',
  robots: {index: false, follow: false},
}

export default function MarketingLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <SiteHead preloadFont={false} />
      </head>
      <body>{children}</body>
    </html>
  )
}
