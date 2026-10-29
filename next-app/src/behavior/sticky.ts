// Ported from main.js (P4b): the persistent floating Reserve button. Live opts a page in with `<body data-sticky-cta>`; the product
// pages add `data-sticky-cta-product="…"` (the product the Reserve form locks) and the device pages `data-sticky-cta-type="waitlist"`
// (a device pending FDA 510(k) may be advertised but must not take orders, FDA CPG 300.600, so its button opens the waitlist).
// Those attributes were page configuration, not content, so they live here as a table keyed by path and are set on <body> at runtime,
// which leaves the page as live has it. Styles are injected, as live does: the Pulse, Oxi and App pages never load styles.css.
// scripts/migrate/lead_golden.mjs checks this table against the live <body> tags.
import type {Cleanup} from './shared'

export const STICKY_PAGES: Record<string, {product?: string; waitlist?: boolean}> = {
  '/': {},
  '/FAQ': {},
  '/Privacy-Terms': {},
  '/products/stylish-washable-hospital-gown': {product: 'Comfort Wrap — The Stylish Washable Hospital Gown'},
  '/products/residential-nurse-scrub-set': {product: 'Comfort Scrubs — Residential Nurse Set'},
  '/products/compression-socks': {product: 'Medical-Grade Compression Socks — Nurse/Caregiver Edition'},
  '/products/airguard-collar': {waitlist: true, product: 'AirGuard™ Fall-Detection Collar'},
  '/products/mend-pulse': {waitlist: true, product: 'MEND Pulse — Wireless BP Monitor'},
  '/products/mend-oxi': {waitlist: true, product: 'MEND Oxi — Fingertip Pulse Oximeter'},
  '/products/mend-app': {waitlist: true, product: 'MEND App — The Hub of Connected Care'},
}

const CSS = [
  '.mend-sticky-cta{',
  '  position:fixed; z-index:900; cursor:pointer; border:none; font-family:"Inter",Helvetica,Arial,sans-serif; font-weight:700;',
  '  letter-spacing:.04em; text-transform:uppercase; background:#7C8B7A; color:#fff;',
  '  box-shadow:0 14px 34px rgba(0,0,0,.22);',
  '  transition:transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s ease, background .2s ease, box-shadow .25s ease;',
  '  opacity:0; pointer-events:none;',
  '}',
  '.mend-sticky-cta.show{opacity:1; pointer-events:auto;}',
  '.mend-sticky-cta:hover{background:#677866; box-shadow:0 18px 40px rgba(0,0,0,.3);}',
  '@media(min-width:641px){',
  '  .mend-sticky-cta{left:24px; bottom:24px; padding:15px 28px; border-radius:999px; font-size:13px; transform:translateY(14px) scale(.94);}',
  '  .mend-sticky-cta.show{transform:translateY(0) scale(1);}',
  '  .mend-sticky-cta .sticky-cta-mobile{display:none;}',
  '}',
  '@media(max-width:640px){',
  '  .mend-sticky-cta{left:0; right:0; bottom:0; width:100%; padding:16px; font-size:14px; border-radius:0; box-shadow:0 -8px 24px rgba(0,0,0,.16); transform:translateY(100%); padding-bottom:calc(16px + env(safe-area-inset-bottom));}',
  '  .mend-sticky-cta.show{transform:translateY(0);}',
  '  .mend-sticky-cta .sticky-cta-desktop{display:none;}',
  '}',
  '@media (prefers-reduced-motion: reduce){ .mend-sticky-cta{transition:opacity .15s linear !important; transform:none !important;} }',
].join('\n')

// Runs after initModals, which creates the overlay this hides behind.
export function initSticky(): Cleanup {
  const page = STICKY_PAGES[location.pathname]
  if (!page) return () => {}

  const body = document.body
  body.setAttribute('data-sticky-cta', '')
  if (page.waitlist) body.setAttribute('data-sticky-cta-type', 'waitlist')
  if (page.product) body.setAttribute('data-sticky-cta-product', page.product)

  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  const product = page.product || ''
  const waitlist = !!page.waitlist

  const btn = document.createElement('button')
  btn.type = 'button'
  btn.className = 'mend-sticky-cta'
  btn.setAttribute('data-modal', waitlist ? 'waitlist' : 'reserve')
  if (product) btn.setAttribute('data-product', product)
  btn.setAttribute('aria-label', waitlist ? 'Join the waitlist' : 'Reserve your order')
  btn.innerHTML = waitlist
    ? '<span class="sticky-cta-desktop">Join the Waitlist</span><span class="sticky-cta-mobile">Join the Waitlist</span>'
    : '<span class="sticky-cta-desktop">Reserve Your Order</span><span class="sticky-cta-mobile">Pre-Order Now</span>'
  body.appendChild(btn)

  const toggle = () => {
    btn.classList.toggle('show', window.scrollY > 400)
  }
  window.addEventListener('scroll', toggle, {passive: true})
  toggle()

  // Hide while any modal is open so it never stacks visually above the overlay.
  const overlayEl = document.querySelector('.mend-modal-overlay')
  const observer = new MutationObserver(() => {
    btn.style.display = overlayEl && overlayEl.classList.contains('mend-open') ? 'none' : ''
  })
  if (overlayEl) observer.observe(overlayEl, {attributes: true, attributeFilter: ['class']})

  return () => {
    observer.disconnect()
    window.removeEventListener('scroll', toggle)
    btn.remove()
    style.remove()
    body.removeAttribute('data-sticky-cta')
    body.removeAttribute('data-sticky-cta-type')
    body.removeAttribute('data-sticky-cta-product')
  }
}
