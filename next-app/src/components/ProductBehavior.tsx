'use client'

import {useEffect} from 'react'
import {initBrandIt} from '@/behavior/brandit'
import {initGown, initScrubs, initSocks, initZoomLens, type GownData, type ScrubsData} from '@/behavior/product'

type Props = {page: 'gown'; data: GownData} | {page: 'scrubs'; data: ScrubsData} | {page: 'socks' | 'airguard'; data?: undefined}

// Renders nothing. A product page's markup is server-rendered and proven against the live file; this attaches what the page's own inline script
// did (the zoom lens, the pickers and galleries, and the logo preview) after hydration and removes it again on unmount. The photo tables arrive as
// props because the live scripts built file names that the Sanity CDN addresses do not follow. Imported by the four product pages only.
export function ProductBehavior(props: Props) {
  useEffect(() => {
    const stops = [initZoomLens(), initBrandIt(props.page)]
    if (props.page === 'gown') stops.push(initGown(props.data))
    if (props.page === 'scrubs') stops.push(initScrubs(props.data))
    if (props.page === 'socks') stops.push(initSocks())
    return () => stops.forEach((stop) => stop())
    // The tables never change for a mounted page, so only the page decides when to attach again.
  }, [props.page])
  return null
}
