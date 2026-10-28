import type {Metadata} from 'next'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {JsonLd} from '@/components/JsonLd'
import {Sections} from '@/components/Sections'
import {PAGE_VARIANTS} from '@/components/variants'
import {pageMetadata} from '@/sanity/head'
import {breadcrumbLd} from '@/sanity/jsonld'
import {loadPage} from '@/sanity/load'
import '@/styles/pdp.css' // the live Facilities page also links pdp.css, ahead of its own inline block
import '@/styles/pages/facilities.css'

const SLUG = 'facilities'
const PATH = '/facilities'

export async function generateMetadata(): Promise<Metadata> {
  const {doc, settings} = await loadPage(SLUG)
  return pageMetadata({seo: doc.seo, path: PATH, settings, social: true})
}

export default async function FacilitiesPage() {
  const {doc, settings} = await loadPage(SLUG)
  return (
    <>
      <JsonLd data={breadcrumbLd(doc.seo, PATH)} />
      <div className="wrap">
        <Header menu={doc.navMenu} />
        <Sections sections={doc.sections} variants={PAGE_VARIANTS[SLUG]} settings={settings} page={SLUG} />
        <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
      </div>
    </>
  )
}
