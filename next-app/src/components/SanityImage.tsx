import {imageInfo, imageUrl} from '@/sanity/image'
import type {ImageWithAlt} from '@/sanity/types'

type Props = {
  image?: ImageWithAlt | null
  loading?: 'lazy'
  fetchPriority?: 'high' | 'low'
  decoding?: 'async'
  /** Width candidates for a srcset on the webp source (the home banner uses 480, 768, 1024); omit for a single source. */
  widths?: number[]
  sizes?: string
  className?: string
}

// The live <picture><source><img> structure, with the image served by the Sanity CDN. Plain markup on purpose: next/image would add its own
// attributes. An SVG is a plain <img> (there is nothing to convert). Each live use sets its own loading attributes, so the caller passes them.
export function SanityImage({image, loading, fetchPriority, decoding, widths, sizes, className}: Props) {
  const ref = image?.asset?._ref
  if (!image || !ref) return null
  const {width, height, ext} = imageInfo(ref)
  const img = <img src={imageUrl(ref)} alt={image.alt} width={width} height={height} className={className} loading={loading} fetchPriority={fetchPriority} decoding={decoding} />
  if (ext === 'svg') return img
  const srcSet = widths ? widths.map((w) => `${imageUrl(ref, {format: 'webp', width: w})} ${w}w`).join(', ') : imageUrl(ref, {format: 'webp'})
  return (
    <picture>
      <source srcSet={srcSet} sizes={sizes} type="image/webp" />
      {img}
    </picture>
  )
}
