import {Fragment, type CSSProperties} from 'react'
import {Icon, type Of} from './Marketing'
import {Multiline, RichText} from './RichText'

// The four blocks only MEND Pulse has. The documents hold the words; the drawn cuff and phone (mock screens, callouts, aria labels, bar
// heights) are artwork and stay here, copied from the live page. Reveal-delay classes come from variants.ts.

const cn = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

// Icons the markup uses directly (the documents store the rest as keys): the minus mark, the check in a circle, the 34 x 16 arrow.
const MINUS = 'f5f87ea7b9'
const CHECK_CIRCLE = '308a59cd5c'
const ARROW = '47a447ecbf'

const CUFF_LABEL = 'MEND Pulse wireless blood pressure cuff: a cylindrical cuff with an on-cuff display showing 118 over 76, an integrated air pump, and an adjustable Velcro strap'
const CUFF_NOTES: [string, string][] = [
  ['On-cuff display', 'pairing · control · readings'],
  ['Integrated air pump', 'quiet, dampened inflation'],
  ['Adjustable Velcro strap', 'one-hand fit · 22–42 cm'],
  ['Lithium-ion battery', 'USB-C · up to 6 months'],
]

/** Industrial design: a lede, the drawn cuff with its mock reading and four callouts, and four cards (`delays`: their reveal classes). */
export function DesignSection({s, delays}: {s: Of<'cardSection'>; delays: string[]}) {
  if (delays.length !== (s.cards?.length ?? 0)) throw new Error(`DesignSection: ${s.cards?.length ?? 0} cards but ${delays.length} reveal delays`)
  return (
    <section className="design" id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">
          <Multiline text={s.heading} />
        </h2>
        <RichText value={s.intro} classes={{0: 'lede rv rv-d1'}} />
        <div className="device-stage rv rv-d2">
          <div className="cuff" role="img" aria-label={CUFF_LABEL}>
            <div className="body">
              <div className="screen">
                <div className="reading-sys num">118</div>
                <div className="reading-dia num">/ 76</div>
                <div className="reading-hr">
                  <span className="hr-dot"></span>
                  <span className="num">62 bpm</span>
                </div>
                <div className="sync-tag">paired · synced</div>
              </div>
              <div className="ports" aria-hidden="true">
                <i></i>
                <i></i>
              </div>
              <div className="pump" aria-hidden="true"></div>
            </div>
            <div className="cap" aria-hidden="true"></div>
            <div className="strap" aria-hidden="true"></div>
            {CUFF_NOTES.map(([title, text], i) => (
              <div key={title} className={`cuff-note cn-${i + 1}`}>
                <b>{title}</b>
                {text}
              </div>
            ))}
          </div>
        </div>
        <div className="design-grid">
          {s.cards?.map((c, i) => (
            <div key={c._key} className={cn('dcard rv', delays[i])}>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The ecosystem: each step is a node (icon, name, one line), with an arrow between neighbors. */
export function Ecosystem({s}: {s: Of<'stepsSection'>}) {
  return (
    <section id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">
          <Multiline text={s.heading} />
        </h2>
        <p className="lede rv rv-d1">{s.intro}</p>
        <div className="eco-flow rv rv-d2">
          {s.steps?.map((st, i) => (
            <Fragment key={st._key}>
              {i > 0 && (
                <div className="eco-link">
                  <Icon id={ARROW} />
                </div>
              )}
              <div className="eco-node">
                <div className="eco-icon">
                  <Icon id={st.icon} />
                </div>
                <b>{st.title}</b>
                <small>{st.body}</small>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </section>
  )
}

// The closing line is stored as one string; the live page wraps this run of it in a span.
const EMPHASIS = 'one quiet button,'

/** Benefits: the copy with a crossed-out list, and the "Tuesday morning" timeline beside it. */
export function Benefits({copy, morning}: {copy: Of<'richSection'>; morning: Of<'stepsSection'>}) {
  const closing = copy.closing ?? ''
  const at = closing.indexOf(EMPHASIS)
  if (at < 0) throw new Error(`Benefits: the closing line does not contain "${EMPHASIS}": ${closing}`)
  return (
    <section className="benefits">
      <div className="wrap">
        <div className="bene-grid">
          <div className="bene-copy">
            <span className="kicker rv">{copy.eyebrow}</span>
            <h2 className="rv">
              <Multiline text={copy.heading} />
            </h2>
            <RichText value={copy.body} classes={{0: 'big rv rv-d1'}} />
            <div className="no-list rv rv-d2">
              {copy.list?.map((item, i) => (
                <div key={i} className="no-item">
                  <Icon id={MINUS} />
                  <span className="strike">{item}</span>
                </div>
              ))}
            </div>
            <p className="bene-sum rv rv-d3">
              {closing.slice(0, at)}
              <span>{EMPHASIS}</span>
              {closing.slice(at + EMPHASIS.length)}
            </p>
          </div>
          <div className="morning rv rv-d1">
            <div className="mk">{morning.intro}</div>
            {morning.steps?.map((st) => (
              <div key={st._key} className="step-row">
                <span className="step-time num">{st.marker}</span>
                <div>
                  <b>{st.title}</b>
                  <p>{st.body}</p>
                </div>
              </div>
            ))}
            <div className="fin">
              <Icon id={CHECK_CIRCLE} />
              {morning.closing}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const PHONE_LABEL = "MEND App dashboard showing today's blood pressure reading, weekly trends and reminders"
const TREND = [66, 74, 58, 64, 52, 48, 44]
const REMINDERS: [string, string][] = [
  ['Evening medication', '8:00 PM'],
  ['Message from Dr. Osei', '2h ago'],
  ['RPM progress · 26/30 days', '87%'],
]
const APP_LINK: CSSProperties = {color: 'var(--blue)', fontWeight: 600, textDecoration: 'none'}

/** The app section: the drawn phone, and beside it the heading, lede (with its link to the App page) and the feature chips. */
export function AppSection({s}: {s: Of<'cardSection'>}) {
  return (
    <section id={s.anchorId}>
      <div className="wrap">
        <div className="app-grid">
          <div className="phone rv" role="img" aria-label={PHONE_LABEL}>
            <div className="phone-screen">
              <div className="ps-head">
                <b>Good morning, Alex</b>
                <span>MEND</span>
              </div>
              <div className="ps-card">
                <div className="l">Today&apos;s Reading</div>
                <div className="ps-bp">
                  <b className="num">118/76</b>
                  <span className="num">62 bpm</span>
                </div>
                <span className="ps-ok">In your target range</span>
              </div>
              <div className="ps-card">
                <div className="l">Weekly Trend</div>
                <div className="spark" aria-hidden="true">
                  {TREND.map((h) => (
                    <i key={h} style={{height: `${h}%`}}></i>
                  ))}
                </div>
              </div>
              {REMINDERS.map(([text, time]) => (
                <div key={text} className="ps-card">
                  <div className="ps-row">
                    <span className="dot"></span>
                    {text}
                    <small>{time}</small>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <span className="kicker rv">{s.eyebrow}</span>
            <h2 className="rv">
              <Multiline text={s.heading} />
            </h2>
            <RichText value={s.intro} classes={{0: 'lede rv rv-d1'}} linkStyle={APP_LINK} />
            <div className="app-list rv rv-d2">
              {s.miniItems?.map((m) => (
                <div key={m._key} className="app-chip">
                  <Icon id={m.icon} />
                  {m.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
