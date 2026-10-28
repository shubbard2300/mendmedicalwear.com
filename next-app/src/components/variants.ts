import type {CSSProperties} from 'react'

// The sections hold content, not markup, so the wrappers and class names the live pages use live here, one entry per section in document
// order. Sections.tsx throws if a page's sections do not match its list, so a document edit that adds or reorders sections fails the
// build instead of rendering the wrong markup. The tags and classes are copied from the live files.

type Tag = 'div' | 'section' | 'p'

export type HeroVariant = {
  type: 'heroSection'
  wrap: {tag: 'div' | 'section'; className: string}
  /** Facilities: the text sits in a plain inner div and the photo follows it. */
  inner?: boolean
  eyebrow: {tag: Tag; className: string}
  h1Class?: string
  ledeClass?: string
  linkStyle?: CSSProperties
  ctaWrap?: string
  ctaClasses?: string[]
}
export type RichVariant = {type: 'richSection'; wrap: string; classes?: Record<number, string>}
export type StepsVariant = {type: 'stepsSection'; wrap: string}
export type CardsVariant = {type: 'cardSection'; wrap: string; noteClasses?: Record<number, string>}
export type AccordionVariant = {type: 'accordionSection'; wrap: string}
export type CtaVariant = {type: 'ctaSection'; wrap: string; headingTag: 'h2' | 'h3'; ctaWrap?: string; ctaClasses: string[]; footnote?: 'call'}
export type ToolVariant = {type: 'toolSection'}
export type SectionVariant = HeroVariant | RichVariant | StepsVariant | CardsVariant | AccordionVariant | CtaVariant | ToolVariant

const contactLink: CSSProperties = {color: 'var(--accent-dark)', textDecoration: 'underline', textUnderlineOffset: '2px'}

const pageHero = (linkStyle?: CSSProperties): HeroVariant => ({
  type: 'heroSection',
  wrap: {tag: 'div', className: 'page-hero section'},
  eyebrow: {tag: 'div', className: 'eyebrow'},
  linkStyle,
})

export const PAGE_VARIANTS: Record<string, SectionVariant[]> = {
  FAQ: [pageHero(contactLink), {type: 'ctaSection', wrap: 'faq-cta section', headingTag: 'h3', ctaClasses: ['btn btn-primary']}],

  // Privacy-Terms: only the hero goes through Sections; the notice, tabs and the two panels are laid out in the page (they share one div).
  'Privacy-Terms': [pageHero(contactLink)],

  facilities: [
    {
      type: 'heroSection',
      wrap: {tag: 'div', className: 'fac-hero'},
      inner: true,
      eyebrow: {tag: 'div', className: 'fac-eyebrow'},
      ledeClass: 'fac-lede',
      ctaWrap: 'fac-cta',
      ctaClasses: ['btn btn-primary', 'btn btn-secondary'],
    },
    {type: 'cardSection', wrap: 'section'},
    {type: 'stepsSection', wrap: 'section'},
    {type: 'richSection', wrap: 'section', classes: {0: 'fac-list'}},
    {type: 'cardSection', wrap: 'fac-products section', noteClasses: {0: 'fac-note'}},
    {type: 'accordionSection', wrap: 'fac-faq section'},
    {type: 'ctaSection', wrap: 'fac-band', headingTag: 'h2', ctaWrap: 'fac-cta', ctaClasses: ['btn btn-primary', 'btn btn-secondary'], footnote: 'call'},
  ],

  'fall-risk-assessment': [
    {type: 'heroSection', wrap: {tag: 'section', className: 'fr fr-intro'}, eyebrow: {tag: 'p', className: 'fr-eyebrow'}, h1Class: 'fr-title', ledeClass: 'fr-lede'},
    {type: 'toolSection'},
  ],
}

// Home product cards: the three markups the live cards use, by card position. The cards store the name, price line, badges, photos and
// the reserve or waitlist button; the price markup, the badge icon and the Learn More link are code. HomeSections throws if the count changes.
export type HomeCardKind = 'apparel' | 'device' | 'app'
export const HOME_CARD_KINDS: HomeCardKind[] = ['apparel', 'apparel', 'apparel', 'apparel', 'device', 'device', 'device', 'app']

// FAQ jump chips: two groups are chipped under a shorter name than their heading. The chip text is not stored in Sanity (the builder
// rebuilt the chips from the group titles), so these two labels live here until a chip-label field is added to faqGroup.
export const FAQ_CHIP_LABELS: Record<string, string> = {airguard: 'AirGuard™', returns: 'Returns'}

// Fall Risk guide: the class of each node of the page body (a run of list items is one node).
const h2 = 'fr-h3 fr-h3-spaced'
export const FALL_RISK_GUIDE_CLASSES: Record<number, string> = {
  0: h2, 1: 'fr-lede', 2: 'fr-note',
  3: h2, 4: 'fr-note', 6: 'fr-note fr-note-quiet', 7: 'fr-note fr-note-quiet', // node 5 is the table (class fr-table, set by the page)
  8: h2, 9: 'fr-h4', 10: 'fr-note', 11: 'fr-h4', 12: 'fr-note', 13: 'fr-h4', 14: 'fr-note', 15: 'fr-h4', 16: 'fr-note',
  17: h2, 18: 'fr-note', 19: 'fr-disclaimer', 20: 'fr-source',
  21: h2, 22: 'fr-note', 23: 'fr-note', 24: 'fr-note',
}
