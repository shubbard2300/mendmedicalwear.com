// Ported from the inline scripts of the gown, scrubs, socks and AirGuard pages (P4c). The server-rendered markup is unchanged; these attach to it in
// an effect and hand back a cleanup. Listeners go on the elements themselves, as the live inline handlers did (not delegated), so their order
// against main.js's handlers is the same. Photos now come from the Sanity CDN, so the live scripts' file names become a lookup in a table the page
// builds from the image matrix. The wording of every label, caption and alt text is the live script's, quirks included (see the P4c note in the plan).
import type {Cleanup} from './shared'

/** One matrix photo: what it shows ('' where a key does not apply) and its address. */
export type PhotoRow = {gender: string; view: string; closure: string; color: string; url: string}
/** A sock color's photo for the scrubs bundle: the original address and its webp source. */
export type SockPhoto = {color: string; url: string; webp: string}
export type GownData = {
  photos: PhotoRow[]
  /** The closure buttons' values in button order (front zip, back zip). */
  closures: string[]
  closureNotes: Record<string, string>
  viewNotes: {closure: string; view: string; text: string}[]
}
export type ScrubsData = {photos: PhotoRow[]; socks: SockPhoto[]}

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T
const all = <T extends HTMLElement = HTMLElement>(selector: string) => [...document.querySelectorAll<T>(selector)]
const attr = (el: Element, name: string) => el.getAttribute(name) ?? ''
const stopAll = (cleanups: Cleanup[]): Cleanup => () => cleanups.forEach((stop) => stop())

function listen(cleanups: Cleanup[], el: Element, handler: () => void) {
  el.addEventListener('click', handler)
  cleanups.push(() => el.removeEventListener('click', handler))
}

function photo(rows: PhotoRow[], key: Partial<PhotoRow>): string {
  const row = rows.find((r) => (Object.keys(key) as (keyof PhotoRow)[]).every((k) => r[k] === key[k]))
  if (!row) throw new Error(`No photo in the table for ${JSON.stringify(key)}`)
  return row.url
}

// A photo change fades the image out, swaps what it shows 150 ms later and fades it back in.
function fader(cleanups: Cleanup[]) {
  const timers = new Set<number>()
  cleanups.push(() => timers.forEach((t) => clearTimeout(t)))
  return (img: HTMLElement, change: () => void) => {
    img.style.opacity = '0'
    const t = window.setTimeout(() => {
      timers.delete(t)
      change()
      img.style.opacity = '1'
    }, 150)
    timers.add(t)
  }
}

/** The zoom lens over the main photo: it shows the current photo, positioned by where the pointer is. */
export function initZoomLens(): Cleanup {
  const main = byId('galleryMain')
  const lens = byId('zoomLens')
  const img = byId<HTMLImageElement>('mainImg')
  if (!main || !lens || !img) return () => {}
  const onMove = (e: Event) => {
    const m = e as MouseEvent
    const rect = main.getBoundingClientRect()
    const x = ((m.clientX - rect.left) / rect.width) * 100
    const y = ((m.clientY - rect.top) / rect.height) * 100
    lens.style.backgroundImage = "url('" + img.src + "')"
    lens.style.backgroundPosition = x + '% ' + y + '%'
  }
  main.addEventListener('mousemove', onMove)
  return () => main.removeEventListener('mousemove', onMove)
}

// Women's / Men's: the size row shown, the size guide, and the labels. Only the shown size row keeps an .active button, because the Reserve
// form reads the first active size. `onlyIfHidden`: the gown skips the size swap when that fit is already showing (the scrubs always swap).
function swapFit(isFemale: boolean, onlyIfHidden: boolean) {
  const label = isFemale ? "Women's" : "Men's"
  byId('genderLabel').textContent = label
  byId('sizeFitLabel').textContent = label
  const shown = byId(isFemale ? 'sizesFemale' : 'sizesMale')
  const hidden = byId(isFemale ? 'sizesMale' : 'sizesFemale')
  if (!onlyIfHidden || !hidden.hidden) {
    const prev = hidden.querySelector('.size-btn.active')
    const want = prev ? prev.textContent : 'M'
    hidden.querySelectorAll('.size-btn').forEach((b) => b.classList.remove('active'))
    hidden.hidden = true
    shown.hidden = false
    let pick: Element | null = null
    shown.querySelectorAll('.size-btn').forEach((b) => {
      if (b.textContent === want) pick = b
    })
    ;(pick || shown.querySelector('.size-btn:nth-child(2)'))!.classList.add('active')
  }
  byId('guideFemale').hidden = !isFemale
  byId('guideMale').hidden = isFemale
}

export function initGown(d: GownData): Cleanup {
  const cleanups: Cleanup[] = []
  const fade = fader(cleanups)
  let gender = 'female'
  let view = 'front'
  let color = ''
  let closure = d.closures[0]
  const url = (g: string, v: string) => photo(d.photos, {gender: g, view: v, closure, color})
  const viewNote = (c: string, v: string) => d.viewNotes.find((n) => n.closure === c && n.view === v)?.text ?? ''
  const main = byId<HTMLImageElement>('mainImg')

  const swapMain = (src: string) =>
    fade(main, () => {
      main.src = src
      main.alt = 'Comfort Wrap gown, ' + gender + ' model, ' + view + ' view, ' + (closure === 'front' ? 'front zip' : 'back zip')
    })

  const updateViewsGrid = () => {
    const ids: Record<string, Record<string, string>> = {female: {front: 'viewImgFF', back: 'viewImgFB'}, male: {front: 'viewImgMF', back: 'viewImgMB'}}
    for (const g of ['female', 'male']) {
      for (const v of ['front', 'back']) {
        const img = document.getElementById(ids[g][v]) as HTMLImageElement | null
        const next = url(g, v)
        if (img && img.src !== next) fade(img, () => (img.src = next))
        const card = img && img.closest('.view-card')
        if (card) card.querySelector('span')!.textContent = (g === 'female' ? 'Female' : 'Male') + ' — ' + (v === 'front' ? 'Front' : 'Back') + ' (' + viewNote(closure, v) + ')'
      }
    }
    all('#galleryThumbs button').forEach((b) => {
      b.querySelector('img')!.src = url(attr(b, 'data-gender'), attr(b, 'data-view'))
    })
    byId('closureNote').textContent = d.closureNotes[closure]
  }
  const updateMainImage = () => {
    swapMain(url(gender, view))
    updateViewsGrid()
  }
  const markThumbs = () => all('#galleryThumbs button').forEach((b) => b.classList.toggle('active', attr(b, 'data-gender') === gender && attr(b, 'data-view') === view))
  // Keeps the Women's / Men's buttons, size buttons and size guide in step with `gender` (which the fit buttons, the thumbnails and the view cards can all change).
  const applyGender = () => {
    all('#genderGroup .gender-btn').forEach((b) => {
      const on = attr(b, 'data-gender') === gender
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
    swapFit(gender === 'female', true)
  }

  all('#galleryThumbs button').forEach((b) =>
    listen(cleanups, b, () => {
      gender = attr(b, 'data-gender')
      view = attr(b, 'data-view')
      applyGender()
      markThumbs()
      swapMain(url(gender, view))
    }),
  )
  all('#genderGroup .gender-btn').forEach((b) =>
    listen(cleanups, b, () => {
      gender = attr(b, 'data-gender')
      applyGender()
      markThumbs()
      updateMainImage()
    }),
  )
  all('.swatches .swatch').forEach((s) =>
    listen(cleanups, s, () => {
      all('.swatches .swatch').forEach((x) => x.classList.remove('active'))
      s.classList.add('active')
      color = attr(s, 'data-color')
      updateMainImage()
    }),
  )
  // The closure choice picks which photo set is shown (front-zip gown or back-zip gown).
  all('#closureGroup .size-btn').forEach((b, i) =>
    listen(cleanups, b, () => {
      closure = d.closures[i]
      all('#closureGroup .size-btn').forEach((x) => x.classList.remove('active'))
      b.classList.add('active')
      updateMainImage()
    }),
  )
  all('.view-card').forEach((card) =>
    listen(cleanups, card, () => {
      gender = attr(card, 'data-gender')
      view = attr(card, 'data-view')
      applyGender()
      markThumbs()
      swapMain(url(gender, view))
      byId('galleryMain').scrollIntoView({behavior: 'smooth', block: 'center'})
    }),
  )
  return stopAll(cleanups)
}

const SCRUB_VIEWS = ['front', 'back', 'pockets']

export function initScrubs(d: ScrubsData): Cleanup {
  const cleanups: Cleanup[] = []
  const fade = fader(cleanups)
  let gender = 'female'
  let view = 'front'
  let color = attr(document.querySelector('.swatches .swatch.active') ?? document.body, 'data-color')
  // Sock colors for the bundle: the parent product's selected color, and the sock color, which follows it until the shopper picks one.
  let scrubColor = color
  let sockColor = attr(document.querySelector('#bundleSwatches .bundle-swatch.active') ?? document.body, 'data-sock')
  let sockPicked = false
  const url = (g: string, v: string) => photo(d.photos, {gender: g, view: v, color})
  const main = byId<HTMLImageElement>('mainImg')

  const swapMain = (src: string) =>
    fade(main, () => {
      main.src = src
      main.alt = (gender === 'female' ? "Women's" : "Men's") + ' Comfort Scrubs, ' + view + ' view'
    })
  const updateViewsGrid = () => {
    const ids: Record<string, Record<string, string>> = {
      female: {front: 'viewImgFF', back: 'viewImgFB', pockets: 'viewImgFP'},
      male: {front: 'viewImgMF', back: 'viewImgMB', pockets: 'viewImgMP'},
    }
    for (const g of ['female', 'male']) {
      for (const v of SCRUB_VIEWS) {
        const img = document.getElementById(ids[g][v]) as HTMLImageElement | null
        if (img) img.src = url(g, v)
      }
    }
    all('#galleryThumbs button').forEach((b) => {
      b.querySelector('img')!.src = url(gender, attr(b, 'data-view'))
    })
  }
  const markThumb = () => all('#galleryThumbs button').forEach((b) => b.classList.toggle('active', attr(b, 'data-view') === view))

  // The Reserve dialog reads data-product from whichever button opened it, so the bundle has to be written onto both the primary button and the
  // floating one. The sock color goes in the product name, which the lead email prints as-is.
  const updateBundle = () => {
    const on = byId<HTMLInputElement>('bundleToggle').checked
    const product = on ? 'Comfort Scrubs — Residential Nurse Set + Compression Socks in ' + sockColor + ' (Bundle, save 12%)' : 'Comfort Scrubs — Residential Nurse Set'
    byId('ctaPrimary').textContent = on ? 'Pre-Order Bundle — Save 12%' : 'Pre-Order Now'
    all('#ctaPrimary, .mend-sticky-cta').forEach((b) => b.setAttribute('data-product', product))
    byId('bundleColor').hidden = !on
    byId('bundleColorLabel').textContent = sockColor
    all('#bundleSwatches .bundle-swatch').forEach((b) => {
      const active = attr(b, 'data-sock') === sockColor
      b.classList.toggle('active', active)
      b.setAttribute('aria-pressed', active ? 'true' : 'false')
    })
    const sock = d.socks.find((s) => s.color === sockColor)
    if (sock) {
      byId<HTMLSourceElement>('bundleThumbSrc').srcset = sock.webp
      byId<HTMLImageElement>('bundleThumb').src = sock.url
    }
  }
  // Women's / Men's: swaps the photos, the size buttons and the size guide.
  const setGender = (btn: HTMLElement) => {
    gender = attr(btn, 'data-gender')
    all('#genderGroup .gender-btn').forEach((b) => {
      const on = b === btn
      b.classList.toggle('active', on)
      b.setAttribute('aria-pressed', on ? 'true' : 'false')
    })
    swapFit(gender === 'female', false)
    updateViewsGrid()
    swapMain(url(gender, view))
  }

  all('#galleryThumbs button').forEach((b) =>
    listen(cleanups, b, () => {
      view = attr(b, 'data-view')
      markThumb()
      swapMain(url(gender, view))
    }),
  )
  all('#genderGroup .gender-btn').forEach((b) => listen(cleanups, b, () => setGender(b)))
  all('.swatches .swatch').forEach((s) =>
    listen(cleanups, s, () => {
      all('.swatches .swatch').forEach((x) => x.classList.remove('active'))
      s.classList.add('active')
      color = attr(s, 'data-color')
      byId('colorLabel').textContent = attr(s, 'data-color-label')
      scrubColor = attr(s, 'data-color')
      if (!sockPicked) {
        sockColor = scrubColor
        updateBundle()
      }
      updateViewsGrid()
      swapMain(url(gender, view))
    }),
  )
  all('.view-card').forEach((card) =>
    listen(cleanups, card, () => {
      const g = attr(card, 'data-gender')
      if (g !== gender) setGender(document.querySelector<HTMLElement>('#genderGroup .gender-btn[data-gender="' + g + '"]')!)
      view = attr(card, 'data-view')
      markThumb()
      swapMain(url(gender, view))
      byId('galleryMain').scrollIntoView({behavior: 'smooth', block: 'center'})
    }),
  )
  const toggle = byId<HTMLInputElement>('bundleToggle')
  toggle.addEventListener('change', updateBundle)
  cleanups.push(() => toggle.removeEventListener('change', updateBundle))
  all('#bundleSwatches .bundle-swatch').forEach((b) =>
    listen(cleanups, b, () => {
      sockColor = attr(b, 'data-sock')
      sockPicked = true
      updateBundle()
    }),
  )
  return stopAll(cleanups)
}

export function initSocks(): Cleanup {
  const cleanups: Cleanup[] = []
  const fade = fader(cleanups)
  const main = byId<HTMLImageElement>('mainImg')
  const swapMain = (src: string) => fade(main, () => (main.src = src))
  const swatches = () => all('.swatches .swatch')
  const thumbs = () => all('.gallery-thumbs button')

  const updateSwatchActive = (color: string) => {
    swatches().forEach((s) => s.classList.toggle('active', attr(s, 'data-color') === color))
    if (document.querySelector('.swatch[data-color="' + color + '"]')) byId('colorLabel').textContent = color
  }
  const setColor = (swatch: HTMLElement) => {
    swatches().forEach((s) => s.classList.remove('active'))
    swatch.classList.add('active')
    const color = attr(swatch, 'data-color')
    byId('colorLabel').textContent = color
    swapMain(attr(swatch, 'data-src'))
    // sync the thumbnail to the color if it is one of the main shots
    thumbs().forEach((b) => b.classList.toggle('active', attr(b, 'data-color') === color))
  }

  thumbs().forEach((b) =>
    listen(cleanups, b, () => {
      thumbs().forEach((x) => x.classList.remove('active'))
      b.classList.add('active')
      swapMain(attr(b, 'data-src'))
      const color = attr(b, 'data-color')
      if (color !== 'detail') updateSwatchActive(color)
    }),
  )
  swatches().forEach((s) => listen(cleanups, s, () => setColor(s)))
  // A color tile selects its swatch and scrolls back to the photo. The tile names its color first in its label.
  all('.color-tile').forEach((tile) =>
    listen(cleanups, tile, () => {
      const name = tile.querySelector('.color-tile-label')?.firstChild?.textContent ?? ''
      const swatch = document.querySelector<HTMLElement>('.swatch[data-color="' + name + '"]')
      if (swatch) setColor(swatch)
      window.scrollTo({top: 0, behavior: 'smooth'})
    }),
  )
  all('.size-btn').forEach((b) =>
    listen(cleanups, b, () => {
      all('.size-btn').forEach((x) => x.classList.remove('active'))
      b.classList.add('active')
    }),
  )
  return stopAll(cleanups)
}
