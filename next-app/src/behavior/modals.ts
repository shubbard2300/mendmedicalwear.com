// Ported from main.js (P4b): the lead-capture dialogs (Reserve, Waitlist, Facility Quote, Demo, Distributor, Updates), their submit
// handler, the Contact form and the "#contact" anchor that opens it in a dialog. Any element with data-modal="type" [data-product="…"]
// opens the matching form. The dialog's CSS is injected here, as live does, because several pages never load styles.css.
// Left out: the FAQ and Privacy & Terms sources. Live's links to them are /FAQ and /Privacy-Terms, which that code never matched.
import {leadSource, type Cleanup} from './shared'

type Field = {name: string; label: string; type: string; required?: boolean; value?: string; readonly?: boolean; min?: string; max?: string; placeholder?: string; options?: string[]}
type Form = {eyebrow: string; title: string; subtitle: string; submitLabel: string; successTitle: string; successBody: string; fields: (ctx: {product: string}) => Field[]}

function gtag(...args: unknown[]) {
  const g = (window as unknown as {gtag?: (...a: unknown[]) => void}).gtag
  if (g) g(...args)
}

// Same wording is hardcoded under the home page's contact form. The link is /Privacy-Terms, so it never opens the policy over the form.
const PRIVACY_NOTE = '<p class="mend-form-privacy">We never sell your information or share it for marketing — we use it only to follow up with you. <a href="/Privacy-Terms" target="_blank" rel="noopener">Privacy &amp; Terms</a></p>'

// The color/size (and gown closure) the visitor picked on a product page's option buttons; each is '' on pages without that picker.
function pageSelection() {
  const pick = (selector: string) => {
    const el = document.querySelector(selector)
    return el ? (el.getAttribute('title') || el.textContent || '').trim() : ''
  }
  return {
    color: pick('.swatches .swatch.active'),
    size: pick('.sizes:not(#closureGroup) .size-btn.active'),
    closure: pick('#closureGroup .size-btn.active'),
  }
}

// Lead-capture form modals. Each `fields` function receives the trigger's context (currently just { product }) so a Reserve button on
// a specific product card can pre-fill and lock that field.
const OPT_IN: Field = {name: 'marketingOptIn', label: 'Email me occasional MEND updates. Unsubscribe anytime.', type: 'checkbox'}

const MODAL_FORMS: Record<string, Form> = {
  reserve: {
    eyebrow: 'Founding Customer Program',
    title: 'Reserve Your Order',
    subtitle: 'No payment today. Reserving a spot puts you in our first production run and locks in founding-customer pricing — we’ll email you when it’s time to confirm and pay.',
    submitLabel: 'Reserve My Spot',
    successTitle: 'You’re reserved.',
    successBody: 'You’re on the founding customer list, and a confirmation is on its way to your inbox. We’ll follow up as your order nears production.',
    fields: (ctx) => {
      const sel = pageSelection() as Record<string, string>
      const picks: Field[] = [
        ['color', 'Color'],
        ['size', 'Size'],
        ['closure', 'Closure'],
      ]
        .filter((p) => sel[p[0]])
        .map((p) => ({name: p[0], label: p[1], type: 'text', value: sel[p[0]], readonly: true}))
      return [
        {name: 'product', label: 'Product', type: 'text', value: ctx.product || 'MEND Products (not sure yet)', readonly: !!ctx.product},
        ...picks,
        {name: 'quantity', label: 'Quantity', type: 'number', value: '1', min: '1', max: '999'},
        {name: 'name', label: 'Full Name', type: 'text', required: true},
        {name: 'email', label: 'Email', type: 'email', required: true},
        {name: 'phone', label: 'Phone (optional)', type: 'tel'},
        {name: 'procedureDate', label: 'Surgery / procedure date (optional)', type: 'date'},
        {name: 'buyingFor', label: 'Who is this for? (optional)', type: 'select', options: ['Myself', 'A loved one', 'My patients or facility']},
        {name: 'heardAbout', label: 'How did you hear about us? (optional)', type: 'select', options: ['Instagram', 'Facebook', 'TikTok', 'LinkedIn', 'Google search', 'Friend or family', 'Event or convention', 'Other']},
        OPT_IN,
      ]
    },
  },
  waitlist: {
    eyebrow: 'Early Access',
    title: 'Join the Waitlist',
    subtitle: 'Be first to know the moment this product is ready to order.',
    submitLabel: 'Join Waitlist',
    successTitle: 'You’re on the list.',
    successBody: 'A confirmation is on its way to your inbox. We’ll email you as soon as this is available.',
    fields: (ctx) => [
      {name: 'product', label: 'Product', type: 'text', value: ctx.product || '', readonly: !!ctx.product},
      {name: 'name', label: 'Full Name', type: 'text', required: true},
      {name: 'email', label: 'Email', type: 'email', required: true},
      OPT_IN,
    ],
  },
  facilityQuote: {
    eyebrow: 'Healthcare Facilities',
    title: 'Request Facility Pricing',
    subtitle: 'Hospitals, surgery centers, clinics, and recovery centers get volume pricing and priority in our manufacturing queue.',
    submitLabel: 'Request Quote',
    successTitle: 'Request received.',
    successBody: 'Our team will follow up within one business day with facility pricing.',
    fields: () => [
      {name: 'facility', label: 'Facility Name', type: 'text', required: true},
      {name: 'facilityType', label: 'Facility Type', type: 'select', required: true, options: ['Hospital', 'Surgery Center', 'Clinic', 'Recovery Center', 'Other']},
      {name: 'name', label: 'Your Name', type: 'text', required: true},
      {name: 'role', label: 'Role / Title', type: 'text'},
      {name: 'email', label: 'Email', type: 'email', required: true},
      {name: 'phone', label: 'Phone', type: 'tel'},
      {name: 'estimatedUnits', label: 'Estimated Units Needed', type: 'select', options: ['Under 50', '50–200', '200–500', '500+']},
    ],
  },
  demo: {
    eyebrow: 'Healthcare Facilities',
    title: 'Schedule a Demo',
    subtitle: 'See MEND in action and talk through fit for your facility.',
    submitLabel: 'Request Demo',
    successTitle: 'Thanks — request received.',
    successBody: 'Our team will reach out to find a time that works for you.',
    fields: () => [
      {name: 'facility', label: 'Facility / Organization', type: 'text', required: true},
      {name: 'name', label: 'Your Name', type: 'text', required: true},
      {name: 'email', label: 'Email', type: 'email', required: true},
      {name: 'phone', label: 'Phone', type: 'tel'},
      {name: 'preferredTime', label: 'Preferred time (optional)', type: 'text', placeholder: 'e.g. weekday mornings'},
    ],
  },
  distributor: {
    eyebrow: 'Companies & Distributors',
    title: 'Become a Distribution Partner',
    subtitle: 'Medical distributors, retailers, medical supply companies, home health organizations, and physical therapy practices — let’s talk wholesale.',
    submitLabel: 'Submit Application',
    successTitle: 'Application received.',
    successBody: 'Our partnerships team will review your application and follow up shortly.',
    fields: () => [
      {name: 'company', label: 'Company Name', type: 'text', required: true},
      {name: 'businessType', label: 'Business Type', type: 'select', required: true, options: ['Medical Distributor', 'Retailer', 'Medical Supply Company', 'Home Health Organization', 'Physical Therapy Practice', 'Other']},
      {name: 'name', label: 'Your Name', type: 'text', required: true},
      {name: 'email', label: 'Email', type: 'email', required: true},
      {name: 'phone', label: 'Phone', type: 'tel'},
      {name: 'website', label: 'Company Website', type: 'text'},
      {name: 'region', label: 'Region Served', type: 'text'},
    ],
  },
  newsletter: {
    eyebrow: 'Stay in the Loop',
    title: 'Get Manufacturing Updates',
    subtitle: 'Short, occasional emails as we move through production — no spam.',
    submitLabel: 'Sign Up',
    successTitle: 'You’re subscribed.',
    successBody: 'Watch your inbox for updates as we get closer to launch.',
    fields: () => [{name: 'email', label: 'Email', type: 'email', required: true}],
  },
}

const CSS = [
  // Self-contained palette so extracted content (which uses var(--accent) etc.)
  // renders correctly even on pages that never loaded styles.css.
  '.mend-modal-panel{--bg:#FAFAF8; --fg:#2B2B28; --muted:#706C64; --line:#E3DFD6; --accent:#7C8B7A; --accent-dark:#60705F; --panel:#F1EEE7;}',
  '.mend-modal-overlay{position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-start; justify-content:center;',
  '  padding:6vh 20px; background:rgba(30,28,24,0); overflow-y:auto; opacity:0; pointer-events:none;',
  '  transition:opacity .3s ease, background .3s ease;}',
  '.mend-modal-overlay.mend-open{opacity:1; pointer-events:auto; background:rgba(30,28,24,.5);}',
  '.mend-modal-panel{position:relative; background:var(--bg); color:var(--fg); width:100%; max-width:720px; border-radius:20px;',
  '  padding:44px 40px 56px; box-shadow:0 30px 80px rgba(0,0,0,.28); transform:translateY(18px) scale(.98); opacity:0;',
  '  transition:transform .35s cubic-bezier(.2,.7,.2,1), opacity .3s ease; font-family:"Inter",Helvetica,Arial,sans-serif;}',
  '.mend-modal-overlay.mend-open .mend-modal-panel{transform:translateY(0) scale(1); opacity:1;}',
  '.mend-modal-panel .wrap{max-width:none; padding:0; margin:0;}',
  '.mend-modal-close{position:absolute; top:18px; right:18px; width:36px; height:36px; border-radius:50%; border:1px solid var(--line);',
  '  background:#fff; color:var(--fg); font-size:18px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center;',
  '  transition:transform .2s ease, border-color .2s ease, color .2s ease;}',
  '.mend-modal-close:hover{transform:rotate(90deg); border-color:var(--accent); color:var(--accent);}',
  '.mend-modal-loading{padding:60px 0; text-align:center; color:var(--muted); font-size:14px;}',
  '.mend-modal-panel .page-hero{padding-top:0; margin-top:0;}',
  // Contact form, scoped to the modal panel only — never leaks onto the
  // host page's own forms/inputs (several PDPs have their own).
  '.mend-modal-panel .contact-grid{display:grid; grid-template-columns:1fr 1fr; gap:40px;}',
  '@media(max-width:640px){.mend-modal-panel .contact-grid{grid-template-columns:1fr;}}',
  '.mend-modal-panel .contact-grid h2{font-size:24px; font-weight:600; margin-bottom:12px;}',
  '.mend-modal-panel .contact-grid > div > p{color:var(--muted); font-size:15px; margin-bottom:8px;}',
  '.mend-modal-panel .detail{font-size:14px; margin-top:20px; padding:12px 14px; border-radius:10px; border:1px solid var(--line);}',
  '.mend-modal-panel .detail strong{display:block; color:var(--fg); margin-bottom:4px;}',
  '.mend-modal-panel form{display:flex; flex-direction:column; gap:14px;}',
  '.mend-modal-panel label{font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:6px; display:block;}',
  '.mend-modal-panel input, .mend-modal-panel textarea, .mend-modal-panel select{width:100%; padding:12px 14px; border-radius:8px; border:1px solid var(--line); background:var(--panel); color:var(--fg); font-family:inherit; font-size:14px;}',
  '.mend-modal-panel input:focus, .mend-modal-panel textarea:focus, .mend-modal-panel select:focus{outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(124,139,122,.15);}',
  '.mend-modal-panel input[readonly]{color:var(--muted); cursor:not-allowed;}',
  '.mend-modal-panel textarea{resize:vertical; min-height:110px;}',
  '.mend-modal-panel .form-msg{font-size:13px; color:var(--accent-dark); display:none; margin-top:8px;}',
  '.mend-modal-panel .form-msg.show{display:block;}',
  // Lead-capture form modals (Reserve, Waitlist, Facility Quote, etc.)
  '.mend-lead-eyebrow{font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent-dark); font-weight:600; margin-bottom:10px;}',
  '.mend-modal-panel .mend-lead-title{font-size:26px; font-weight:600; margin-bottom:8px; line-height:1.2;}',
  '.mend-lead-subtitle{color:var(--muted); font-size:14px; line-height:1.6; margin-bottom:24px;}',
  '.mend-lead-form{display:flex; flex-direction:column; gap:14px;}',
  '.mend-lead-form .mend-lead-row{display:grid; grid-template-columns:1fr 1fr; gap:14px;}',
  '@media(max-width:480px){.mend-lead-form .mend-lead-row{grid-template-columns:1fr;}}',
  '.mend-lead-form button[type="submit"]{margin-top:6px;}',
  '.mend-lead-form select{appearance:none; background-image:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%238A857C" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>\'); background-repeat:no-repeat; background-position:right 14px center;}',
  // Honeypot: off-screen, not display:none (some bots skip hidden inputs).
  '.mend-hp{position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;}',
  // Scoped to outrank ".mend-modal-panel label" (uppercase field-label style).
  '.mend-modal-panel label.mend-optin{display:flex; gap:10px; align-items:flex-start; font-size:14px; line-height:1.5; color:var(--fg); text-transform:none; letter-spacing:0; cursor:pointer; margin:4px 0 0;}',
  '.mend-modal-panel .mend-optin input{width:18px; height:18px; margin:1px 0 0; padding:0; flex-shrink:0; accent-color:var(--accent-dark);}',
  '.mend-form-error{font-size:13px; color:#c0392b; display:none; margin-top:2px;}',
  '.mend-form-error.show{display:block;}',
  // Not scoped to the modal: the home page's own contact form carries it too.
  '.mend-form-privacy{font-size:12px; line-height:1.5; color:#6B675F; margin:0;}',
  '.mend-form-privacy a{color:inherit; text-decoration:underline;}',
  '.mend-form-success{text-align:center; padding:12px 0 4px;}',
  '.mend-success-check{width:52px; height:52px; border-radius:50%; background:var(--accent); color:#fff; font-size:24px; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; animation:mend-success-pop .5s cubic-bezier(.34,1.56,.64,1);}',
  '@keyframes mend-success-pop{0%{opacity:0; transform:scale(.6);} 60%{opacity:1; transform:scale(1.08);} 100%{opacity:1; transform:scale(1);}}',
  '.mend-form-success h2{font-size:22px; font-weight:600; margin-bottom:10px;}',
  '.mend-form-success p{color:var(--muted); font-size:14px; margin-bottom:22px;}',
  '@media(max-width:640px){.mend-modal-panel{padding:36px 22px 44px; border-radius:16px;}}',
  '@media (prefers-reduced-motion: reduce){',
  '  .mend-modal-overlay, .mend-modal-panel, .mend-success-check{transition:none !important; animation:none !important;}',
  '}',
].join('\n')

// After a pre-order, offer a share link: the people most likely to reserve next know someone with a surgery coming up. The UTM tags
// show up in their lead's source.
const SHARE_URL = 'https://www.mendmedicalwear.com/?utm_source=referral&utm_medium=share&utm_campaign=reserve'

function esc(s: unknown): string {
  return String(s).replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[c] as string)
}

function renderField(f: Field): string {
  const id = 'mendField_' + f.name
  const req = f.required ? ' required' : ''
  if (f.type === 'checkbox') {
    // Unchecked by default: marketing email needs an explicit yes. Absent = "No" server-side.
    return '<div><label class="mend-optin" for="' + id + '"><input type="checkbox" id="' + id + '" name="' + f.name + '" value="Yes"><span>' + esc(f.label) + '</span></label></div>'
  }
  if (f.type === 'select') {
    const opts = (f.options || []).map((o) => '<option value="' + esc(o) + '">' + esc(o) + '</option>').join('')
    return '<div><label for="' + id + '">' + esc(f.label) + '</label><select id="' + id + '" name="' + f.name + '"' + req + '><option value="">Select…</option>' + opts + '</select></div>'
  }
  let attrs = 'id="' + id + '" name="' + f.name + '" type="' + f.type + '"' + req
  if (f.value) attrs += ' value="' + esc(f.value) + '"'
  if (f.readonly) attrs += ' readonly'
  if (f.min) attrs += ' min="' + f.min + '"'
  if (f.max) attrs += ' max="' + f.max + '"'
  if (f.placeholder) attrs += ' placeholder="' + esc(f.placeholder) + '"'
  return '<div><label for="' + id + '">' + esc(f.label) + '</label><input ' + attrs + '></div>'
}

function listen(cleanups: Cleanup[], target: EventTarget, type: string, fn: EventListener) {
  target.addEventListener(type, fn)
  cleanups.push(() => target.removeEventListener(type, fn))
}

export function initModals(): Cleanup {
  const cleanups: Cleanup[] = []

  const style = document.createElement('style')
  style.textContent = CSS
  document.head.appendChild(style)

  const overlay = document.createElement('div')
  overlay.className = 'mend-modal-overlay'
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.innerHTML = '<div class="mend-modal-panel"><button type="button" class="mend-modal-close" aria-label="Close">✕</button><div class="mend-modal-body"><div class="mend-modal-loading">Loading…</div></div></div>'
  document.body.appendChild(overlay)

  const panel = overlay.querySelector<HTMLElement>('.mend-modal-panel')!
  const panelBody = overlay.querySelector<HTMLElement>('.mend-modal-body')!
  const closeButton = overlay.querySelector<HTMLElement>('.mend-modal-close')!
  let lastFocused: HTMLElement | null = null

  const closeModal = () => {
    overlay.classList.remove('mend-open')
    overlay.removeAttribute('aria-labelledby')
    overlay.removeAttribute('aria-label')
    document.body.style.overflow = ''
    if (lastFocused) lastFocused.focus()
  }

  // Basic focus trap: Tab/Shift+Tab cycle within the panel while it's open.
  listen(cleanups, panel, 'keydown', (ev) => {
    const e = ev as KeyboardEvent
    if (e.key !== 'Tab') return
    const focusable = panel.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  })

  // The Contact dialog: the home page's #contact section, fetched and copied in.
  const openContact = () => {
    const label = 'Get in Touch'
    lastFocused = document.activeElement as HTMLElement | null
    panelBody.innerHTML = '<div class="mend-modal-loading">Loading…</div>'
    overlay.setAttribute('aria-label', label)
    overlay.classList.add('mend-open')
    document.body.style.overflow = 'hidden'
    closeButton.focus()
    gtag('event', 'modal_open', {modal_type: label})

    fetch('/')
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed')
        return res.text()
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        const content = doc.querySelector('#contact')
        panelBody.innerHTML = content ? content.innerHTML : '<p>Sorry, something went wrong loading "' + label + '".</p>'
        panelBody.querySelectorAll('.section').forEach((el) => el.classList.add('in-view'))
      })
      .catch(() => {
        window.location.href = '/'
      })
  }

  const openFormModal = (type: string, ctx?: {product: string}) => {
    const cfg = MODAL_FORMS[type]
    if (!cfg) return
    lastFocused = document.activeElement as HTMLElement | null
    const fields = cfg.fields(ctx || {product: ''}).map(renderField).join('')
    const titleId = 'mendModalTitle'
    panelBody.innerHTML = [
      '<div class="mend-lead-eyebrow">' + esc(cfg.eyebrow) + '</div>',
      '<h2 class="mend-lead-title" id="' + titleId + '">' + esc(cfg.title) + '</h2>',
      '<p class="mend-lead-subtitle">' + esc(cfg.subtitle) + '</p>',
      '<form class="mend-lead-form" data-lead-type="' + esc(type) + '">',
      fields,
      // Honeypot. Name and label must not look like anything browser autofill fills
      // (the first version was "Company"/hp_company, and Chrome autofilled it).
      '<div class="mend-hp" aria-hidden="true"><label for="mendField_trap">Leave this field empty</label><input id="mendField_trap" name="mend_trap" type="text" tabindex="-1" autocomplete="new-password"></div>',
      '<button type="submit" class="btn btn-primary">' + esc(cfg.submitLabel) + '</button>',
      '<div class="mend-form-error" role="alert"></div>',
      PRIVACY_NOTE,
      '</form>',
    ].join('')
    overlay.removeAttribute('aria-label')
    overlay.setAttribute('aria-labelledby', titleId)
    overlay.classList.add('mend-open')
    document.body.style.overflow = 'hidden'
    const firstField = panelBody.querySelector<HTMLElement>('input:not([readonly]), select')
    ;(firstField || closeButton).focus()
    gtag('event', 'modal_open', {modal_type: type})
  }

  const showFormSuccess = (cfg: Form, type: string) => {
    const share = type === 'reserve'
    panelBody.innerHTML = [
      '<div class="mend-form-success">',
      '<div class="mend-success-check">✓</div>',
      '<h2>' + esc(cfg.successTitle) + '</h2>',
      '<p>' + esc(cfg.successBody) + '</p>',
      share ? '<p>Know someone with a surgery or hospital stay coming up?</p><button type="button" class="btn btn-primary mend-share" style="margin:0 8px 12px 0;">Share MEND</button>' : '',
      '<button type="button" class="btn btn-secondary mend-modal-done">Close</button>',
      '</div>',
    ].join('')
    const shareBtn = panelBody.querySelector<HTMLElement>('.mend-share')
    if (shareBtn)
      shareBtn.addEventListener('click', () => {
        const native = !!navigator.share
        gtag('event', 'share', {method: native ? 'native' : 'copy', content_type: 'reserve'})
        if (native) {
          navigator.share({title: 'MEND Medical Apparel', text: 'Recovery gowns that actually close. Reserve with no payment.', url: SHARE_URL}).catch(() => {})
        } else if (navigator.clipboard) {
          navigator.clipboard.writeText(SHARE_URL).then(() => {
            shareBtn.textContent = 'Link copied'
          })
        }
      })
    ;(shareBtn || panelBody.querySelector<HTMLElement>('.mend-modal-done'))!.focus()
  }

  listen(cleanups, overlay, 'click', (e) => {
    const t = e.target as Element
    if (t === overlay || t.closest('.mend-modal-close') || t.closest('.mend-modal-done')) closeModal()
  })
  listen(cleanups, document, 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape' && overlay.classList.contains('mend-open')) closeModal()
  })

  // The "#contact" link opens the Contact dialog.
  listen(cleanups, document, 'click', (e) => {
    const a = (e.target as Element).closest('a[href]')
    if (!a || a.getAttribute('href') !== '#contact') return
    e.preventDefault()
    openContact()
  })

  // Lead-capture modals via data-modal="type" [data-product="…"].
  listen(cleanups, document, 'click', (e) => {
    const trigger = (e.target as Element).closest('[data-modal]')
    if (!trigger) return
    e.preventDefault()
    openFormModal(trigger.getAttribute('data-modal') || '', {product: trigger.getAttribute('data-product') || ''})
  })

  // Contact form → /api/lead. Delegated so it works whether #contactForm is the original section on the home page or the copy in the dialog.
  listen(cleanups, document, 'submit', (e) => {
    const form = e.target as HTMLFormElement
    if (form.id !== 'contactForm') return
    e.preventDefault()
    const msg = form.querySelector('#formMsg')!
    const err = form.querySelector('#formError')!
    const btn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | null)?.value
    msg.classList.remove('show')
    err.classList.remove('show')
    btn.disabled = true

    const data = {
      type: 'contact',
      page: location.pathname,
      name: value('name'),
      email: value('email'),
      message: value('message'),
      mend_trap: value('mend_trap') ?? '',
      source: leadSource(),
    }

    fetch('/api/lead', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        msg.classList.add('show')
        form.reset()
      })
      .catch(() => {
        err.classList.add('show')
      })
      .finally(() => {
        btn.disabled = false
      })
  })

  // Lead-capture form submissions → /api/lead.
  listen(cleanups, document, 'submit', (e) => {
    const form = (e.target as Element).closest<HTMLFormElement>('.mend-lead-form')
    if (!form) return
    e.preventDefault()
    const type = form.getAttribute('data-lead-type') || ''
    const cfg = MODAL_FORMS[type]
    const errorEl = form.querySelector('.mend-form-error')!
    const submitBtn = form.querySelector<HTMLButtonElement>('button[type="submit"]')!
    errorEl.classList.remove('show')
    submitBtn.disabled = true

    const data: Record<string, unknown> = {type, page: location.pathname, source: leadSource()}
    new FormData(form).forEach((value, key) => {
      data[key] = value
    })

    fetch('/api/lead', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(data),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Request failed')
        gtag('event', 'lead_submit', {modal_type: type})
        gtag('event', 'generate_lead', {lead_type: type})
        showFormSuccess(cfg, type)
      })
      .catch(() => {
        errorEl.textContent = 'Something went wrong — please try again.'
        errorEl.classList.add('show')
        submitBtn.disabled = false
      })
  })

  const w = window as unknown as {MendModal?: unknown}
  w.MendModal = {open: openFormModal, close: closeModal}

  cleanups.push(() => {
    delete w.MendModal
    document.body.style.overflow = ''
    overlay.remove()
    style.remove()
  })
  return () => cleanups.forEach((stop) => stop())
}
