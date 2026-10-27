import {blockContent} from './blockContent'
import {faqItem, homePage, page, product, siteSettings} from './documents'
import {comparisonSection, ctaLink, ctaSection, imageWithAlt, richSection, seo, stepsSection, swatchSection} from './objects'

export const schemaTypes = [
  // documents
  product,
  faqItem,
  page,
  homePage,
  siteSettings,
  // reusable pieces
  blockContent,
  seo,
  imageWithAlt,
  ctaLink,
  richSection,
  stepsSection,
  swatchSection,
  comparisonSection,
  ctaSection,
]

// One document each, with these exact ids.
export const singletonTypes = new Set(['homePage', 'siteSettings'])
