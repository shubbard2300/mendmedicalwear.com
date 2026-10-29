import {Fragment, type CSSProperties} from 'react'
import type {PRODUCT_QUERY_RESULT} from '@/sanity/types'
import {Cta} from './Cta'
import {ICONS} from './icons'
import {Multiline, RichText} from './RichText'
import {SanityImage} from './SanityImage'

// The pieces MEND App, Pulse and Oxi share: their own header and footer (not the site's), a hero, a statement band, the features section,
// the spec table and the closing call-to-action band. Wrappers and class names are copied from the live pages; the page supplies the
// reveal-delay classes (variants.ts), which cannot be derived.

type Product = NonNullable<PRODUCT_QUERY_RESULT>
type Section = NonNullable<Product['sections']>[number]
export type Of<T extends Section['_type']> = Extract<Section, {_type: T}>

const cn = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

/** The icons the markup uses directly (the documents store the rest as keys). */
export const BRAND_CROSS = '5411d932fb'

/** An icon from the generated table. */
export function Icon({id}: {id?: string}) {
  const icon = id ? ICONS[id] : undefined
  if (!icon) throw new Error(`No icon for key ${id ?? '(none)'}`)
  return <svg {...icon.attrs} dangerouslySetInnerHTML={{__html: icon.inner}} />
}

/** The links come from the page's nav menu; its last item is the pill. */
export function MarketingHeader({menu}: {menu: Product['navMenu']}) {
  const items = menu?.items ?? []
  const pill = items[items.length - 1]
  return (
    <header id="hdr">
      <div className="nav">
        <a className="nav-brand" href="/">
          <span className="cross">
            <Icon id={BRAND_CROSS} />
          </span>{' '}
          MEND&nbsp;<small>Medical</small>
        </a>
        <nav className="nav-links">
          <span className="nav-menu" id="deviceNav">
            {items.slice(0, -1).map((item, i) => (
              <Fragment key={item._key}>
                {i > 0 && ' '}
                <a href={item.href}>{item.label}</a>
              </Fragment>
            ))}
          </span>
          {pill && (
            <a href={pill.href} className="pill">
              {pill.label}
            </a>
          )}
        </nav>
        <button type="button" className="nav-toggle" aria-label="Menu" aria-expanded="false" aria-controls="deviceNav">
          <span className="nav-toggle-bars"></span>
        </button>
      </div>
    </header>
  )
}

// The live separator between footer links: a space, a non-breaking space, a middle dot, a non-breaking space and a space.
const SEPARATOR = '  ·  '

/** The footer note is stored as one string: the brand sentence ("MEND Medical — connected care ...") and the line about the product. */
export function MarketingFooter({note, menu}: {note?: string; menu: Product['footerMenu']}) {
  const cut = (note ?? '').indexOf('. ')
  const first = cut < 0 ? '' : note!.slice(0, cut + 1)
  const brand = first.split(' — ')[0]
  if (!first || brand === first) throw new Error(`The footer note does not start with a "Brand — sentence." line: ${note}`)
  return (
    <footer>
      <div className="rule"></div>
      <p>
        <b style={{color: '#B9CBDD'}}>{brand}</b>
        {first.slice(brand.length)}
      </p>
      <p>{note!.slice(cut + 2)}</p>
      <p>
        {menu?.items?.map((item, i) => (
          <Fragment key={item._key}>
            {i > 0 && SEPARATOR}
            <a href={item.href}>{item.label}</a>
          </Fragment>
        ))}
      </p>
    </footer>
  )
}

const NOTE_LINK: CSSProperties = {color: 'inherit', fontWeight: 600}

/** The device page hero: kicker, name, lead, buttons, a note, the photo and three floating specs. `imageStyle`: one live photo carries its own radius. */
export function Hero({s, imageStyle}: {s: Of<'heroSection'>; imageStyle?: CSSProperties}) {
  const [brand, ...rest] = (s.heading ?? '').split(' ')
  return (
    <div className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <span className="kicker">{s.eyebrow}</span>
            <h1>
              {`${brand} `}
              <span>{rest.join(' ')}</span>
            </h1>
            <RichText value={s.lead} classes={{0: 'sub'}} />
            <div className="hero-ctas">
              {s.ctas?.map((c, i) => (
                <Cta key={c._key} cta={c} link className={i === 0 ? 'btn btn-primary' : 'btn btn-glass'} />
              ))}
            </div>
            <RichText value={s.note} classes={{0: 'hero-note'}} linkStyle={NOTE_LINK} />
          </div>
          <div className="device-stage">
            <SanityImage image={s.image} className="hero-illo" style={imageStyle} />
            {s.floatingSpecs?.map((f, i) => (
              <div key={f._key} className={`spec-float sf-${i + 1}`}>
                <b>{f.value}</b>
                {f.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/** The statement band: one paragraph with an emphasized run, and the "who it is for" chips. */
export function Statement({s}: {s: Of<'statementSection'>}) {
  return (
    <div className="statement">
      <div className="wrap">
        <RichText value={s.body} classes={{0: 'rv'}} />
        <div className="who rv rv-d1">
          {s.chips?.map((chip, i) => (
            <span key={i}>{chip}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Four big feature cards (`delays`: their reveal classes), the mini items, and the source note. */
export function Features({s, delays}: {s: Of<'cardSection'>; delays: string[]}) {
  if (delays.length !== (s.cards?.length ?? 0)) throw new Error(`Features: ${s.cards?.length ?? 0} cards but ${delays.length} reveal delays`)
  return (
    <section className="features" id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">
          <Multiline text={s.heading} />
        </h2>
        <div className="feat-hero">
          {s.cards?.map((c, i) => (
            <div key={c._key} className={cn('fcard rv', delays[i])}>
              <div className="fi">
                <Icon id={c.icon} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
        <div className="feat-more">
          {s.miniItems?.map((m) => (
            <div key={m._key} className="fmini rv">
              <Icon id={m.icon} />
              {m.text}
            </div>
          ))}
        </div>
        {s.sourceNote && (
          <div className="source-note rv">
            <RichText value={s.sourceNote} legacy />
          </div>
        )}
      </div>
    </section>
  )
}

/** Oxi's "pair" section: a lede and linked cards. */
export function Pair({s, delays}: {s: Of<'relatedSection'>; delays: string[]}) {
  if (delays.length !== (s.items?.length ?? 0)) throw new Error(`Pair: ${s.items?.length ?? 0} cards but ${delays.length} reveal delays`)
  return (
    <section className="pair">
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">{s.heading}</h2>
        <p className="lede rv rv-d1">{s.intro}</p>
        <div className="pair-grid">
          {s.items?.map((it, i) => (
            <a key={it._key} className={cn('pcard rv', delays[i])} href={it.href}>
              <h3>{it.title}</h3>
              <p>{it.body}</p>
              <span className="go">{it.linkLabel}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The spec table and the cert strip. `plain`: the MEND App page's section carries an id and no class. */
export function Specs({s, plain}: {s: Of<'specSection'>; plain?: boolean}) {
  return (
    <section className={plain ? undefined : 'specs'} id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">{s.heading}</h2>
        <div className="spec-table rv rv-d1">
          {s.rows?.map((r) => (
            <div key={r._key} className="row">
              <span className="k">{r.label}</span>
              <span className="v">{r.value}</span>
            </div>
          ))}
        </div>
        <div className="cert-strip rv rv-d2">
          {s.certs?.map((c, i) => (
            <span key={i}>{c}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The closing band: heading, a line, and the first button primary, the rest quiet. */
export function CtaFinal({s}: {s: Of<'ctaSection'>}) {
  return (
    <section className="cta-final" id={s.anchorId}>
      <div className="wrap">
        <h2 className="rv">{s.heading}</h2>
        <RichText value={s.body} classes={{0: 'rv rv-d1'}} />
        <div className="row rv rv-d2">
          {s.ctas?.map((c, i) => (
            <Cta key={c._key} cta={c} link className={i === 0 ? 'btn btn-primary' : 'btn btn-quiet'} />
          ))}
        </div>
      </div>
    </section>
  )
}
