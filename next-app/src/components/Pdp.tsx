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

/** The main photo and the zoom lens (behavior arrives in P4). */
export function Gallery({image}: {image: Product['heroImage']}) {
  return (
    <div className="gallery-main" id="galleryMain">
      <SanityImage image={image} id="mainImg" plain />
      <div className="zoom-lens" id="zoomLens"></div>
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
