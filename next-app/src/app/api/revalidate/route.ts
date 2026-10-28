import {revalidateTag} from 'next/cache'
import {type NextRequest, NextResponse} from 'next/server'
import {parseBody} from 'next-sanity/webhook'
import {revalidateSecret} from '@/sanity/env'
import {SANITY_TAG} from '@/sanity/fetch'

// Called by the Sanity webhook on any publish, edit or delete. The signature proves the call is Sanity's; the body is not used.
export async function POST(req: NextRequest) {
  if (!revalidateSecret) return NextResponse.json({message: 'SANITY_REVALIDATE_SECRET is not set'}, {status: 500})
  // parseBody parses the body as JSON even when the signature is wrong, so a junk body throws; treat that as a bad request.
  const parsed = await parseBody(req, revalidateSecret).catch(() => null)
  if (!parsed) return NextResponse.json({message: 'Unreadable body'}, {status: 400})
  if (!parsed.isValidSignature) return NextResponse.json({message: 'Invalid signature'}, {status: 401})
  revalidateTag(SANITY_TAG, {expire: 0})
  return NextResponse.json({revalidated: SANITY_TAG})
}
