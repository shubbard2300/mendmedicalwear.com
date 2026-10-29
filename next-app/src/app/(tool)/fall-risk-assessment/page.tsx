import type {Metadata} from 'next'
import {FallRiskTool} from '@/components/FallRiskTool'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {JsonLd} from '@/components/JsonLd'
import {RichText} from '@/components/RichText'
import {Sections} from '@/components/Sections'
import {FALL_RISK_GUIDE_CLASSES, PAGE_VARIANTS} from '@/components/variants'
import {pageMetadata} from '@/sanity/head'
import {medicalWebPageLd} from '@/sanity/jsonld'
import {loadPage} from '@/sanity/load'

const SLUG = 'fall-risk-assessment'
const PATH = '/fall-risk-assessment'

export async function generateMetadata(): Promise<Metadata> {
  const {doc, settings} = await loadPage(SLUG)
  return pageMetadata({seo: doc.seo, path: PATH, settings})
}

export default async function FallRiskPage() {
  const {doc, settings} = await loadPage(SLUG)
  return (
    <>
      <JsonLd data={medicalWebPageLd(doc.seo, PATH)} />
      <div className="wrap">
        <Header menu={doc.navMenu} />
        <main>
          <Sections sections={doc.sections} variants={PAGE_VARIANTS[SLUG]} settings={settings} page={SLUG} />
          <section className="fr fr-guide">
            <RichText value={doc.body} classes={FALL_RISK_GUIDE_CLASSES} tableClass="fr-table" />
          </section>
        </main>
        <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
        <FallRiskTool />
      </div>
    </>
  )
}
