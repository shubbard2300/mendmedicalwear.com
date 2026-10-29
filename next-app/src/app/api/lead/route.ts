import {handleLead} from '@/lib/lead/handler'

// Same contract as the live api/lead.js: POST takes a form, anything else is a 405 with `Allow: POST`. An unreadable body is treated
// as empty, which gets the same 400 "Unknown form type" as an empty one.
async function respond(req: Request) {
  const body = req.method === 'POST' ? await req.json().catch(() => null) : null
  const {status, json, allow} = await handleLead(req.method, body)
  return new Response(JSON.stringify(json), {
    status,
    headers: {'content-type': 'application/json; charset=utf-8', ...(allow ? {Allow: allow} : {})},
  })
}

export const POST = respond
export const GET = respond
export const PUT = respond
export const PATCH = respond
export const DELETE = respond
export const OPTIONS = respond
