import type {PAGE_QUERY_RESULT, SITE_SETTINGS_QUERY_RESULT} from '@/sanity/types'
import {Cta} from './Cta'
import {Multiline, RichText} from './RichText'
import {SanityImage} from './SanityImage'
import type {HeroVariant, SectionVariant} from './variants'

type Section = NonNullable<NonNullable<PAGE_QUERY_RESULT>['sections']>[number]
type Of<T extends Section['_type']> = Extract<Section, {_type: T}>
type Ctas = Of<'heroSection'>['ctas']

const everyBlock = (blocks: unknown[] | undefined, className?: string) => Object.fromEntries((blocks ?? []).map((_, i) => [i, className ?? '']))

function CtaList({ctas, classes}: {ctas: Ctas; classes: string[]}) {
  return (
    <>
      {ctas?.map((c, i) => (
        <Cta key={c._key} cta={c} className={classes[i] ?? classes[classes.length - 1]} />
      ))}
    </>
  )
}

function Hero({s, v}: {s: Of<'heroSection'>; v: HeroVariant}) {
  const Wrap = v.wrap.tag
  const Eyebrow = v.eyebrow.tag
  const content = (
    <>
      {s.eyebrow && <Eyebrow className={v.eyebrow.className}>{s.eyebrow}</Eyebrow>}
      <h1 className={v.h1Class}>
        <Multiline text={s.heading} />
      </h1>
      <RichText value={s.lead} classes={v.ledeClass ? everyBlock(s.lead, v.ledeClass) : undefined} linkStyle={v.linkStyle} />
      {s.ctas?.length ? v.ctaWrap ? <div className={v.ctaWrap}><CtaList ctas={s.ctas} classes={v.ctaClasses ?? []} /></div> : <CtaList ctas={s.ctas} classes={v.ctaClasses ?? []} /> : null}
    </>
  )
  return (
    <Wrap className={v.wrap.className}>
      {v.inner ? <div>{content}</div> : content}
      <SanityImage image={s.image} priority />
    </Wrap>
  )
}

/** The footnote under the closing band's buttons: "Or call (971) 254-1565", with the tel: link built from the site settings phone. */
function CallLine({text, phone}: {text: string; phone?: string}) {
  const m = /^(.*?)(\(\d{3}\) \d{3}-\d{4})$/.exec(text)
  if (!m || !phone) throw new Error(`Cannot build a call line from "${text}" and phone "${phone}"`)
  return (
    <p style={{margin: '18px 0 0', fontSize: '14px'}}>
      {m[1]}
      <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} style={{color: 'var(--accent-dark)', fontWeight: 600}}>
        {m[2]}
      </a>
    </p>
  )
}

function SectionView({s, v, settings}: {s: Section; v: SectionVariant; settings: NonNullable<SITE_SETTINGS_QUERY_RESULT>}) {
  switch (s._type) {
    case 'heroSection':
      return <Hero s={s} v={v as HeroVariant} />
    case 'richSection': {
      const rv = v as Extract<SectionVariant, {type: 'richSection'}>
      return (
        <div className={rv.wrap}>
          {s.heading && (
            <h2>
              <Multiline text={s.heading} />
            </h2>
          )}
          <RichText value={s.body} classes={rv.classes} />
        </div>
      )
    }
    case 'stepsSection': {
      const sv = v as Extract<SectionVariant, {type: 'stepsSection'}>
      return (
        <div className={sv.wrap}>
          {s.heading && <h2>{s.heading}</h2>}
          <div className="steps">
            {s.steps?.map((st) => (
              <div className="step" key={st._key}>
                <div className="step-num">{st.marker}</div>
                <h3>{st.title}</h3>
                <p>{st.body}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'cardSection': {
      const cv = v as Extract<SectionVariant, {type: 'cardSection'}>
      return (
        <div className={cv.wrap}>
          {s.heading && <h2>{s.heading}</h2>}
          <div className="fac-grid">
            {s.cards?.map((c) => (
              <div className="fac-card" key={c._key}>
                <h3>{c.href ? <a href={c.href}>{c.title}</a> : c.title}</h3>
                <p>{c.body}</p>
              </div>
            ))}
          </div>
          <RichText value={s.sourceNote} classes={cv.noteClasses} />
        </div>
      )
    }
    case 'accordionSection': {
      const av = v as Extract<SectionVariant, {type: 'accordionSection'}>
      return (
        <div className={av.wrap}>
          {s.heading && <h2>{s.heading}</h2>}
          {s.items?.map((it) => (
            <details key={it._key}>
              <summary>{it.question}</summary>
              <RichText value={it.answer} />
            </details>
          ))}
        </div>
      )
    }
    case 'ctaSection': {
      const tv = v as Extract<SectionVariant, {type: 'ctaSection'}>
      const Heading = tv.headingTag
      const buttons = <CtaList ctas={s.ctas} classes={tv.ctaClasses} />
      return (
        <div className={tv.wrap}>
          {s.heading && <Heading>{s.heading}</Heading>}
          <RichText value={s.body} />
          {tv.ctaWrap ? <div className={tv.ctaWrap}>{buttons}</div> : buttons}
          {s.footnote && tv.footnote === 'call' && <CallLine text={s.footnote} phone={settings.phone} />}
        </div>
      )
    }
    case 'toolSection':
      // The Fall Risk tool mounts here; the tool itself arrives in P5. The no-JavaScript fallback is tool copy, so it stays in code
      // (the P2 extraction never saw it: it sits in a <noscript>).
      return (
        <div id={s.anchorId} data-api="/api/fall-risk-regions" data-top="5" data-heading="h2">
          <noscript>
            <section className="fr">
              <p className="fr-eyebrow">MEND Fall Risk Check</p>
              <h2 className="fr-title">How likely is a fall — and what would change it?</h2>
              <p className="fr-lede">
                This check needs JavaScript to score your answers in the browser. The questions come from the CDC’s STEADI “Stay Independent” screener, which you can
                complete on paper instead: a score of 4 or more out of 14 is the point at which clinicians begin screening for falls.
              </p>
              <p className="fr-note">
                Whatever your score, two things help almost everyone — asking a pharmacist to review every medicine you take, including anything over the counter,
                and getting your eyes checked once a year.
              </p>
            </section>
          </noscript>
        </div>
      )
    default:
      throw new Error(`Section type ${s._type} has no renderer yet`)
  }
}

/** Renders a page's sections in order. `first` and `count` let a page lay out part of the list itself (Privacy-Terms). */
export function Sections({sections, variants, settings, page}: {sections?: Section[]; variants: SectionVariant[]; settings: NonNullable<SITE_SETTINGS_QUERY_RESULT>; page: string}) {
  const list = sections ?? []
  if (list.length !== variants.length) throw new Error(`${page}: ${list.length} sections in the document, ${variants.length} in the variant table`)
  return (
    <>
      {list.map((s, i) => {
        if (variants[i].type !== s._type) throw new Error(`${page}: section ${i} is ${s._type}, the variant table expects ${variants[i].type}`)
        return <SectionView key={s._key} s={s} v={variants[i]} settings={settings} />
      })}
    </>
  )
}
