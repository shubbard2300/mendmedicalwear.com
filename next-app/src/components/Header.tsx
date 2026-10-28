import type {PAGE_QUERY_RESULT} from '@/sanity/types'
import {Cta} from './Cta'

export type PageMenu = NonNullable<PAGE_QUERY_RESULT>['navMenu']

// The wordmark, the menu toggle and the nav id are copied from the live header; the links come from the page's nav menu document.
export function Header({menu}: {menu: PageMenu}) {
  return (
    <header>
      <a className="logo-link" href="/">
        <svg viewBox="0 0 320 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="MEND Medical Apparel logo">
          <g className="logo-mark" stroke="#7C8B7A" strokeWidth="3" strokeLinecap="round" fill="none">
            <line x1="45" y1="15" x2="45" y2="75" />
            <line x1="15" y1="45" x2="75" y2="45" />
            <line x1="22" y1="22" x2="68" y2="68" />
          </g>
          <text className="logo-text" x="100" y="58" fontFamily="Helvetica, Arial, sans-serif" fontSize="38" fontWeight="600" letterSpacing="8" fill="#2B2B28">
            MEND
          </text>
          <text className="logo-sub" x="101" y="80" fontFamily="Helvetica, Arial, sans-serif" fontSize="12" letterSpacing="4" fill="#8A857C">
            MEDICAL APPAREL
          </text>
        </svg>
      </a>
      <button className="nav-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="siteNav">
        <span className="nav-toggle-bars"></span>
      </button>
      <nav id="siteNav">
        {menu?.items?.map((item) => (
          <a key={item._key} href={item.href}>
            {item.label}
          </a>
        ))}
        {menu?.cta && <Cta cta={menu.cta} className="btn btn-primary btn-sm nav-reserve" />}
      </nav>
    </header>
  )
}
