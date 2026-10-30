import type {CSSProperties} from 'react'
import type {BlockContent, ImageWithAlt} from '@/sanity/types'
import {RichText} from './RichText'
import {SanityImage} from './SanityImage'

// The socks page's two feature blocks. Class names and wrappers are copied from the live page.

// The copy runs h3, paragraph, paragraph, list, so the list node carries the live class.
const WEBBING_COPY_CLASSES = {3: 'webbing-list'}

/** A photo beside a heading, two paragraphs and a bullet list (the webbing block; the non-slip block repeats it and adds a wide photo under it). */
export function FeatureSection({heading, body, image, widePhoto}: {heading?: string; body?: BlockContent; image?: ImageWithAlt; widePhoto?: ImageWithAlt}) {
  return (
    <div className="section">
      <h2>{heading}</h2>
      <div className="webbing-section">
        <div className="webbing-img">
          <SanityImage image={image} loading="lazy" />
        </div>
        <div className="webbing-content">
          <RichText value={body} classes={WEBBING_COPY_CLASSES} />
        </div>
      </div>
      {widePhoto && (
        <div style={{marginTop: '24px', borderRadius: '12px', overflow: 'hidden'}}>
          <SanityImage image={widePhoto} style={WIDE_PHOTO} />
        </div>
      )}
    </div>
  )
}

const WIDE_PHOTO: CSSProperties = {width: '100%', maxHeight: '340px', objectFit: 'cover', display: 'block'}

type Card = {_key: string; title?: string; body?: string; image?: ImageWithAlt}

/** The color grid: a photo, the color name and a one-line note per tile (clicking a tile picks that color; behavior arrives in P4). */
export function ColorGrid({heading, cards}: {heading?: string; cards?: Card[]}) {
  return (
    <div className="section">
      <h2>{heading}</h2>
      <div className="color-grid">
        {cards?.map((c) => (
          <div className="color-tile" key={c._key}>
            <SanityImage image={c.image} loading="lazy" />
            <div className="color-tile-label">
              {c.title}
              <div className="color-tile-sub">{c.body}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
