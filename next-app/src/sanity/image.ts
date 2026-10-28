import {dataset, projectId} from './env'

// An asset reference is image-<hash>-<width>x<height>-<ext>; the size and the CDN address both come from it, so no extra query is needed.
const REF = /^image-([A-Za-z0-9]+)-(\d+)x(\d+)-([a-z0-9]+)$/

export function imageInfo(ref: string) {
  const m = REF.exec(ref)
  if (!m) throw new Error(`Not an image asset reference: ${ref}`)
  return {id: m[1], width: Number(m[2]), height: Number(m[3]), ext: m[4]}
}

export function imageUrl(ref: string, {format}: {format?: string} = {}) {
  const {id, width, height, ext} = imageInfo(ref)
  const url = `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${width}x${height}.${ext}`
  return format ? `${url}?fm=${format}` : url
}
