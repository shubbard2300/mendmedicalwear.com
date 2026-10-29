'use client'

import {useEffect} from 'react'
import {createRoot, type Root} from 'react-dom/client'
import {Assessment, type HeadingTag} from '@/fall-risk/Assessment'

const roots = new WeakMap<Element, Root>()

// Renders nothing. The page's markup is server-rendered and proven against the live file: an empty `#fall-risk-root` that carries the tool's options
// as data attributes, plus a noscript fallback. This mounts the tool into it after hydration, as the live page's fall-risk.js did, reading the
// options the same way. The tool runs in a root of its own, so the server-rendered page stays as proven. Imported by the two pages that have the tool.
export function FallRiskTool() {
  useEffect(() => {
    const el = document.getElementById('fall-risk-root')
    if (!el) return
    const root = roots.get(el) ?? createRoot(el)
    roots.set(el, root)
    root.render(<Assessment apiPath={el.dataset.api || '/api/fall-risk-regions'} topN={parseInt(el.dataset.top ?? '', 10) || 5} headingTag={(el.dataset.heading || 'h1') as HeadingTag} />)
    // React warns about unmounting a root from inside its own commit, so the unmount waits a tick. It happens only once the element has left the
    // page; development's double effect keeps the root it already has.
    return () => {
      queueMicrotask(() => {
        if (el.isConnected) return
        root.unmount()
        roots.delete(el)
      })
    }
  }, [])
  return null
}
