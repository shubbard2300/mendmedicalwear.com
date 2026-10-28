// Ported from the MEND App, Pulse and Oxi pages' inline scripts (P4a): the header hairline, the scroll reveal, Pulse's changing demo
// numbers and the App phone's step swap. Each part is a no-op on a page without its elements.
import type {Cleanup} from './shared'

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const none: Cleanup = () => {}

// Sticky nav hairline.
function initHairline(): Cleanup {
  const h = document.getElementById('hdr')
  if (!h) return none
  const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 8)
  window.addEventListener('scroll', onScroll, {passive: true})
  return () => window.removeEventListener('scroll', onScroll)
}

// Scroll reveal (gated on the `js` class in each page's CSS).
function initReveal(): Cleanup {
  const io = new IntersectionObserver(
    (es) => {
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in')
          io.unobserve(e.target)
        }
      })
    },
    {threshold: 0.14},
  )
  document.querySelectorAll('.rv').forEach((el) => io.observe(el))
  return () => io.disconnect()
}

// Live-ish reading: gently vary the demo numbers every 8s.
function initPulseNumbers(): Cleanup {
  if (reducedMotion()) return none
  const sys = document.querySelector('.reading-sys')
  const dia = document.querySelector('.reading-dia')
  const hr = document.querySelector('.reading-hr .num')
  if (!sys || !dia || !hr) return none
  const base = [118, 76, 62]
  const timer = setInterval(() => {
    const s = base[0] + Math.round(Math.random() * 4 - 2)
    const d = base[1] + Math.round(Math.random() * 4 - 2)
    const p = base[2] + Math.round(Math.random() * 4 - 2)
    sys.textContent = String(s)
    dia.textContent = '/ ' + d
    hr.textContent = p + ' bpm'
  }, 8000)
  return () => clearInterval(timer)
}

// Phone mock: cycle the "Transmitting…" step to "Delivered ✓" and back.
function initPhoneSwap(): Cleanup {
  if (reducedMotion()) return none
  const steps = document.querySelectorAll('.ps-progress .ps-step')
  if (!steps.length) return none
  const last = steps[steps.length - 1]
  const spinHTML = '<span class="spin" aria-hidden="true"></span>Transmitting securely…'
  const doneHTML = '<span class="tick"><svg viewBox="0 0 24 24"><path d="M5 13l5 5L20 7"/></svg></span>Delivered · provider confirmed'
  let delivered = false
  const timer = setInterval(() => {
    delivered = !delivered
    last.innerHTML = delivered ? doneHTML : spinHTML
  }, 4000)
  return () => clearInterval(timer)
}

export function initMarketing(): Cleanup {
  const stops = [initHairline(), initReveal(), initPulseNumbers(), initPhoneSwap()]
  return () => stops.forEach((stop) => stop())
}
