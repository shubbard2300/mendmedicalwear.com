import {blockContent} from './blockContent'
import {faqGroup, faqItem, homePage, menu, page, product, siteSettings} from './documents'
import {
  accordionSection,
  cardItem,
  cardSection,
  comparisonSection,
  ctaLink,
  ctaSection,
  heroSection,
  imageWithAlt,
  menuItem,
  miniItem,
  productCard,
  relatedSection,
  richSection,
  seo,
  specRow,
  specSection,
  statementSection,
  stepsSection,
  tableBlock,
  toolSection,
} from './objects'

export const schemaTypes = [
  // documents
  product,
  faqGroup,
  faqItem,
  menu,
  page,
  homePage,
  siteSettings,
  // reusable pieces
  blockContent,
  seo,
  imageWithAlt,
  ctaLink,
  tableBlock,
  cardItem,
  miniItem,
  specRow,
  menuItem,
  productCard,
  // page sections
  heroSection,
  statementSection,
  richSection,
  cardSection,
  stepsSection,
  comparisonSection,
  specSection,
  relatedSection,
  accordionSection,
  ctaSection,
  toolSection,
]

// One document each, with these exact ids.
export const singletonTypes = new Set(['homePage', 'siteSettings'])
