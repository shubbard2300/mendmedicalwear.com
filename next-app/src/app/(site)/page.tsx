import type {Metadata} from 'next'
import {notFound} from 'next/navigation'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {About, Carousel, Contact, HeroBanner, Partners, Products} from '@/components/HomeSections'
import {JsonLd} from '@/components/JsonLd'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {itemListLd, organizationLd} from '@/sanity/jsonld'
import {HOME_QUERY, SITE_SETTINGS_QUERY} from '@/sanity/queries'
import '@/styles/pages/home.css'

// generateMetadata and the page both load this; Next dedupes the fetches.
async function load() {
  const [home, settings] = await Promise.all([sanityFetch({query: HOME_QUERY}), sanityFetch({query: SITE_SETTINGS_QUERY})])
  if (!home?.heroBanner || !home.carousel || !home.about || !home.productsSection || !home.partners || !home.contact || !settings) notFound()
  return {home, settings, hero: home.heroBanner, carousel: home.carousel, about: home.about, products: home.productsSection, partners: home.partners, contact: home.contact}
}

export async function generateMetadata(): Promise<Metadata> {
  const {home, settings} = await load()
  return pageMetadata({seo: home.seo, path: '/', settings, social: true})
}

export default async function HomePage() {
  const {home, settings, hero, carousel, about, products, partners, contact} = await load()
  return (
    <>
      <JsonLd data={organizationLd(settings)} />
      <JsonLd data={itemListLd(home.seo, products.cards ?? undefined)} />
      <div className="wrap">
        <Header menu={home.navMenu} logoHref="#about" />
        <HeroBanner banner={hero} />
        <Carousel slides={carousel} />
        <About about={about} />
        <Products products={products} />
        <Partners partners={partners} />
        <Contact contact={contact} phone={settings.phone} />
        <Footer note={home.footerNote} copyright={settings.copyright} menu={home.footerMenu} />
      </div>
      <button className="to-top" id="toTop" aria-label="Back to top">
        ↑
      </button>
    </>
  )
}
