// Ported from main.js's initBrandIt (P4c): the Brand-It logo preview. The visitor's logo is drawn onto the real product photo at the spot where
// the MEND mark normally sits, and can be downloaded as a PNG. Live also has a generic label-card mode for a page that gives no photo; every
// page gives one, so that mode is not ported (D33). The photos are the four files in public/ (same origin, so the canvas can export a PNG).
import type {Cleanup} from './shared'

export type ProductPage = 'gown' | 'scrubs' | 'socks' | 'airguard'
type Box = {x: number; y: number; w: number; h: number}

// The photo and the logo's box in that photo's own pixels, from each page's live initBrandIt call.
export const BRAND_IT: Record<ProductPage, {photo: string; box: Box}> = {
  gown: {photo: '/Concept - Hospital Gown - Female Front - 2026-06-15-web.jpg', box: {x: 572, y: 276, w: 76, h: 68}},
  scrubs: {photo: '/Concept - Nurse Scrubs - Female Front - 2026-06-15-web.jpg', box: {x: 594, y: 376, w: 72, h: 62}},
  socks: {photo: '/Concept - Compression Socks - Ceil Blue - 2026-06-15-web.jpg', box: {x: 255, y: 125, w: 250, h: 110}},
  airguard: {photo: '/Concept - AirGuard Collar - 2026-06-17-web.jpg', box: {x: 410, y: 635, w: 150, h: 70}},
}

export function initBrandIt(page: ProductPage): Cleanup {
  const {photo: photoSrc, box: logoBox} = BRAND_IT[page]
  const drop = document.getElementById('brandItDrop')
  const fileInput = document.getElementById('brandItFile') as HTMLInputElement | null
  const canvas = document.getElementById('brandItCanvas') as HTMLCanvasElement | null
  const placeholder = document.querySelector<HTMLElement>('.brand-it-placeholder')
  const dlBtn = document.getElementById('brandItDownload') as HTMLAnchorElement | null
  const resetBtn = document.getElementById('brandItReset') as HTMLElement | null
  if (!drop || !canvas || !fileInput) return () => {}

  const ctx = canvas.getContext('2d')!

  function roundRect(x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  function drawLogoFit(logo: HTMLImageElement, x: number, y: number, w: number, h: number) {
    const ratio = Math.min(w / logo.width, h / logo.height)
    const lw = logo.width * ratio
    const lh = logo.height * ratio
    ctx.drawImage(logo, x + (w - lw) / 2, y + (h - lh) / 2, lw, lh)
  }

  function drawWatermark(W: number, H: number) {
    ctx.fillStyle = 'rgba(255,255,255,.85)'
    ctx.font = '400 10px Inter,sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('custom branding preview · mendmedicalwear.com', W - 10, H - 10)
  }

  // Draws the real product photo, then overlays the uploaded logo directly on it at logoBox (or, with no logo yet, a dashed box and a label).
  function drawOnPhoto(photo: HTMLImageElement, logo: HTMLImageElement | null) {
    const maxW = 560
    const scale = Math.min(1, maxW / photo.width)
    const W = Math.round(photo.width * scale)
    const H = Math.round(photo.height * scale)
    canvas!.width = W
    canvas!.height = H

    ctx.drawImage(photo, 0, 0, W, H)

    const bx = logoBox.x * scale
    const by = logoBox.y * scale
    const bw = logoBox.w * scale
    const bh = logoBox.h * scale

    if (logo) {
      drawLogoFit(logo, bx, by, bw, bh)
    } else {
      ctx.save()
      ctx.strokeStyle = 'rgba(255,255,255,.85)'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 5])
      ctx.strokeRect(bx, by, bw, bh)
      ctx.restore()
      ctx.fillStyle = 'rgba(0,0,0,.55)'
      roundRect(bx, by + bh + 8, 128, 22, 6)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = '600 10px Inter,sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('YOUR LOGO GOES HERE', bx + 64, by + bh + 23)
    }

    drawWatermark(W, H)
    canvas!.style.display = 'block'
    if (placeholder) placeholder.style.display = 'none'
  }

  const photo = new Image()
  const drawMockup = (logo: HTMLImageElement | null) => drawOnPhoto(photo, logo)
  photo.onload = () => drawMockup(null)
  photo.src = photoSrc

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const img = new Image()
      img.onload = () => {
        drawMockup(img)
        if (dlBtn) {
          dlBtn.href = canvas!.toDataURL('image/png')
          dlBtn.style.display = 'inline-block'
        }
        if (resetBtn) resetBtn.style.display = 'inline-block'
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  }

  const cleanups: Cleanup[] = []
  const on = (target: EventTarget, type: string, fn: (e: any) => void) => {
    target.addEventListener(type, fn)
    cleanups.push(() => target.removeEventListener(type, fn))
  }
  on(fileInput, 'change', () => handleFile(fileInput.files?.[0]))
  on(drop, 'dragover', (e: DragEvent) => {
    e.preventDefault()
    drop.classList.add('drag-over')
  })
  on(drop, 'dragleave', () => drop.classList.remove('drag-over'))
  on(drop, 'drop', (e: DragEvent) => {
    e.preventDefault()
    drop.classList.remove('drag-over')
    handleFile(e.dataTransfer?.files[0])
  })
  if (dlBtn) on(dlBtn, 'click', () => (dlBtn.href = canvas.toDataURL('image/png')))
  if (resetBtn)
    on(resetBtn, 'click', () => {
      fileInput.value = ''
      drawMockup(null)
      if (dlBtn) dlBtn.style.display = 'none'
      resetBtn.style.display = 'none'
      // drawMockup(null) already hides the static placeholder and redraws the canvas in its empty state; the placeholder is not shown again on top of it.
    })
  cleanups.push(() => {
    photo.onload = null
  })
  return () => cleanups.forEach((stop) => stop())
}
