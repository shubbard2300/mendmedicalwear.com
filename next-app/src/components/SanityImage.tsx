import {imageInfo, imageUrl} from '@/sanity/image'
import type {ImageWithAlt} from '@/sanity/types'

// The live <picture><source><img> structure, with the image served by the Sanity CDN. Plain markup on purpose: next/image would add its own attributes.
export function SanityImage({image, priority = false}: {image?: ImageWithAlt | null; priority?: boolean}) {
  const ref = image?.asset?._ref
  if (!image || !ref) return null
  const {width, height} = imageInfo(ref)
  return (
    <picture>
      <source srcSet={imageUrl(ref, {format: 'webp'})} type="image/webp" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl(ref)} alt={image.alt} width={width} height={height} {...(priority ? {fetchPriority: 'high' as const} : {loading: 'lazy' as const})} />
    </picture>
  )
}
