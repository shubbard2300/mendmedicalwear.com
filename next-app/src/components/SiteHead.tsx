// Head pieces the three root layouts share (P3b). The icon links and the font preload follow the live home page; the live pages
// carry partial or relative icon sets, which resolve wrongly on nested paths, so every layout uses the home page's five.
// The Google Analytics tag is the exact live text (the same on all 11 pages that carry it). The Fall Risk layout turns it off,
// as the live Fall Risk page has none.
const GA_ID = 'G-XT2M4KBL2R'
const GA_CONFIG = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`

export function SiteHead({analytics = true, preloadFont = true}: {analytics?: boolean; preloadFont?: boolean}) {
  return (
    <>
      {analytics && (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script dangerouslySetInnerHTML={{__html: GA_CONFIG}} />
        </>
      )}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      {preloadFont && <link rel="preload" href="/inter-latin-v20.woff2" as="font" type="font/woff2" crossOrigin="" />}
    </>
  )
}
