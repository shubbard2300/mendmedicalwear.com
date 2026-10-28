import {Fragment} from 'react'
import type {HOME_QUERY_RESULT} from '@/sanity/types'
import {Cta} from './Cta'
import {Multiline, RichText} from './RichText'
import {SanityImage} from './SanityImage'
import {HOME_CARD_KINDS} from './variants'

type Home = NonNullable<HOME_QUERY_RESULT>

// The home page sections. The stored content fills the text, links and photos; the wrappers, class names, the carousel controls, the card photo
// dots, the badge icon, the Learn More links and the contact form are copied from the live page (they are UI, not content: D6, D10).
// Behavior (the slideshow, the carousel, the form) arrives in P4, so everything renders in its starting state.

/** Splits a stored string that ends with a link's text ("... See the Pilot →"), so code can link the tail. Throws when the tail is gone. */
function splitTail(text: string | undefined, tail: string): [string, string] {
  if (!text?.endsWith(tail)) throw new Error(`Expected the text to end with "${tail}": ${text}`)
  return [text.slice(0, -tail.length), tail]
}

export function HeroBanner({banner}: {banner: NonNullable<Home['heroBanner']>}) {
  return (
    <div id="heroBanner" className="hero-banner">
      {banner.slides?.map((image, i) => (
        <div className={i === 0 ? 'active banner-slide' : 'banner-slide'} key={image._key}>
          <SanityImage image={image} widths={[480, 768, 1024]} sizes="100vw" decoding="async" fetchPriority={i === 0 ? 'high' : 'low'} />
        </div>
      ))}
      <div className="hero-banner-overlay">
        <div className="hero-banner-eyebrow">{banner.eyebrow}</div>
        <h2 className="hero-banner-title">
          <Multiline text={banner.heading} />
        </h2>
        <p className="hero-banner-sub">{banner.body}</p>
        <div className="hero-banner-cta-row">
          {banner.ctas?.map((c, i) => (
            <Cta key={c._key} cta={c} className={i === 0 ? 'btn btn-primary' : 'btn btn-secondary'} />
          ))}
        </div>
      </div>
      <div className="banner-dots" id="bannerDots"></div>
    </div>
  )
}

export function Carousel({slides}: {slides: NonNullable<Home['carousel']>}) {
  return (
    <div className="hero-carousel section" id="heroCarousel">
      <div className="carousel-track" id="carouselTrack">
        {slides.map((s, i) => {
          const Heading = i === 0 ? 'h1' : 'h2' // the first slide carries the page h1
          const link = s.ctas?.some((c) => c.modal) ? s.ctas.find((c) => c.href)?.href : undefined // the photo links to the product when the slide has a reserve button
          const photo = <SanityImage image={s.image} loading="lazy" />
          return (
            <div className="carousel-slide" key={s._key}>
              <div className="slide-text">
                <div className="slide-eyebrow">{s.eyebrow}</div>
                <Heading>
                  <Multiline text={s.heading} />
                </Heading>
                <p>{s.body}</p>
                <div className="cta-row">
                  {s.ctas?.map((c, j) => (
                    <Cta key={c._key} cta={c} className={j === 0 ? 'btn btn-primary' : 'btn btn-secondary'} />
                  ))}
                </div>
              </div>
              <div className="slide-img">{link ? <a href={link}>{photo}</a> : photo}</div>
            </div>
          )
        })}
      </div>
      <div className="carousel-nav">
        <button className="carousel-arrow" id="prevBtn" aria-label="Previous slide">
          <svg viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <div className="carousel-dots" id="carouselDots">
          {slides.map((s, i) => (
            <button key={s._key} className={i === 0 ? 'active carousel-dot' : 'carousel-dot'} data-index={i} aria-label={`Slide ${i + 1}`}></button>
          ))}
        </div>
        <button className="carousel-arrow" id="nextBtn" aria-label="Next slide">
          <svg viewBox="0 0 24 24">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export function About({about}: {about: NonNullable<Home['about']>}) {
  const [main, ...row] = about.images ?? []
  return (
    <div className="section about" id="about">
      <div className="about-grid">
        <div className="about-images">
          <SanityImage image={main} loading="lazy" className="about-img-main" />
          <div className="about-img-row">
            {row.map((image, i) => (
              <Fragment key={image._key}>
                {i > 0 && ' '}
                <SanityImage image={image} loading="lazy" />
              </Fragment>
            ))}
          </div>
        </div>
        <div>
          <h2>{about.heading}</h2>
          <RichText value={about.body} />
          <ul>
            {about.list?.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ProductCard({card, kind}: {card: NonNullable<NonNullable<Home['productsSection']>['cards']>[number]; kind: (typeof HOME_CARD_KINDS)[number]}) {
  const slug = card.product?.slug
  if (!slug) throw new Error(`Home card "${card.name}" has no linked product`)
  const href = `/products/${slug}`
  const images = card.images ?? []
  const multi = images.length > 1
  return (
    <div className="product-card">
      <a href={href} className="img-box" {...(multi ? {'data-carousel': ''} : {})}>
        {images.map((image, i) => (
          <Fragment key={image._key}>
            {i > 0 && ' '}
            <SanityImage image={image} loading="lazy" className={multi && i === 0 ? 'active' : undefined} />
          </Fragment>
        ))}
        {multi && (
          <div className="img-dots" aria-hidden="true">
            {images.map((image, i) => (
              <span key={image._key} className={i === 0 ? 'img-dot active' : 'img-dot'}></span>
            ))}
          </div>
        )}
      </a>
      <div className="info">
        <div className="name">{card.name}</div>
        {kind === 'apparel' ? (
          <div className="price">
            <span className="price-note" style={{marginLeft: 0}}>
              {card.priceLine}
            </span>
          </div>
        ) : (
          <div className="price" style={{color: 'var(--muted)', fontWeight: 400}}>
            {card.priceLine}
          </div>
        )}
        <div className="badge-row">
          {card.badges?.map((badge, i) =>
            i === 0 ? (
              <span className="badge badge-early" key={badge}>
                {badge}
              </span>
            ) : (
              <Fragment key={badge}>
                {' '}
                <span className="logo-badge">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>{' '}
                  {badge}
                </span>
              </Fragment>
            ),
          )}
        </div>
        <div className="card-cta-row">
          {card.cta && <Cta cta={card.cta} className="btn btn-primary btn-sm" />}
          <a href={href} className="btn btn-secondary btn-sm" style={kind === 'app' ? {flex: 1} : undefined}>
            Learn More
          </a>
        </div>
      </div>
    </div>
  )
}

export function Products({products}: {products: NonNullable<Home['productsSection']>}) {
  const cards = products.cards ?? []
  if (cards.length !== HOME_CARD_KINDS.length) throw new Error(`Home has ${cards.length} product cards, the card table expects ${HOME_CARD_KINDS.length}`)
  return (
    <div className="section products" id="products">
      <h2>{products.heading}</h2>
      <p className="sub">{products.intro}</p>
      <div className="products-feature">
        <SanityImage image={products.featureImage} loading="lazy" />
      </div>
      <div className="product-grid">
        {cards.map((card, i) => (
          <ProductCard key={card._key} card={card} kind={HOME_CARD_KINDS[i]} />
        ))}
      </div>
    </div>
  )
}

export function Partners({partners}: {partners: NonNullable<Home['partners']>}) {
  const [intro, link] = splitTail(partners.intro, 'See the Founding Facility Pilot →')
  return (
    <div className="section partners" id="partners">
      <h2>{partners.heading}</h2>
      <p className="sub">
        {intro}
        <a href="/facilities" style={{color: 'var(--accent-dark)', fontWeight: 600}}>
          {link}
        </a>
      </p>
      <div className="partners-grid">
        {partners.cards?.map((card) => (
          <div className="partner-card" key={card._key}>
            <div className="partner-eyebrow">{card.eyebrow}</div>
            <h3>{card.heading}</h3>
            <p>{card.body}</p>
            <div className="partner-cta-row">
              {card.ctas?.map((c, i) => (
                <Cta key={c._key} cta={c} className={i === 0 ? 'btn btn-primary' : 'btn btn-secondary'} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function Contact({contact, phone}: {contact: NonNullable<Home['contact']>; phone?: string}) {
  const [note, privacy] = splitTail(contact.privacyNote, 'Privacy & Terms')
  return (
    <div className="section contact" id="contact">
      <div className="contact-grid">
        <div>
          <h2>{contact.heading}</h2>
          <p>{contact.intro}</p>
          {contact.details?.map((d) => (
            <div className="detail" key={d._key}>
              <strong>{d.label}</strong>{' '}
              {d.label === 'Phone' ? (
                <a href={`tel:${phone?.replace(/[^\d+]/g, '')}`} style={{color: 'inherit'}}>
                  {d.text}
                </a>
              ) : (
                d.text
              )}
              {d.cta && (
                <div style={{marginTop: '10px'}}>
                  <Cta cta={d.cta} className="btn btn-secondary btn-sm" />
                </div>
              )}
            </div>
          ))}
        </div>
        <form id="contactForm">
          <div>
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" required />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" required />
          </div>
          <div>
            <label htmlFor="message">Message</label>
            <textarea id="message" name="message" required></textarea>
          </div>
          <div className="mend-hp" aria-hidden="true">
            <label htmlFor="mend_trap">Leave this field empty</label>
            <input type="text" id="mend_trap" name="mend_trap" tabIndex={-1} autoComplete="new-password" />
          </div>
          <button type="submit" className="btn btn-primary" style={{border: 'none', cursor: 'pointer', alignSelf: 'flex-start'}}>
            Send Message
          </button>
          <div className="form-msg" id="formMsg">
            Thanks for reaching out — we&apos;ll get back to you soon.
          </div>
          <div className="form-msg" id="formError" style={{color: '#c0392b'}}>
            Something went wrong — please email us directly at contact@mendmedicalwear.com.
          </div>
          <p className="mend-form-privacy">
            {note}
            <a href="/Privacy-Terms" target="_blank" rel="noopener">
              {privacy}
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
