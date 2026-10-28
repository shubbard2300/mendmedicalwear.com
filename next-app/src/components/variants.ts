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
export type RichVariant = {
  type: 'richSection'
  wrap: string
  classes?: Record<number, string>
  /** Inline styles the live page puts on a panel around the text and on paragraphs by node index. */
  panel?: CSSProperties
  styles?: Record<number, CSSProperties>
}
export type StepsVariant = {type: 'stepsSection'; wrap: string}
export type ComparisonVariant = {type: 'comparisonSection'; wrap: string}
export type CardsVariant = {type: 'cardSection'; wrap: string; noteClasses?: Record<number, string>}
export type AccordionVariant = {type: 'accordionSection'; wrap: string}
export type CtaVariant = {type: 'ctaSection'; wrap: string; headingTag: 'h2' | 'h3'; ctaWrap?: string; ctaClasses: string[]; footnote?: 'call'}
/** `inSection`: the mount sits inside `div.section#<anchorId>` and carries its own no-JavaScript fallback (the product pages), not the Fall Risk page's. */
export type ToolVariant = {type: 'toolSection'; inSection?: 'airguard'}
export type SectionVariant = HeroVariant | RichVariant | StepsVariant | ComparisonVariant | CardsVariant | AccordionVariant | CtaVariant | ToolVariant

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

// Product pages. The document's sections run: the bundle note (it sits in the info column, so the page lays it out), the blocks below the
// product area (these tables), then the branding copy and its button (BrandIt).
const steps: SectionVariant = {type: 'stepsSection', wrap: 'section'}
const compare: SectionVariant = {type: 'comparisonSection', wrap: 'section'}

export const PRODUCT_VARIANTS: Record<string, {below: SectionVariant[]}> = {
  // The apparel pages: the steps, then (laid out by ViewsGrid, not here) the views section, then the comparison grids.
  'stylish-washable-hospital-gown': {below: [steps, compare, compare]},
  'residential-nurse-scrub-set': {below: [steps, compare]},
  // The socks page: the steps, then (laid out by the page) the webbing, color and non-slip blocks, then the comparison grid.
  'compression-socks': {below: [steps, compare]},
  'airguard-collar': {
    below: [
      {type: 'stepsSection', wrap: 'section'},
      {type: 'comparisonSection', wrap: 'section'},
      {
        type: 'richSection',
        wrap: 'section',
        panel: {background: 'var(--panel)', borderRadius: '12px', padding: '28px', marginTop: '8px'},
        styles: {0: {fontSize: '15px', marginBottom: '12px'}, 1: {fontSize: '15px', marginBottom: '12px'}, 2: {fontSize: '14px', color: 'var(--muted)'}},
      },
      {type: 'toolSection', inSection: 'airguard'},
    ],
  },
}

// The apparel pages (gown, scrubs). The stored content fills the options, tables and photos; what the live markup adds around them is here:
// which photo the thumbnails and view cards show, their alt text and captions where none is stored, the tooltip line, and the defaults.
export type Gender = 'female' | 'male'
type View = 'front' | 'back' | 'pockets'
type PhotoKey = {gender: Gender; view: View; closure?: 'front'; color?: string}

export type ViewCard = {gender: Gender; view: View; id: string; alt: string; caption?: string}
export type ViewsSpec = {
  wrapId?: string
  tooltip: string
  lazy?: boolean
  subheads?: Record<Gender, string>
  cards: ViewCard[]
  match: (card: {gender: Gender; view: View}) => PhotoKey
}
export type ThumbSpec = {key: {gender: Gender; view: View}; alt: string; ariaLabel?: string; showGender?: boolean}
export type ApparelPage = {
  thumbs: ThumbSpec[]
  colorShowsValue: boolean
  defaultSize: string
  /** The scrubs' bundle offer starts with this sock color. */
  bundleColor?: string
  views: ViewsSpec
}

const GOWN_TOOLTIP = 'Click to preview this view in your selected color, on the main image above.'
const SCRUBS_CAPTIONS: Record<View, string> = {
  front: 'Front: V-neck, chest pocket, two lower pockets',
  back: 'Back: yoke seam, back patch pocket on the pant',
  pockets: 'Pockets in use: chest, lower and side pockets',
}

export const APPAREL_PAGES: Record<string, ApparelPage> = {
  'stylish-washable-hospital-gown': {
    thumbs: [
      {key: {gender: 'female', view: 'front'}, alt: 'Female front', showGender: true},
      {key: {gender: 'female', view: 'back'}, alt: 'Female back', showGender: true},
      {key: {gender: 'male', view: 'front'}, alt: 'Male front', showGender: true},
      {key: {gender: 'male', view: 'back'}, alt: 'Male back', showGender: true},
    ],
    colorShowsValue: false,
    defaultSize: 'M',
    views: {
      tooltip: GOWN_TOOLTIP,
      cards: [
        {gender: 'female', view: 'front', id: 'FF', alt: 'Female front view'},
        {gender: 'female', view: 'back', id: 'FB', alt: 'Female back view'},
        {gender: 'male', view: 'front', id: 'MF', alt: 'Male front view'},
        {gender: 'male', view: 'back', id: 'MB', alt: 'Male back view'},
      ],
      match: ({gender, view}) => ({gender, view, closure: 'front', color: undefined}), // the default photos: front zip, no color
    },
  },
  'residential-nurse-scrub-set': {
    thumbs: [
      {key: {gender: 'female', view: 'front'}, alt: 'Front view', ariaLabel: 'Front view'},
      {key: {gender: 'female', view: 'back'}, alt: 'Back view', ariaLabel: 'Back view'},
      {key: {gender: 'female', view: 'pockets'}, alt: 'Pockets in use', ariaLabel: 'Pockets in use'},
    ],
    colorShowsValue: true,
    defaultSize: 'M',
    bundleColor: 'Sage',
    views: {
      wrapId: 'viewsSection',
      tooltip: 'Click to preview this view on the main image above.',
      lazy: true,
      subheads: {female: "Women's", male: "Men's"},
      cards: (['female', 'male'] as const).flatMap((gender) =>
        (['front', 'back', 'pockets'] as const).map((view) => ({
          gender,
          view,
          id: `${gender === 'female' ? 'F' : 'M'}${view === 'front' ? 'F' : view === 'back' ? 'B' : 'P'}`,
          alt: `${gender === 'female' ? "Women's" : "Men's"} ${view} view`,
          caption: SCRUBS_CAPTIONS[view],
        })),
      ),
      match: ({gender, view}) => ({gender, view, color: 'Sage'}), // the default color's photos
    },
  },
}

// Marketing pages (MEND App, Pulse, Oxi). The reveal-delay class of each repeated card cannot be derived (Oxi's four feature cards run
// none, d1, d2, d1), so each page lists them as the live file has them. Components throw if a count differs from the document's.
export type MarketingPage = {cardDelays: string[]; pairDelays?: string[]; designDelays?: string[]; securityDelays?: string[]; deviceDelays?: string[]}
export const MARKETING_PAGES: Record<string, MarketingPage> = {
  'mend-app': {cardDelays: ['', 'rv-d1', 'rv-d2', 'rv-d3'], securityDelays: ['', 'rv-d1', 'rv-d2', 'rv-d3'], deviceDelays: ['', 'rv-d1', 'rv-d2']},
  'mend-oxi': {cardDelays: ['', 'rv-d1', 'rv-d2', 'rv-d1'], pairDelays: ['', 'rv-d1', 'rv-d2']},
  'mend-pulse': {cardDelays: ['', 'rv-d1', 'rv-d2', 'rv-d3'], designDelays: ['', 'rv-d1', 'rv-d2', 'rv-d3']},
}

/** The socks' size row starts on this size. */
export const SOCKS_DEFAULT_SIZE = 'M/L'

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
