// Ported from api/lead.js (P4b): the internal lead email and the six customer confirmations. The strings are carried over byte for
// byte; scripts/migrate/lead_golden.mjs runs this and the live handler side by side and compares every outgoing request.
// Relative imports only, so Node can load these files directly for that test.

// The form body is whatever JSON the browser posted, exactly as the live handler treats it.
export type Body = Record<string, any>

export const SITE = 'https://www.mendmedicalwear.com'
const SHARE_URL = SITE + '/?utm_source=referral&utm_medium=email&utm_campaign=reserve_confirm'

function esc(s: any): string {
  return String(s).replace(/[&<>"']/g, (c) => {
    return ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'} as Record<string, string>)[c]
  })
}

/* ---------------- Internal lead email (to contact@) ---------------- */

// Inline styles and tables only: Gmail strips <style> blocks and flexbox.
export function renderHtml(title: string, fields: {label: string; value: string}[], page: string): string {
  const rows = fields
    .map((f) => {
      return (
        '<tr>' +
        '<td style="padding:14px 16px 14px 0;border-bottom:1px solid #E3DFD6;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B675F;vertical-align:top;width:36%;">' + esc(f.label) + '</td>' +
        '<td style="padding:14px 0;border-bottom:1px solid #E3DFD6;font-size:18px;font-weight:700;color:#2B2B28;line-height:1.4;">' + esc(f.value).replace(/\n/g, '<br>') + '</td>' +
        '</tr>'
      )
    })
    .join('')
  return (
    '<div style="margin:0;padding:32px 16px;background:#F1EEE7;font-family:Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border-collapse:separate;">' +
    '<tr><td style="background:#677866;padding:28px 32px;color:#FFFFFF;">' +
    '<div style="font-size:13px;font-weight:700;letter-spacing:.3em;">MEND</div>' +
    '<div style="font-size:28px;font-weight:700;margin-top:8px;">' + esc(title) + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:12px 32px 24px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">' + rows + '</table></td></tr>' +
    '<tr><td style="background:#F1EEE7;padding:20px 32px;font-size:13px;line-height:1.6;color:#6B675F;">' +
    '<strong style="color:#2B2B28;">MEND Medical Apparel</strong> · <a href="' + SITE + '" style="color:#677866;">mendmedicalwear.com</a><br>' +
    (page ? 'Submitted from mendmedicalwear.com' + esc(page) + '<br>' : '') +
    'Reply to this email to respond to the sender directly.' +
    '</td></tr>' +
    '</table></div>'
  )
}

/* ---------------- Customer confirmation emails ---------------- */

type Product = {match: RegExp; thumb: string; url: string; device?: boolean; price?: string}

// Product → hosted 192px thumbnail + page + founding price. Matched by substring
// because the product field carries the full product name from the page.
const PRODUCTS: Product[] = [
  {match: /comfort wrap|gown/i, thumb: 'email-thumb-gown.jpg', url: '/products/stylish-washable-hospital-gown'},
  {match: /scrub/i, thumb: 'email-thumb-scrubs.jpg', url: '/products/residential-nurse-scrub-set'},
  {match: /compression|socks/i, thumb: 'email-thumb-socks.jpg', url: '/products/compression-socks'},
  {match: /airguard/i, thumb: 'email-thumb-airguard.jpg', url: '/products/airguard-collar', device: true},
  {match: /pulse/i, thumb: 'email-thumb-pulse.jpg', url: '/products/mend-pulse', device: true},
  {match: /oxi/i, thumb: 'email-thumb-oxi.jpg', url: '/products/mend-oxi', device: true},
]
function productInfo(name: any): Product | null {
  if (!name) return null
  // Bundles ("Scrub Set + Compression Socks") have no single founding price.
  const bundle = /bundle|\+/i.test(name)
  for (let i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].match.test(name)) {
      const p = {...PRODUCTS[i]}
      if (bundle) p.price = ''
      return p
    }
  }
  return null
}

type Confirm = {
  subject: string
  preheader: string
  title: string
  intro: string
  steps?: [string, string][]
  share?: boolean
  note?: string
  b2b?: boolean
}

// What each form type says back. Device waitlists must never read as a
// reservation or order (FDA CPG 300.600).
export const CONFIRM: Record<string, Confirm> = {
  reserve: {
    subject: 'You’re reserved — MEND founding customer list',
    preheader: 'Nothing has been charged. Here’s what happens next.',
    title: 'You’re reserved.',
    intro: 'Your spot in MEND’s first production run is saved, and nothing has been charged.',
    steps: [
      ['Reserved, no charge', 'You’re on the founding customer list. Your founding price is locked.'],
      ['Confirm before production', 'As your order nears production, we’ll email you to confirm your size and details, and that’s when you pay.'],
      ['Ships from the first run', 'Change or cancel anytime before you pay. Just reply to this email.'],
    ],
    share: true,
  },
  waitlist: {
    subject: 'You’re on the MEND waitlist',
    preheader: 'We’ll email you as soon as it’s available.',
    title: 'You’re on the list.',
    intro: 'We’ll email you as soon as this is available. There’s nothing to do until then.',
    note: 'Joining a waitlist is not an order or a reservation, and nothing is ever charged from it.',
  },
  newsletter: {
    subject: 'You’re subscribed to MEND updates',
    preheader: 'Short, occasional notes as we move through production.',
    title: 'You’re subscribed.',
    intro: 'Short, occasional emails as we move through production: first samples, launch timing, and founding-customer news.',
    note: 'To stop them, reply “unsubscribe” anytime.',
  },
  facilityQuote: { subject: 'We received your MEND facility request', preheader: 'We’ll follow up within one business day.', title: 'Request received.', intro: 'We’re glad you’re interested in the Founding Facility Pilot. We’ll follow up within one business day with pilot pricing.', b2b: true },
  demo: { subject: 'We received your MEND demo request', preheader: 'We’ll reach out to find a time.', title: 'Request received.', intro: 'We’ll reach out to find a time that works for you and your team.', b2b: true },
  distributor: { subject: 'We received your MEND partner application', preheader: 'Our team will review it and follow up.', title: 'Application received.', intro: 'We’ll review your application to carry MEND and follow up shortly.', b2b: true },
}

const C = {page: '#F1EEE7', card: '#FFFFFF', ink: '#2B2B28', muted: '#6B675F', line: '#E3DFD6', sage: '#677866', sageSoft: '#EEF1EC'}
const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"

function button(href: string, label: string, primary: boolean): string {
  // Table-cell button: survives Outlook's Word renderer, which ignores padding on <a>.
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="border-collapse:separate;"><tr>' +
    '<td align="center" bgcolor="' + (primary ? C.sage : C.card) + '"' + (primary ? '' : ' class="btn2"') + ' style="border-radius:999px;' + (primary ? '' : 'border:1.5px solid ' + C.sage + ';') + '">' +
    '<a href="' + esc(href) + '" style="display:inline-block;padding:14px 28px;font-family:' + FONT + ';font-size:15px;font-weight:700;line-height:1;color:' + (primary ? '#FFFFFF' : C.sage) + ';text-decoration:none;border-radius:999px;">' + esc(label) + '</a>' +
    '</td></tr></table>'
  )
}

export function renderConfirmHtml(c: Confirm, body: Body): string {
  const first = String(body.name || '').trim().split(/\s+/)[0]
  const p = c.b2b ? null : productInfo(body.product)
  const details = [body.color, body.size, body.closure].filter(Boolean).join(' · ')
  const qty = body.quantity && String(body.quantity) !== '1' ? 'Qty ' + body.quantity : ''

  let orderCard = ''
  if (body.product && !c.b2b) {
    const priceLine =
      p && p.price && !p.device && body.type === 'reserve'
        ? '<div class="t-sage" style="margin-top:6px;font-size:14px;color:' + C.sage + ';font-weight:700;">Founding price ' + esc(p.price) + (qty ? ' each' : '') + ' · locked</div>'
        : ''
    orderCard =
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="panel" style="background:' + C.sageSoft + ';border-radius:14px;margin:4px 0 28px;"><tr>' +
      (p ? '<td width="96" valign="top" style="padding:16px 0 16px 16px;"><img src="' + SITE + '/' + p.thumb + '" width="96" height="96" alt="" style="display:block;border-radius:10px;border:0;width:96px;height:96px;"></td>' : '') +
      '<td valign="middle" style="padding:16px 18px;font-family:' + FONT + ';">' +
      '<div class="t-ink" style="font-size:16px;font-weight:700;line-height:1.35;color:' + C.ink + ';">' + esc(body.product) + '</div>' +
      (details || qty ? '<div class="t-muted" style="margin-top:4px;font-size:14px;line-height:1.4;color:' + C.muted + ';">' + esc([details, qty].filter(Boolean).join(' · ')) + '</div>' : '') +
      priceLine +
      '</td></tr></table>'
  }
  if (c.b2b) {
    const org = body.facility || body.company
    const orgType = body.facilityType || body.businessType
    if (org)
      orderCard =
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="panel" style="background:' + C.sageSoft + ';border-radius:14px;margin:4px 0 28px;"><tr><td style="padding:16px 18px;font-family:' + FONT + ';">' +
        '<div class="t-ink" style="font-size:16px;font-weight:700;color:' + C.ink + ';">' + esc(org) + '</div>' +
        (orgType ? '<div class="t-muted" style="margin-top:4px;font-size:14px;color:' + C.muted + ';">' + esc(orgType) + '</div>' : '') +
        '</td></tr></table>'
  }

  let steps = ''
  if (c.steps) {
    steps =
      '<div class="t-ink" style="font-family:' + FONT + ';font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:' + C.muted + ';margin:0 0 14px;">What happens next</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">' +
      c.steps
        .map((s, i) => {
          return (
            '<tr>' +
            '<td width="40" valign="top" style="padding:0 0 18px;"><div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:' + C.sage + ';color:#FFFFFF;text-align:center;font-family:' + FONT + ';font-size:14px;font-weight:700;">' + (i + 1) + '</div></td>' +
            '<td valign="top" style="padding:3px 0 18px 8px;font-family:' + FONT + ';">' +
            '<div class="t-ink" style="font-size:15px;font-weight:700;color:' + C.ink + ';line-height:1.35;">' + esc(s[0]) + '</div>' +
            '<div class="t-muted" style="margin-top:3px;font-size:14px;line-height:1.55;color:' + C.muted + ';">' + esc(s[1]) + '</div>' +
            '</td></tr>'
          )
        })
        .join('') +
      '</table>'
  }

  let ctas = ''
  if (c.share) {
    ctas =
      '<div class="t-ink" style="font-family:' + FONT + ';font-size:15px;line-height:1.55;color:' + C.ink + ';margin:0 0 14px;">Know someone with a surgery or hospital stay coming up? Send them MEND.</div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" class="stackwrap"><tr><td class="stack" style="padding:0 10px 10px 0;">' + button(SHARE_URL, 'Share MEND', true) + '</td>' +
      (p ? '<td class="stack" style="padding:0 0 10px;">' + button(SITE + p.url, 'View your ' + (/(gown|comfort wrap)/i.test(body.product) ? 'gown' : 'order'), false) + '</td>' : '') +
      '</tr></table>'
  } else if (!c.b2b) {
    ctas = button(SITE + (p && p.device ? '/#products' : '/'), p && p.device ? 'See what’s available now' : 'Visit MEND', true)
  } else {
    ctas = button(SITE + '/facilities', 'Pilot details', true)
  }

  const note = c.note ? '<div class="t-muted" style="font-family:' + FONT + ';font-size:13px;line-height:1.6;color:' + C.muted + ';margin:22px 0 0;">' + esc(c.note) + '</div>' : ''

  return (
    '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">' +
    '<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">' +
    '<title>' + esc(c.title) + '</title>' +
    '<style>' +
    'body{margin:0;padding:0;-webkit-text-size-adjust:100%;} img{border:0;outline:none;} a{color:' + C.sage + ';}' +
    '@media (max-width:620px){.container{width:100%!important;} .px{padding-left:22px!important;padding-right:22px!important;} .h1{font-size:28px!important;} .stackwrap{width:100%!important;} .stack{display:block!important;width:100%!important;padding-right:0!important;box-sizing:border-box;} .btn{display:table!important;width:100%!important;} .btn td{width:100%!important;} .btn a{display:block!important;text-align:center!important;}}' +
    '@media (prefers-color-scheme:dark){.bg-page{background:#141614!important;} .card{background:#1D201C!important;} .panel{background:#262B25!important;} .t-ink{color:#ECEAE4!important;} .t-muted{color:#B3AFA6!important;} .t-sage{color:#A9C0A5!important;} .rule{border-color:#343A32!important;} .btn2{background:transparent!important;} .btn2 a{color:#A9C0A5!important;} .foot{background:#141614!important;}}' +
    '</style><!--[if mso]><style>*{font-family:Arial,sans-serif!important;}</style><![endif]--></head>' +
    '<body class="bg-page" style="margin:0;padding:0;background:' + C.page + ';">' +
    // Preheader: the inbox preview line, hidden in the message itself.
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">' + esc(c.preheader) + '&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="bg-page" style="background:' + C.page + ';"><tr><td align="center" style="padding:28px 12px;">' +
    '<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0"><tr><td><![endif]-->' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container card" style="width:600px;max-width:600px;background:' + C.card + ';border-radius:18px;overflow:hidden;">' +
    // Header band with the logo (a PNG: Gmail won't render SVG).
    '<tr><td style="background:' + C.sage + ';padding:26px 36px;" class="px"><a href="' + SITE + '" style="text-decoration:none;"><img src="' + SITE + '/mend-email-logo.png" width="170" height="48" alt="MEND Medical Apparel" style="display:block;width:170px;height:48px;border:0;color:#FFFFFF;font-family:' + FONT + ';font-size:20px;font-weight:700;"></a></td></tr>' +
    '<tr><td class="px" style="padding:36px 36px 8px;font-family:' + FONT + ';">' +
    '<h1 class="h1 t-ink" style="margin:0 0 12px;font-size:32px;line-height:1.15;font-weight:700;color:' + C.ink + ';letter-spacing:-.01em;">' + esc(c.title) + '</h1>' +
    '<p class="t-ink" style="margin:0 0 24px;font-size:16px;line-height:1.6;color:' + C.ink + ';">' + (first ? 'Thanks, ' + esc(first) + '. ' : '') + esc(c.intro) + '</p>' +
    orderCard + steps + ctas + note +
    '</td></tr>' +
    '<tr><td class="px" style="padding:28px 36px 32px;font-family:' + FONT + ';"><div class="rule" style="border-top:1px solid ' + C.line + ';padding-top:22px;">' +
    '<p class="t-muted" style="margin:0 0 6px;font-size:14px;line-height:1.6;color:' + C.muted + ';">Questions? Reply to this email or call <a class="t-sage" href="tel:+19712541565" style="color:' + C.sage + ';font-weight:700;text-decoration:none;white-space:nowrap;">(971) 254-1565</a>.</p>' +
    '</div></td></tr>' +
    '</table>' +
    '<!--[if mso]></td></tr></table><![endif]-->' +
    '<table role="presentation" width="600" cellpadding="0" cellspacing="0" class="container" style="width:600px;max-width:600px;"><tr><td class="px foot" style="padding:22px 36px 8px;font-family:' + FONT + ';font-size:12px;line-height:1.7;color:' + C.muted + ';text-align:center;">' +
    '<span class="t-muted"><strong>MEND Medical Apparel</strong> · Portland, OR · <a href="' + SITE + '" style="color:' + C.muted + ';">mendmedicalwear.com</a><br>' +
    'You’re receiving this because this address was entered on mendmedicalwear.com. If that wasn’t you, ignore this email and we won’t write again.</span>' +
    '</td></tr></table>' +
    '</td></tr></table></body></html>'
  )
}

export function renderConfirmText(c: Confirm, body: Body): string {
  const lines = [c.title, '', (body.name ? 'Thanks, ' + String(body.name).trim().split(/\s+/)[0] + '. ' : '') + c.intro, '']
  const details = [body.product, body.color, body.size, body.closure].filter(Boolean).join(' · ')
  if (details && !c.b2b) lines.push(details, '')
  if (c.steps) {
    lines.push('What happens next:')
    c.steps.forEach((s, i) => {
      lines.push(i + 1 + '. ' + s[0] + ': ' + s[1])
    })
    lines.push('')
  }
  if (c.share) lines.push('Know someone with a surgery coming up? ' + SHARE_URL, '')
  if (c.note) lines.push(c.note, '')
  lines.push('Questions? Reply to this email or call (971) 254-1565.', '', 'MEND Medical Apparel · Portland, OR · mendmedicalwear.com')
  return lines.join('\n')
}
