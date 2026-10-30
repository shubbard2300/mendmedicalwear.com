import {dataset, projectId} from './env'

// An asset reference is image-<hash>-<width>x<height>-<ext>; the size and the CDN address both come from it, so no extra query is needed.
const REF = /^image-([A-Za-z0-9]+)-(\d+)x(\d+)-([a-z0-9]+)$/

export function imageInfo(ref: string) {
  const m = REF.exec(ref)
  if (!m) throw new Error(`Not an image asset reference: ${ref}`)
  return {id: m[1], width: Number(m[2]), height: Number(m[3]), ext: m[4]}
}

// Sanity's CDN re-serializes SVG files and lowercases <feDropShadow>, which is then not a known element, so this drawing's shadow filter
// breaks (found in P6). It is served from public/ as on the live site. The asset id is the file's SHA-1, so the key holds in every dataset.
const FROM_PUBLIC: Record<string, string> = {
  'image-ba147e4db71eb40f05ffe3843f2034351574954f-800x1200-svg': '/MEND App - Card - 2026-07-26.svg',
}

export function imageUrl(ref: string, {format, width: w}: {format?: string; width?: number} = {}) {
  if (ref in FROM_PUBLIC) return FROM_PUBLIC[ref]
  const {id, width, height, ext} = imageInfo(ref)
  const url = `https://cdn.sanity.io/images/${projectId}/${dataset}/${id}-${width}x${height}.${ext}`
  const query = [format && `fm=${format}`, w && `w=${w}`].filter(Boolean).join('&')
  return query ? `${url}?${query}` : url
}
