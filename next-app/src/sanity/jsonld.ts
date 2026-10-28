import type {BlockContent, FAQ_QUERY_RESULT, HOME_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT, Seo} from './types'
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

export function organizationLd(settings: NonNullable<SITE_SETTINGS_QUERY_RESULT>) {
  return {
    '@context': CONTEXT,
    '@type': 'Organization',
    name: settings.siteName,
    url: absolute('/'),
    logo: absolute('/mend-logo.svg'),
    description: settings.organizationDescription,
    telephone: settings.phone,
    email: settings.contactEmail,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      telephone: settings.phone,
      email: settings.contactEmail,
      areaServed: 'US',
      availableLanguage: 'English',
    },
  }
}

type HomeCards = NonNullable<NonNullable<NonNullable<HOME_QUERY_RESULT>['productsSection']>['cards']>

// The home product list: each product once, in card order, named like its breadcrumb, with its first home card photo at today's address.
export function itemListLd(seo: Seo | undefined, cards: HomeCards | undefined) {
  const seen = new Set<string>()
  const items = (cards ?? []).flatMap((card) => {
    const p = card.product
    const file = card.images?.[0]?.file
    if (!p?.slug || !file || seen.has(p.slug)) return []
    seen.add(p.slug)
    const offers =
      p.offerKind === 'preOrder'
        ? {'@type': 'Offer', availability: 'https://schema.org/PreOrder'}
        : p.offerKind === 'free'
          ? {'@type': 'Offer', price: '0.00', priceCurrency: 'USD'}
          : undefined
    return [{'@type': 'Product', name: p.breadcrumbName, url: absolute(`/products/${p.slug}`), image: absolute(`/${file}`), ...(offers ? {offers} : {})}]
  })
  return {
    '@context': CONTEXT,
    '@type': 'ItemList',
    name: seo?.jsonLdName,
    itemListElement: items.map((item, i) => ({'@type': 'ListItem', position: i + 1, item})),
  }
}

/** A product page's Product block. `offers` follows the product's offer kind: a pre-order offer for apparel, none for AirGuard. `files` lists
 *  extra photos (the socks name three); otherwise the one image is the hero photo. */
export function productLd(seo: Seo | undefined, product: {heroFile?: string | null; files?: string[]; offerKind?: 'preOrder' | 'free' | 'none'}, path: string) {
  return {
    '@context': CONTEXT,
    '@type': 'Product',
    name: seo?.jsonLdName,
    description: seo?.jsonLdDescription,
    image: product.files?.length ? product.files.map((f) => absolute(`/${f}`)) : product.heroFile ? absolute(`/${product.heroFile}`) : undefined,
    brand: {'@type': 'Brand', name: seo?.brandName},
    ...(product.offerKind === 'preOrder' ? {offers: {'@type': 'Offer', availability: 'https://schema.org/PreOrder', url: absolute(path)}} : {}),
  }
}

/** The MEND App page is free: its price tags and its structured data state the same two values. */
export const FREE_PRICE = {price: '0.00', priceCurrency: 'USD'}

/** The MEND App page's SoftwareApplication block. The category and the operating systems are not stored, so they are here. */
export function softwareLd(seo: Seo | undefined, app: {heroFile?: string | null; offerKind?: 'preOrder' | 'free' | 'none'}) {
  return {
    '@context': CONTEXT,
    '@type': 'SoftwareApplication',
    name: seo?.jsonLdName,
    applicationCategory: 'HealthApplication',
    operatingSystem: 'iOS, Android',
    description: seo?.jsonLdDescription,
    image: app.heroFile ? absolute(`/${app.heroFile}`) : undefined,
    ...(app.offerKind === 'free' ? {offers: {'@type': 'Offer', ...FREE_PRICE}} : {}),
    publisher: {'@type': 'Organization', name: seo?.brandName},
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
