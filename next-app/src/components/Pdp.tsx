import type {CSSProperties, ReactNode} from 'react'
import type {PhotoRow, SockPhoto} from '@/behavior/product'
import {imageUrl} from '@/sanity/image'
import type {BlockContent, CtaLink, PRODUCT_QUERY_RESULT} from '@/sanity/types'
import {Cta} from './Cta'
import {RichText} from './RichText'
import {SanityImage} from './SanityImage'

type Product = NonNullable<PRODUCT_QUERY_RESULT>

// The pieces every product page shares: the frame (a gallery column and an info column) and the blocks of the info column. The pickers
// (fit, color, closure, size) arrive with the apparel and sock pages. Wrappers and class names are copied from the live pages.

/** Next's metadata rejects the Open Graph type "product", so the page renders the tag itself (React moves it into the head). */
export function OgTypeProduct() {
  return <meta property="og:type" content="product" />
}

export function PdpFrame({gallery, children}: {gallery: ReactNode; children: ReactNode}) {
  return (
    <div className="pdp">
      <div>{gallery}</div>
      <div>{children}</div>
    </div>
  )
}

type Matrix = NonNullable<Product['imageMatrix']>
export type Photo = Matrix[number]

/** One photo from the image matrix by what it shows. A key left out is not matched; `color: undefined` matches the photos with no color. */
export function findPhoto(matrix: Matrix | null | undefined, key: {gender?: Photo['gender']; view?: Photo['view']; closure?: Photo['closure']; color?: string | undefined}): Photo {
  const photo = matrix?.find((m) => (!('gender' in key) || m.gender === key.gender) && (!('view' in key) || m.view === key.view) && (!('closure' in key) || m.closure === key.closure) && (!('color' in key) || m.color === key.color))
  if (!photo?.image) throw new Error(`No photo in the image matrix for ${JSON.stringify(key)}`)
  return photo
}

type Key = 'gender' | 'view' | 'closure' | 'color'

/** The matrix as rows for the browser: what each photo shows ('' where a key does not apply) and its address. `expect` lists the values of each
 *  key the page's pickers can reach; the build fails if a combination has no photo, so a document edit cannot leave a picker with nothing to show. */
export function photoTable(matrix: Matrix | null | undefined, expect: Partial<Record<Key, string[]>>): PhotoRow[] {
  const rows = (matrix ?? []).flatMap((m) => {
    const ref = m.image?.asset?._ref
    return ref ? [{gender: m.gender ?? '', view: m.view ?? '', closure: m.closure ?? '', color: m.color ?? '', url: imageUrl(ref)}] : []
  })
  for (const gender of expect.gender ?? ['']) {
    for (const view of expect.view ?? ['']) {
      for (const closure of expect.closure ?? ['']) {
        for (const color of expect.color ?? ['']) {
          if (!rows.some((r) => r.gender === gender && r.view === view && r.closure === closure && r.color === color)) {
            throw new Error(`No photo in the image matrix for ${JSON.stringify({gender, view, closure, color})}`)
          }
        }
      }
    }
  }
  return rows
}

/** The scrubs bundle's sock photos: for each sock color the photo's address and its webp source. Throws if a color has no photo. */
export function sockPhotos(matrix: Matrix | null | undefined, colors: string[]): SockPhoto[] {
  return colors.map((color) => {
    const ref = findPhoto(matrix, {color}).image?.asset?._ref
    if (!ref) throw new Error(`No sock photo for ${color}`)
    return {color, url: imageUrl(ref), webp: imageUrl(ref, {format: 'webp'})}
  })
}

export type Thumb = {photo: Photo; alt: string; view?: string; gender?: string; ariaLabel?: string; /** the socks: `data-color`, and `data-src` with the photo's address */ color?: string; withSrc?: boolean}

/** The main photo and the zoom lens, and a strip of thumbnails where the product has one (behavior arrives in P4). */
export function Gallery({image, thumbs, thumbsId = 'galleryThumbs'}: {image: Product['heroImage']; thumbs?: Thumb[]; thumbsId?: string}) {
  return (
    <>
      <div className="gallery-main" id="galleryMain">
        <SanityImage image={image} id="mainImg" plain />
        <div className="zoom-lens" id="zoomLens"></div>
      </div>
      {thumbs && (
        <div className="gallery-thumbs" id={thumbsId}>
          {thumbs.map((t, i) => (
            <button
              key={i}
              className={i === 0 ? 'active' : undefined}
              data-src={t.withSrc && t.photo.image?.asset ? imageUrl(t.photo.image.asset._ref) : undefined}
              data-color={t.color}
              data-gender={t.gender}
              data-view={t.view}
              aria-label={t.ariaLabel}
            >
              <SanityImage image={t.photo.image && {...t.photo.image, alt: t.alt}} plain />
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/** The pre-order and waitlist buttons. */
export function CtaRow({ctas, firstId}: {ctas: Product['ctas']; firstId?: string}) {
  return (
    <div className="cta">
      {ctas?.map((c, i) => (
        <Cta key={c._key} cta={c} className={i === 0 ? 'btn btn-primary' : 'btn btn-secondary'} id={i === 0 ? firstId : undefined} />
      ))}
    </div>
  )
}

/** Heading, subtitle, price and badges. A product with a priceStyle shows the price as a plain styled line (AirGuard); the others use the price-note span. */
export function ProductIntro({product, priceStyle, tagline}: {product: Product; priceStyle?: CSSProperties; /** a line under the subtitle (the socks) */ tagline?: string}) {
  return (
    <>
      <h1>{product.name}</h1>
      <div className="subtitle">{product.tagline}</div>
      {tagline && <div className="tagline">{tagline}</div>}
      {priceStyle ? (
        <div className="price" style={priceStyle}>
          {product.priceText}
        </div>
      ) : (
        <div className="price">
          <span className="price-note" style={{marginLeft: 0}}>
            {product.priceText}
          </span>
        </div>
      )}
      <div className="badges">
        {product.badges?.map((b) => (
          <span className="badge" data-tooltip={b.tooltip || undefined} key={b._key}>
            {b.label}
          </span>
        ))}
      </div>
    </>
  )
}

/** The coming-soon banner: its lead-in is bold, so the stored line is split at the dash. Throws if the lead-in is gone. */
export function ComingSoon({text}: {text?: string}) {
  const m = /^(Coming Soon —)( .*)$/s.exec(text ?? '')
  if (!m) throw new Error(`Expected the banner to start with "Coming Soon —": ${text}`)
  return (
    <div className="coming-soon-banner">
      <div className="dot"></div>
      <p>
        <strong>{m[1]}</strong>
        {m[2]}
      </p>
    </div>
  )
}

export function NotifyForm({cta}: {cta?: CtaLink}) {
  return <div className="notify-form">{cta && <Cta cta={cta} className="btn btn-primary" />}</div>
}

export function BundleNote({blocks}: {blocks?: BlockContent}) {
  return (
    <div className="bundle-note">
      <RichText value={blocks} bare />
    </div>
  )
}

export function Description({blocks}: {blocks?: BlockContent}) {
  return (
    <div className="description">
      <RichText value={blocks} bare />
    </div>
  )
}

/** The specification list under its fixed heading. */
export function SpecList({specs}: {specs: Product['specs']}) {
  return (
    <div className="features">
      <h2>Specifications</h2>
      <ul>
        {specs?.map((row) => (
          <li key={row._key}>
            <span>{row.label}</span>
            <span>{row.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
