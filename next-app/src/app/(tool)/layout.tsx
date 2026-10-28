import type {Metadata} from 'next'
import {Behavior} from '@/components/Behavior'
import {SiteHead} from '@/components/SiteHead'
import '@/styles/styles.css'
import '@/styles/fall-risk.css'

// P3b shell for the Fall Risk page. The live page loads the shared stylesheet and the Fall Risk stylesheet and carries no
// Google Analytics tag, so this layout reproduces that.
export const metadata: Metadata = {
  title: 'MEND next preview',
  robots: {index: false, follow: false},
}

export default function ToolLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <SiteHead analytics={false} />
      </head>
      <body>
        {children}
        <Behavior kind="tool" />
      </body>
    </html>
  )
}
