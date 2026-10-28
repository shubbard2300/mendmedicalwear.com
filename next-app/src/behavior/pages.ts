// Ported from the live pages' own inline scripts (P4a): the home hero carousel, banner slideshow and back-to-top button, the FAQ
// accordion, the Privacy and Terms tabs, and the FAQ and legal pages' section observer. The served buttons no longer carry the
// `onclick` text, so the handlers are delegated. Each part is a no-op on pages without its elements.
import type {Cleanup} from './shared'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const none: Cleanup = () => {}

function initHeroCarousel(): Cleanup {
  const carousel = document.getElementById('heroCarousel')
  const track = document.getElementById('carouselTrack')
  const prev = document.getElementById('prevBtn')
  const next = document.getElementById('nextBtn')
  if (!carousel || !track || !prev || !next) return none
  const dots = document.querySelectorAll<HTMLElement>('.carousel-dot')
  const slides = document.querySelectorAll<HTMLElement>('.carousel-slide')
  const total = dots.length
  let current = 0
  let timer: ReturnType<typeof setInterval> | undefined
  const reduceMotion = reducedMotion()

  function goTo(n: number) {
    current = (n + total) % total
    track!.style.transform = 'translateX(-' + current * 100 + '%)'
    dots.forEach((d, i) => d.classList.toggle('active', i === current))
    // Re-trigger entrance animation on the active slide
    slides.forEach((s, i) => {
      s.classList.remove('is-active')
      if (i === current) {
        void s.offsetWidth
        s.classList.add('is-active')
      }
    })
  }
  function resetTimer() {
    clearInterval(timer)
    if (reduceMotion) return // no autoplay if user prefers reduced motion
    timer = setInterval(() => goTo(current + 1), 6000)
  }

  const onPrev = () => {
    goTo(current - 1)
    resetTimer()
  }
  const onNext = () => {
    goTo(current + 1)
    resetTimer()
  }
  const dotHandlers = Array.from(dots).map((d) => {
    const fn = () => {
      goTo(+d.getAttribute('data-index')!)
      resetTimer()
    }
    d.addEventListener('click', fn)
    return fn
  })
  const onEnter = () => clearInterval(timer)
  // Pause autoplay while hovering or when the tab is hidden
  const onVisibility = () => {
    if (document.hidden) clearInterval(timer)
    else resetTimer()
  }
  prev.addEventListener('click', onPrev)
  next.addEventListener('click', onNext)
  carousel.addEventListener('mouseenter', onEnter)
  carousel.addEventListener('mouseleave', resetTimer)
  document.addEventListener('visibilitychange', onVisibility)

  goTo(0) // mark the first slide active so its entrance animation plays on load
  resetTimer()

  return () => {
    clearInterval(timer)
    prev.removeEventListener('click', onPrev)
    next.removeEventListener('click', onNext)
    dots.forEach((d, i) => d.removeEventListener('click', dotHandlers[i]))
    carousel.removeEventListener('mouseenter', onEnter)
    carousel.removeEventListener('mouseleave', resetTimer)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}

function initBanner(): Cleanup {
  const slides = document.querySelectorAll<HTMLElement>('.banner-slide')
  const dotsEl = document.getElementById('bannerDots')
  if (!slides.length || !dotsEl) return none
  let cur = 0
  let timer: ReturnType<typeof setInterval> | undefined
  const reduceMotion = reducedMotion()
  const made: HTMLElement[] = []

  slides.forEach((_, i) => {
    const d = document.createElement('button')
    d.type = 'button'
    d.className = 'banner-dot' + (i === 0 ? ' active' : '')
    d.setAttribute('aria-label', 'Show hero image ' + (i + 1))
    d.addEventListener('click', () => goTo(i))
    dotsEl.appendChild(d)
    made.push(d)
  })

  function goTo(n: number) {
    slides[cur].classList.remove('active')
    dotsEl!.children[cur].classList.remove('active')
    // Re-trigger Ken Burns by cloning the img
    const img = slides[n].querySelector('img')
    if (img && img.parentNode) {
      const clone = img.cloneNode(true)
      img.parentNode.replaceChild(clone, img)
    }
    cur = n
    slides[cur].classList.add('active')
    dotsEl!.children[cur].classList.add('active')
    clearInterval(timer)
    if (!reduceMotion) timer = setInterval(next, 5000)
  }
  function next() {
    goTo((cur + 1) % slides.length)
  }
  if (!reduceMotion) timer = setInterval(next, 5000)

  return () => {
    clearInterval(timer)
    made.forEach((d) => d.remove())
  }
}

function initBackToTop(): Cleanup {
  const btn = document.getElementById('toTop')
  if (!btn) return none
  const onScroll = () => btn.classList.toggle('show', window.scrollY > 700)
  const onClick = () => window.scrollTo({top: 0, behavior: reducedMotion() ? 'auto' : 'smooth'})
  window.addEventListener('scroll', onScroll, {passive: true})
  btn.addEventListener('click', onClick)
  return () => {
    window.removeEventListener('scroll', onScroll)
    btn.removeEventListener('click', onClick)
  }
}

// FAQ accordion: one open at a time.
function initFaq(): Cleanup {
  if (!document.querySelector('.faq-q')) return none
  const onClick = (e: Event) => {
    const btn = (e.target as Element).closest('.faq-q')
    const item = btn && btn.closest('.faq-item')
    if (!item) return
    const isOpen = item.classList.contains('open')
    document.querySelectorAll('.faq-item.open').forEach((i) => i.classList.remove('open'))
    if (!isOpen) item.classList.add('open')
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}

// Privacy and Terms tabs. Live passes the panel id in the handler ('privacy', 'terms'); the tabs and panels are in the same order.
function initPrivacyTabs(): Cleanup {
  const tabs = Array.from(document.querySelectorAll('.doc-tab'))
  if (!tabs.length) return none
  const onClick = (e: Event) => {
    const btn = (e.target as Element).closest('.doc-tab')
    if (!btn) return
    const panel = document.querySelectorAll('.doc-panel')[tabs.indexOf(btn)]
    if (!panel) return
    document.querySelectorAll('.doc-panel').forEach((p) => p.classList.remove('active'))
    document.querySelectorAll('.doc-tab').forEach((b) => b.classList.remove('active'))
    panel.classList.add('active')
    btn.classList.add('active')
  }
  document.addEventListener('click', onClick)
  return () => document.removeEventListener('click', onClick)
}

// The FAQ and legal pages carry their own section observer (threshold .08) on top of the shared one.
function initDocObserver(): Cleanup {
  if (!document.querySelector('.faq-q, .doc-tab')) return none
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('in-view')
      })
    },
    {threshold: 0.08},
  )
  document.querySelectorAll('.section').forEach((s) => observer.observe(s))
  return () => observer.disconnect()
}

export function initPages(): Cleanup {
  const stops = [initHeroCarousel(), initBanner(), initBackToTop(), initFaq(), initPrivacyTabs(), initDocObserver()]
  return () => stops.forEach((stop) => stop())
}
