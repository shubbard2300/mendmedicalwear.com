import {preload} from 'react-dom'

// Head pieces the three root layouts share (P3b). The icon links follow the live home page; the live pages carry partial or
// relative icon sets, which resolve wrongly on nested paths, so every layout uses the home page's five.
// The Google Analytics tag is the exact live text (the same on all 11 pages that carry it). The Fall Risk layout turns it off,
// as the live Fall Risk page has none. The Inter preload goes through React's preload() so it is emitted exactly once (a <link> in
// this tree is emitted twice, once hoisted and once in place).
const GA_ID = 'G-XT2M4KBL2R'
// gtag.js is added after the page's load event (P11): its 140 to 170 ms of script time otherwise lands on the main thread before the
// first photo is painted. The gtag() queue above it is unchanged, so the config and every event wait in dataLayer and none is lost.
const GA_CONFIG = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');window.addEventListener('load',function(){setTimeout(function(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${GA_ID}';document.head.appendChild(s)},0)});`

// The scroll reveal also starts here, as soon as the page is parsed, as main.js does on live. Waiting for the behavior layer to hydrate (P4a)
// kept the sections invisible 1.3 to 3.3 s longer than live; the layer's own reveal stays as a fallback.
const JS_CLASS_AND_REVEAL =
  'document.documentElement.classList.add("js");' +
  'document.addEventListener("DOMContentLoaded",function(){var o=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in-view");o.unobserve(e.target)}})},{threshold:0});document.querySelectorAll(".section").forEach(function(el){o.observe(el)})})'

export function SiteHead({analytics = true, preloadFont = true, jsClass = false}: {analytics?: boolean; preloadFont?: boolean; jsClass?: boolean}) {
  if (preloadFont) preload('/inter-latin-v20.woff2', {as: 'font', type: 'font/woff2', crossOrigin: 'anonymous'})
  return (
    <>
      {analytics && <script dangerouslySetInnerHTML={{__html: GA_CONFIG}} />}
      {/* The shared CSS hides the scroll-reveal sections under .js until the behavior reveals them (P4a); live sets the class here too. */}
      {jsClass && <script dangerouslySetInnerHTML={{__html: JS_CLASS_AND_REVEAL}} />}
      <link rel="icon" href="/favicon.ico" sizes="any" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    </>
  )
}
