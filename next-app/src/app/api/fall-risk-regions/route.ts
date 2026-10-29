import {parse} from 'node:querystring'
import {regions} from '@/lib/fall-risk/regions'

// Same contract as the live api/fall-risk-regions.js: GET answers with the ranked panel, every other method gets a 405 with `Allow: GET`. The query
// is read with Node's own parser, as the live function's `req.query` is, so a repeated parameter arrives as a list there and here.
async function respond(req: Request) {
  const {status, json, allow, cacheControl} = await regions(req.method, parse(new URL(req.url).search.slice(1)))
  return new Response(JSON.stringify(json), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      ...(allow ? {Allow: allow} : {}),
      ...(cacheControl ? {'Cache-Control': cacheControl} : {}),
    },
  })
}

export const GET = respond
export const HEAD = respond
export const POST = respond
export const PUT = respond
export const PATCH = respond
export const DELETE = respond
export const OPTIONS = respond
