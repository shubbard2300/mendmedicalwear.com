import {Cta} from './Cta'
import {Icon, type Of} from './Marketing'
import {Multiline, RichText} from './RichText'
import {SanityImage} from './SanityImage'

// The four blocks only the MEND App page has. The documents hold the words; the drawn phones (mock screens, toast, floating specs, bar
// heights) are artwork and stay here, copied from the live page. Reveal-delay classes come from variants.ts.

const cn = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')

// Icons the markup uses directly (the documents store the rest as keys): the hero cross, the two store marks, the check, the arrow.
const HERO_CROSS = 'aaf2cd589b'
const APPLE = '1b2eb6ea19'
const PLAY = 'ea7147b5c3'
const CHECK = '082055de78'
const ARROW = '3298d1b461'

// The document stores a store badge as one run-on string ("Download on theApp Store"); the live badge sets the two lines apart.
const STORES = [
  {small: 'Download on the', name: 'App Store', icon: APPLE},
  {small: 'Get it on', name: 'Google Play', icon: PLAY},
]

const FRONT_LABEL = 'MEND App showing a patient profile, a synced blood pressure reading, and a transmission in progress with each protocol step checked off'
const TREND = [66, 74, 58, 64, 52, 48, 44]
const DONE_STEPS = ['Imported & translated', 'Sanitized & formatted', 'Encrypted']

function PhoneStage() {
  return (
    <div className="phone-stage">
      <div className="phone phone-back" aria-hidden="true">
        <div className="phone-screen">
          <div className="ps-head">
            <b>Trends</b>
            <span>MEND</span>
          </div>
          <div className="ps-card">
            <div className="l">Weekly Blood Pressure</div>
            <div className="spark">
              {TREND.map((h) => (
                <i key={h} style={{height: `${h}%`}}></i>
              ))}
            </div>
          </div>
          <div className="ps-card">
            <div className="ps-row">
              <span className="dot"></span>SpO₂ · 98%<small>MEND Oxi</small>
            </div>
          </div>
          <div className="ps-card">
            <div className="ps-row">
              <span className="dot"></span>Health Score · 92<small>Great</small>
            </div>
          </div>
        </div>
      </div>
      <div className="phone phone-front" role="img" aria-label={FRONT_LABEL}>
        <div className="phone-screen">
          <div className="ps-head">
            <b>Good morning</b>
            <span>MEND</span>
          </div>
          <div className="ps-card">
            <div className="l">Patient</div>
            <div className="ps-patient">
              <span className="avatar">AR</span>
              <div>
                <b>Alex Rivera</b>
                <small>MEND Pulse · connected</small>
              </div>
              <span className="chg">Change</span>
            </div>
          </div>
          <div className="ps-card">
            <div className="l">New Reading · 7:04 AM</div>
            <div className="ps-row">
              <span className="dot"></span>118/76 · 62 bpm<small>MEND Pulse</small>
            </div>
          </div>
          <div className="ps-card">
            <div className="l">Sending to Dr. Osei</div>
            <div className="ps-progress">
              {DONE_STEPS.map((text) => (
                <div key={text} className="ps-step">
                  <span className="tick">
                    <Icon id={CHECK} />
                  </span>
                  {text}
                </div>
              ))}
              <div className="ps-step">
                <span className="spin" aria-hidden="true"></span>Transmitting securely…
              </div>
            </div>
          </div>
          <div className="ps-delivered">
            <Icon id={CHECK} />
            Yesterday&apos;s reading — delivered &amp; confirmed
          </div>
        </div>
      </div>
      <div className="toast-card" aria-hidden="true">
        <span className="td">
          <Icon id={CHECK} />
        </span>
        <div>
          <b>Synced to Dr. Osei</b>
          <small>Just now · delivery confirmed</small>
        </div>
      </div>
      <div className="spec-float sf-1">
        <b>Automatic</b>no manual steps
      </div>
      <div className="spec-float sf-2">
        <b>Encrypted</b>end to end
      </div>
    </div>
  )
}

/** The hero: kicker row with the cross tile, name, lead, two buttons, the store badges, the trust chips, a note, and the phone stage. */
export function AppHero({s}: {s: Of<'heroSection'>}) {
  const badges = s.storeBadges ?? []
  if (badges.length !== STORES.length) throw new Error(`AppHero: ${badges.length} store badges but ${STORES.length} labels`)
  const [brand, ...rest] = (s.heading ?? '').split(' ')
  return (
    <div className="hero">
      <div className="wrap">
        <div className="hero-grid">
          <div>
            <div className="hero-kicker-row">
              <span className="hero-icon">
                <Icon id={HERO_CROSS} />
              </span>
              <span className="kicker" style={{marginBottom: 0}}>
                {s.eyebrow}
              </span>
            </div>
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
            <div className="store-row">
              {badges.map((b, i) => {
                const {small, name, icon} = STORES[i]
                if (b.prefix !== small + name) throw new Error(`AppHero: store badge ${i} is "${b.prefix}", expected "${small + name}"`)
                return (
                  <a key={b._key} className="store-badge" href={b.href} data-modal={b.modal} data-product={b.product || undefined} aria-label={`${small} ${name}`}>
                    <Icon id={icon} />{' '}
                    <span>
                      <small>{small}</small>
                      <b>{name}</b>
                    </span>
                  </a>
                )
              })}
            </div>
            <div className="trust-row">
              {s.trustItems?.map((t) => (
                <span key={t._key} className="trust-chip">
                  <Icon id={t.icon} />
                  {t.text}
                </span>
              ))}
            </div>
            <p className="hero-note">
              <RichText value={s.note} legacy />
            </p>
          </div>
          <PhoneStage />
        </div>
      </div>
    </div>
  )
}

// Each of the two cards is stored as one string; the live page bolds one run of it.
const RETRY_BOLD = 'automatically retries'
const SUCCESS_BOLD = 'delivered to your provider, confirmed by email, receipted in your app.'

function Bold({text, run}: {text?: string; run: string}) {
  const body = text ?? ''
  const at = body.indexOf(run)
  if (at < 0) throw new Error(`Protocol: the card text does not contain "${run}": ${body}`)
  return (
    <>
      {body.slice(0, at)}
      <b>{run}</b>
      {body.slice(at + run.length)}
    </>
  )
}

/** The protocol: lede, the HIPAA source note (its own document section, laid out here), the seven-step pipeline, and the retry and success cards. */
export function Protocol({s, note}: {s: Of<'stepsSection'>; note: Of<'richSection'>}) {
  const [retry, success, ...extra] = s.callouts ?? []
  if (!retry || !success || extra.length) throw new Error(`Protocol: expected two cards (retry, success), found ${s.callouts?.length ?? 0}`)
  const steps = s.steps ?? []
  return (
    <section className="protocol" id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">
          <Multiline text={s.heading} />
        </h2>
        <p className="lede rv rv-d1">{s.intro}</p>
        <div className="source-note rv rv-d1">
          <RichText value={note.body} legacy />
        </div>
        <div className="pipeline rv rv-d2">
          {steps.map((st, i) => {
            const last = i === steps.length - 1
            return (
              <div key={st._key} className="pstep">
                <div className="rail">
                  <div className="node">
                    <Icon id={st.icon} />
                  </div>
                  {!last && <div className="cord" aria-hidden="true"></div>}
                </div>
                <div className="body">
                  <span className="snum">{st.marker}</span>
                  <h3>{st.title}</h3>
                  <p>{st.body}</p>
                  <div className="ptags">
                    {st.tags?.map((t, j) => (
                      <span key={j} className={cn('ptag', last && j === 0 && 'ok')}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="retry-card rv">
          <div className="ri">
            <Icon id={retry.icon} />
          </div>
          <div>
            <h3>{retry.title}</h3>
            <p>
              <Bold text={retry.body} run={RETRY_BOLD} />
            </p>
          </div>
        </div>
        <div className="success-card rv">
          <div className="ri">
            <Icon id={success.icon} />
          </div>
          <div>
            <h3>{success.title}</h3>
            <p>
              <Bold text={success.body} run={SUCCESS_BOLD} />
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

/** Security: heading, lede, and four cards (icon, title, text; `delays`: their reveal classes). */
export function Security({s, delays}: {s: Of<'cardSection'>; delays: string[]}) {
  if (delays.length !== (s.cards?.length ?? 0)) throw new Error(`Security: ${s.cards?.length ?? 0} cards but ${delays.length} reveal delays`)
  return (
    <section className="security" id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">
          <Multiline text={s.heading} />
        </h2>
        <RichText value={s.intro} classes={{0: 'lede rv rv-d1'}} />
        <div className="sec-grid">
          {s.cards?.map((c, i) => (
            <div key={c._key} className={cn('scard rv', delays[i])}>
              <div className="si">
                <Icon id={c.icon} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/** The devices the app works with: linked cards with a photo, a line, and "See ..." with the arrow. */
export function Devices({s, delays}: {s: Of<'relatedSection'>; delays: string[]}) {
  if (delays.length !== (s.items?.length ?? 0)) throw new Error(`Devices: ${s.items?.length ?? 0} cards but ${delays.length} reveal delays`)
  return (
    <section className="devices" id={s.anchorId}>
      <div className="wrap">
        <span className="kicker rv">{s.eyebrow}</span>
        <h2 className="rv">
          <Multiline text={s.heading} />
        </h2>
        <p className="lede rv rv-d1">{s.intro}</p>
        <div className="dev-grid">
          {s.items?.map((it, i) => (
            <a key={it._key} className={cn('dev-card rv', delays[i])} href={it.href}>
              <SanityImage image={it.image} />
              <div className="db">
                <h3>{it.title}</h3>
                <p>{it.body}</p>
                <span className="go">
                  {it.linkLabel} <Icon id={ARROW} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
