'use client'

import {useEffect} from 'react'
import {initMarketing} from '@/behavior/marketing'
import {initPages} from '@/behavior/pages'
import {initShared} from '@/behavior/shared'
import {initTool} from '@/behavior/tool'

// Renders nothing. The pages' markup is server-rendered and proven against the live files; this attaches the ported behavior to it
// after hydration and removes it again on unmount. `kind` says which root layout it sits in: the site pages and the marketing pages
// get what main.js gave them (plus their own page scripts), the Fall Risk page only its small inline script.
export function Behavior({kind}: {kind: 'site' | 'marketing' | 'tool'}) {
  useEffect(() => {
    const stops = kind === 'tool' ? [initTool()] : kind === 'site' ? [initShared(), initPages()] : [initShared(), initMarketing()]
    return () => stops.forEach((stop) => stop())
  }, [kind])
  return null
}
