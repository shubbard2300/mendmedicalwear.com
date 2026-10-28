import type {Metadata} from 'next'
import type {CSSProperties} from 'react'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {RichText} from '@/components/RichText'
import {Sections} from '@/components/Sections'
import {PAGE_VARIANTS} from '@/components/variants'
import {pageMetadata} from '@/sanity/head'
import {loadPage} from '@/sanity/load'
import type {BlockContent} from '@/sanity/types'
import '@/styles/pages/privacy-terms.css'

const SLUG = 'Privacy-Terms'
const PATH = '/Privacy-Terms'

export async function generateMetadata(): Promise<Metadata> {
  const {doc, settings} = await loadPage(SLUG)
  return pageMetadata({seo: doc.seo, path: PATH, settings})
}

// One legal document: the effective-date line, the contents list (up to the first h2), then the numbered sections with ids p1.. / t1..
function LegalPanel({id, prefix, active, body, lastStyle}: {id: string; prefix: string; active?: boolean; body?: BlockContent; lastStyle?: CSSProperties}) {
  const blocks = body ?? []
  const firstHeading = blocks.findIndex((b) => b._type === 'block' && b.style === 'h2')
  if (blocks.length < 3 || firstHeading < 2) throw new Error(`${id}: expected an effective-date line, a contents list and numbered sections`)
  return (
    <div id={id} className={active ? 'active doc-panel' : 'doc-panel'}>
      <div className="legal-body">
        <div className="updated">
          <RichText value={blocks.slice(0, 1)} bare />
        </div>
        <div className="legal-toc">
          <RichText value={blocks.slice(1, firstHeading)} />
        </div>
        <RichText value={blocks.slice(firstHeading)} h2IdPrefix={prefix} lastStyle={lastStyle} />
      </div>
    </div>
  )
}

export default async function PrivacyTermsPage() {
  const {doc, settings} = await loadPage(SLUG)
  const [notice, privacy, terms] = (doc.sections ?? []).slice(1)
  if (notice?._type !== 'richSection' || privacy?._type !== 'richSection' || terms?._type !== 'richSection') throw new Error(`${SLUG}: expected hero, notice, privacy and terms sections`)

  return (
    <div className="wrap">
      <Header menu={doc.navMenu} />
      <div id="modalBody">
        <Sections sections={doc.sections?.slice(0, 1)} variants={PAGE_VARIANTS[SLUG]} settings={settings} page={SLUG} />
        <div className="section">
          <div className="legal-notice" role="note">
            <RichText value={notice.body} bare />
          </div>
          <div className="doc-tabs">
            <button className="active doc-tab">{privacy.heading}</button>
            <button className="doc-tab">{terms.heading}</button>
          </div>
          <LegalPanel id="privacy" prefix="p" active body={privacy.body} />
          <LegalPanel id="terms" prefix="t" body={terms.body} lastStyle={{marginTop: '40px', fontSize: '13px', color: 'var(--muted)'}} />
        </div>
      </div>
      <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
    </div>
  )
}
