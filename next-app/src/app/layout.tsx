import type {Metadata} from 'next'

// P1 placeholder. Real metadata, fonts and JSON-LD arrive in P3. Not indexable while this is a preview.
export const metadata: Metadata = {
  title: 'MEND next preview',
  robots: {index: false, follow: false},
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body style={{fontFamily: 'system-ui, sans-serif', margin: 0, padding: '2rem', maxWidth: 40 + 'rem'}}>{children}</body>
    </html>
  )
}
