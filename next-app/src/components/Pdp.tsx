import type {CSSProperties, ReactNode} from 'react'
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
export function findPhoto(matrix: Matrix | undefined, key: {gender?: Photo['gender']; view?: Photo['view']; closure?: Photo['closure']; color?: string | undefined}): Photo {
  const photo = matrix?.find((m) => (!('gender' in key) || m.gender === key.gender) && (!('view' in key) || m.view === key.view) && (!('closure' in key) || m.closure === key.closure) && (!('color' in key) || m.color === key.color))
  if (!photo?.image) throw new Error(`No photo in the image matrix for ${JSON.stringify(key)}`)
  return photo
}

export type Thumb = {photo: Photo; alt: string; view?: string; gender?: string; ariaLabel?: string}

/** The main photo and the zoom lens, and a strip of thumbnails where the product has one (behavior arrives in P4). */
export function Gallery({image, thumbs}: {image: Product['heroImage']; thumbs?: Thumb[]}) {
  return (
    <>
      <div className="gallery-main" id="galleryMain">
        <SanityImage image={image} id="mainImg" plain />
        <div className="zoom-lens" id="zoomLens"></div>
      </div>
      {thumbs && (
        <div className="gallery-thumbs" id="galleryThumbs">
          {thumbs.map((t, i) => (
            <button key={`${t.gender}-${t.view}`} className={i === 0 ? 'active' : undefined} data-gender={t.gender} data-view={t.view} aria-label={t.ariaLabel}>
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
export function ProductIntro({product, priceStyle}: {product: Product; priceStyle?: CSSProperties}) {
  return (
    <>
      <h1>{product.name}</h1>
      <div className="subtitle">{product.tagline}</div>
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
