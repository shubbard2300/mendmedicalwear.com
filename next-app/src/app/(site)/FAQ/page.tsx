import type {Metadata} from 'next'
import {Footer} from '@/components/Footer'
import {Header} from '@/components/Header'
import {JsonLd} from '@/components/JsonLd'
import {RichText} from '@/components/RichText'
import {Sections} from '@/components/Sections'
import {FAQ_CHIP_LABELS, PAGE_VARIANTS} from '@/components/variants'
import {sanityFetch} from '@/sanity/fetch'
import {pageMetadata} from '@/sanity/head'
import {faqPageLd} from '@/sanity/jsonld'
import {loadPage} from '@/sanity/load'
import {FAQ_QUERY} from '@/sanity/queries'
import '@/styles/pages/faq.css'

const SLUG = 'FAQ'
const PATH = '/FAQ'

export async function generateMetadata(): Promise<Metadata> {
  const {doc, settings} = await loadPage(SLUG)
  return pageMetadata({seo: doc.seo, path: PATH, settings})
}

export default async function FaqPage() {
  const {doc, settings} = await loadPage(SLUG)
  const groups = await sanityFetch({query: FAQ_QUERY})
  const [hero, cta] = [PAGE_VARIANTS.FAQ.slice(0, 1), PAGE_VARIANTS.FAQ.slice(1)]

  return (
    <>
      <JsonLd data={faqPageLd(groups, PATH)} />
      <div className="wrap">
        <Header menu={doc.navMenu} />
        <div id="modalBody">
          <Sections sections={doc.sections?.slice(0, 1)} variants={hero} settings={settings} page={SLUG} />
          <div className="faq-nav section">
            {groups.map((g) => (
              <a key={g._id} href={`#${g.anchorId}`}>
                {FAQ_CHIP_LABELS[g.anchorId] ?? g.title}
              </a>
            ))}
          </div>
          {groups.map((g) => (
            <div key={g._id} id={g.anchorId} className="faq-group section">
              <h2>{g.title}</h2>
              {g.items.map((item) => (
                <div className="faq-item" key={item._id}>
                  <button className="faq-q">
                    {item.question} <span className="faq-icon">+</span>
                  </button>
                  <div className="faq-a">
                    <RichText value={item.answer} bare />
                  </div>
                </div>
              ))}
            </div>
          ))}
          <Sections sections={doc.sections?.slice(1)} variants={cta} settings={settings} page={SLUG} />
        </div>
        <Footer note={doc.footerNote} copyright={settings.copyright} menu={doc.footerMenu} />
      </div>
    </>
  )
}
