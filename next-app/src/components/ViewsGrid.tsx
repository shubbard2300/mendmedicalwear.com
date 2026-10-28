import {Fragment} from 'react'
import type {PRODUCT_QUERY_RESULT} from '@/sanity/types'
import {findPhoto} from './Pdp'
import {SanityImage} from './SanityImage'
import type {ViewsSpec} from './variants'

type Product = NonNullable<PRODUCT_QUERY_RESULT>

/** The "front, back and more" views section. The photos come from the image matrix; the alt text, tooltip and ids are code, and so are the
 *  captions where the matrix stores none (the scrubs). Clicking a card previews it in the gallery (behavior arrives in P4). */
export function ViewsGrid({heading, product, spec}: {heading?: string; product: Product; spec: ViewsSpec}) {
  return (
    <div className="section" id={spec.wrapId}>
      <h2>{heading}</h2>
      <div className="views-grid">
        {spec.cards.map((card, i) => {
          const photo = findPhoto(product.imageMatrix, spec.match(card))
          const caption = card.caption ?? photo.label
          return (
            <Fragment key={`${card.gender}-${card.view}`}>
              {spec.subheads && card.view === 'front' && <h3>{spec.subheads[card.gender]}</h3>}
              <div className="view-card" data-gender={card.gender} data-view={card.view} data-tooltip={spec.tooltip}>
                <div className="img-box">
                  <SanityImage image={photo.image && {...photo.image, alt: card.alt}} id={`viewImg${card.id}`} loading={spec.lazy ? 'lazy' : undefined} plain />
                </div>
                <span>{caption}</span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
