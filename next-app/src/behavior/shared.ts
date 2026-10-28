// Ported from main.js (P4a): what every page except Fall Risk gets. The server-rendered markup is unchanged; these functions attach to it
// in an effect and hand back a cleanup. Each is a no-op where its elements are missing, as on the live pages.
// Not here yet: the lead modals, forms and sticky button (P4b), the product pickers and the logo preview (P4c).

export type Cleanup = () => void

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

function listen(cleanups: Cleanup[], target: EventTarget, type: string, fn: EventListener, options?: AddEventListenerOptions) {
  target.addEventListener(type, fn, options)
  cleanups.push(() => target.removeEventListener(type, fn, options))
}

const all = (cleanups: Cleanup[]): Cleanup => () => cleanups.forEach((stop) => stop())

// Scroll reveal. threshold 0 (not a percentage) so a very tall section, such as Products stacked on a narrow phone, still reveals as
// soon as any part enters the viewport.
function initReveal(): Cleanup {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view')
          observer.unobserve(entry.target)
        }
      })
    },
    {threshold: 0},
  )
  document.querySelectorAll('.section').forEach((el) => observer.observe(el))
  return () => observer.disconnect()
}

// Scroll progress bar, and the glass header condensing once the page has scrolled past the hero.
function initScrollEffects(): Cleanup {
  const progressBar = document.createElement('div')
  progressBar.style.cssText = [
    'position:fixed',
    'top:0',
    'left:0',
    'height:2px',
    'width:0%',
    'background:linear-gradient(90deg, var(--accent-dark), var(--accent))',
    'z-index:999',
    'pointer-events:none',
    'transition:width .1s linear',
  ].join(';')
  document.body.appendChild(progressBar)
  const siteHeader = document.querySelector('header')
  const onScroll = () => {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    progressBar.style.width = Math.min(pct, 100) + '%'
    if (siteHeader) siteHeader.classList.toggle('is-scrolled', window.scrollY > 40)
  }
  window.addEventListener('scroll', onScroll, {passive: true})
  if (siteHeader) siteHeader.classList.toggle('is-scrolled', window.scrollY > 40)
  return () => {
    window.removeEventListener('scroll', onScroll)
    progressBar.remove()
  }
}

// Button ripple on click.
function initRipple(): Cleanup {
  const onClick = (e: Event) => {
    const click = e as MouseEvent
    const btn = (click.target as Element).closest<HTMLElement>('.btn')
    if (!btn) return
    const ripple = document.createElement('span')
    ripple.className = 'ripple'
    const size = Math.max(btn.offsetWidth, btn.offsetHeight)
    const rect = btn.getBoundingClientRect()
    ripple.style.cssText = [
      'position:absolute',
      'border-radius:50%',
      'background:rgba(255,255,255,.3)',
      'pointer-events:none',
      'transform:scale(0)',
      'animation:btn-ripple .55s linear',
      'width:' + size + 'px',
      'height:' + size + 'px',
      'left:' + (click.clientX - rect.left - size / 2) + 'px',
      'top:' + (click.clientY - rect.top - size / 2) + 'px',
    ].join(';')
    btn.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}

// Product card 3D tilt with a cursor-tracked spotlight glow, and the magnetic pull on primary buttons (skipped for reduced motion).
function initPointerEffects(): Cleanup {
  const cleanups: Cleanup[] = []
  document.querySelectorAll<HTMLElement>('.product-card').forEach((card) => {
    listen(cleanups, card, 'mousemove', (e) => {
      const m = e as MouseEvent
      const r = card.getBoundingClientRect()
      const px = (m.clientX - r.left) / r.width
      const py = (m.clientY - r.top) / r.height
      const rx = (py - 0.5) * -10
      const ry = (px - 0.5) * 10
      card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)'
      card.style.setProperty('--mx', px * 100 + '%')
      card.style.setProperty('--my', py * 100 + '%')
    })
    listen(cleanups, card, 'mouseleave', () => {
      card.style.transform = ''
    })
  })
  document.querySelectorAll<HTMLElement>('.btn-primary').forEach((btn) => {
    listen(cleanups, btn, 'mousemove', (e) => {
      const m = e as MouseEvent
      const r = btn.getBoundingClientRect()
      const dx = (m.clientX - (r.left + r.width / 2)) * 0.25
      const dy = (m.clientY - (r.top + r.height / 2)) * 0.25
      btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px) translateY(-3px)'
    })
    listen(cleanups, btn, 'mouseleave', () => {
      btn.style.transform = ''
    })
  })
  return all(cleanups)
}

// Logo cross rotation (inline SVG).
function initLogoHover(): Cleanup {
  const logoLink = document.querySelector('header .logo-link')
  if (!logoLink) return () => {}
  const mark = logoLink.querySelector<SVGElement | HTMLElement>('.logo-mark')
  const text = logoLink.querySelector<HTMLElement>('.logo-text')
  const sub = logoLink.querySelector<HTMLElement>('.logo-sub')
  const cleanups: Cleanup[] = []
  listen(cleanups, logoLink, 'mouseenter', () => {
    if (mark) mark.style.transform = 'rotate(45deg)'
    if (text) text.style.letterSpacing = '12px'
    if (sub) sub.style.opacity = '.5'
  })
  listen(cleanups, logoLink, 'mouseleave', () => {
    if (mark) mark.style.transform = ''
    if (text) text.style.letterSpacing = ''
    if (sub) sub.style.opacity = ''
  })
  return all(cleanups)
}

// First-touch source for this visit (external referrer + UTM tags + landing page), sent with every lead so the email says whether
// search, an ad, or a link produced it. Exported for the Fall Risk page, which inlines it for the same reason live does.
export function recordSource() {
  try {
    if (!sessionStorage.getItem('mendSource')) {
      const srcParams = new URLSearchParams(location.search)
      const srcParts: string[] = []
      ;['utm_source', 'utm_medium', 'utm_campaign'].forEach((k) => {
        if (srcParams.get(k)) srcParts.push(k.slice(4) + '=' + srcParams.get(k))
      })
      const srcRef = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer : 'direct'
      sessionStorage.setItem('mendSource', [srcRef].concat(srcParts).join(' · ') + ' → landed on ' + location.pathname)
    }
  } catch {}
}

export function leadSource(): string {
  try {
    return sessionStorage.getItem('mendSource') || ''
  } catch {
    return ''
  }
}

// Product-page size/option buttons: one active per row, and every option button announces its state through aria-pressed (each page's
// own handlers move `.active`; this mirrors it after any click).
function initOptionButtons(): Cleanup {
  const syncPressed = () => {
    document.querySelectorAll('button.swatch, button.size-btn').forEach((b) => {
      b.setAttribute('aria-pressed', b.classList.contains('active') ? 'true' : 'false')
    })
  }
  const onSize = (e: Event) => {
    const btn = (e.target as Element).closest('.sizes .size-btn')
    if (!btn) return
    btn.parentNode?.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
  }
  const onAnyClick = () => {
    setTimeout(syncPressed)
  }
  document.addEventListener('click', onSize)
  document.addEventListener('click', onAnyClick)
  syncPressed()
  return () => {
    document.removeEventListener('click', onSize)
    document.removeEventListener('click', onAnyClick)
  }
}

// Product-card mini slideshow: cards with several photos crossfade automatically, pausing while the card is hovered.
function initCardSlideshow(): Cleanup {
  const cleanups: Cleanup[] = []
  const reduceMotion = reducedMotion()
  document.querySelectorAll<HTMLElement>('.img-box[data-carousel]').forEach((box) => {
    const imgs = box.querySelectorAll('img')
    if (imgs.length < 2 || reduceMotion) return
    const card = box.closest('.product-card')
    if (!card) return
    const dots = box.querySelectorAll('.img-dot')
    let i = 0
    let timer: ReturnType<typeof setInterval> | null = null
    const show = (next: number) => {
      imgs[i].classList.remove('active')
      if (dots[i]) dots[i].classList.remove('active')
      i = (next + imgs.length) % imgs.length
      imgs[i].classList.add('active')
      if (dots[i]) dots[i].classList.add('active')
    }
    const stop = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
    }
    const start = () => {
      stop()
      timer = setInterval(() => show(i + 1), 3200)
    }
    listen(cleanups, card, 'mouseenter', stop)
    listen(cleanups, card, 'mouseleave', start)
    start()
    cleanups.push(stop)
  })
  return all(cleanups)
}

// Mobile nav toggle. The header links overflow below 760px, where styles.css collapses them into a dropdown; this drives it.
export function initNavToggle(): Cleanup {
  const header = document.querySelector('header')
  const toggle = header && header.querySelector<HTMLElement>('.nav-toggle')
  const nav = header && header.querySelector('nav')
  if (!header || !toggle || !nav) return () => {}

  const cleanups: Cleanup[] = []
  const setOpen = (open: boolean) => {
    header.classList.toggle('nav-open', open)
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false')
  }
  listen(cleanups, toggle, 'click', (e) => {
    e.stopPropagation()
    setOpen(!header.classList.contains('nav-open'))
  })
  // Anchor links scroll within the page, so the menu has to close itself.
  listen(cleanups, nav, 'click', (e) => {
    if ((e.target as Element).closest('a, button')) setOpen(false)
  })
  listen(cleanups, document, 'keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Escape' && header.classList.contains('nav-open')) {
      setOpen(false)
      toggle.focus()
    }
  })
  listen(cleanups, document, 'click', (e) => {
    if (!header.contains(e.target as Node)) setOpen(false)
  })
  // Leaving mobile width with the menu open would otherwise strand the class.
  const wide = window.matchMedia('(min-width: 761px)')
  listen(cleanups, wide, 'change', (e) => {
    if ((e as MediaQueryListEvent).matches) setOpen(false)
  })
  return all(cleanups)
}

export function initShared(): Cleanup {
  recordSource()
  return all([
    initReveal(),
    initScrollEffects(),
    initRipple(),
    ...(reducedMotion() ? [] : [initPointerEffects()]),
    initLogoHover(),
    initOptionButtons(),
    initCardSlideshow(),
    initNavToggle(),
  ])
}
