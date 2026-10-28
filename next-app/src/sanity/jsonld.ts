import type {BlockContent, FAQ_QUERY_RESULT, Seo} from './types'
import {absolute} from './head'

const CONTEXT = 'https://schema.org'

// The live JSON-LD carries plain spaces where the page text has non-breaking ones.
export function plainText(blocks?: BlockContent) {
  return (blocks ?? [])
    .map((b) => (b._type === 'block' ? (b.children ?? []).map((c) => c.text ?? '').join('') : ''))
    .join(' ')
    .replace(/ /g, ' ')
}

export function faqPageLd(groups: NonNullable<FAQ_QUERY_RESULT>, path: string) {
  return {
    '@context': CONTEXT,
    '@type': 'FAQPage',
    '@id': absolute(path),
    mainEntity: groups.flatMap((g) =>
      g.items.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {'@type': 'Answer', text: plainText(item.answer)},
      })),
    ),
  }
}

export function breadcrumbLd(seo: Seo | undefined, path: string) {
  return {
    '@context': CONTEXT,
    '@type': 'BreadcrumbList',
    itemListElement: [
      {'@type': 'ListItem', position: 1, name: 'Home', item: absolute('/')},
      {'@type': 'ListItem', position: 2, name: seo?.breadcrumbName, item: absolute(path)},
    ],
  }
}

export function medicalWebPageLd(seo: Seo | undefined, path: string) {
  return {
    '@context': CONTEXT,
    '@type': 'MedicalWebPage',
    name: seo?.jsonLdName,
    url: absolute(path),
    description: seo?.jsonLdDescription,
    audience: {'@type': 'Patient'},
    publisher: {'@type': 'Organization', name: seo?.brandName},
    citation: seo?.citations,
  }
}
