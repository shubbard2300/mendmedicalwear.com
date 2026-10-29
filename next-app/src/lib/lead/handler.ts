// Ported from api/lead.js (P4b): every lead-capture form on the site (Reserve, Waitlist, Facility Quote, Schedule Demo, Distributor
// Application, Manufacturing Updates, and the general Contact form) through one endpoint. Each submission is:
//   1. emailed to contact@ via Resend (the lead, as before),
//   2. confirmed to the person who filled the form (all types but Contact),
//   3. appended as a row to the private "MEND Leads" Google Sheet through an Apps Script web app.
// A failure in 2 or 3 is logged, never surfaced: the lead email is what matters.
// Statuses, messages and the order of the outgoing requests are the live handler's, proven by scripts/migrate/lead_golden.mjs.
import {CONFIRM, renderConfirmHtml, renderConfirmText, renderHtml, type Body} from './emails'
import {logToSheet} from './sheet'

const TYPE_INFO: Record<string, {label: string; required: string[]}> = {
  contact: {label: 'Contact Form', required: ['name', 'email', 'message']},
  reserve: {label: 'Order', required: ['name', 'email']},
  waitlist: {label: 'Waitlist Signup', required: ['name', 'email']},
  facilityQuote: {label: 'Facility Pricing Request', required: ['facility', 'facilityType', 'name', 'email']},
  demo: {label: 'Demo Request', required: ['facility', 'name', 'email']},
  distributor: {label: 'Distributor Application', required: ['company', 'businessType', 'name', 'email']},
  newsletter: {label: 'Manufacturing Updates Signup', required: ['email']},
}

const FIELD_LABELS: Record<string, string> = {
  name: 'Name', email: 'Email', message: 'Message', product: 'Product',
  quantity: 'Quantity', procedureDate: 'Procedure Date', facility: 'Facility',
  facilityType: 'Facility Type', role: 'Role / Title', phone: 'Phone',
  estimatedUnits: 'Estimated Units', preferredTime: 'Preferred Time',
  company: 'Company', businessType: 'Business Type', website: 'Website',
  region: 'Region Served', color: 'Color', size: 'Size', closure: 'Closure',
  buyingFor: 'Buying For', heardAbout: 'Heard About Us', marketingOptIn: 'MEND Updates Opt-In',
  source: 'Source',
}

const TEAM_INBOX = 'contact@mendmedicalwear.com'

// Where the internal lead email goes. LEAD_NOTIFY_TO lets a preview send it to a test inbox; it is ignored in Production so a stray
// setting there can never redirect real leads. The confirmation always goes to the address typed in the form.
function leadInbox(): string {
  const to = process.env.LEAD_NOTIFY_TO?.trim()
  return process.env.VERCEL_ENV !== 'production' && to ? to : TEAM_INBOX
}

function sendEmail(apiKey: string, payload: Record<string, unknown>) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  })
}

export type LeadResult = {status: number; json: {ok: true} | {error: string}; allow?: string}

export async function handleLead(method: string, input: Body | null | undefined): Promise<LeadResult> {
  if (method !== 'POST') return {status: 405, json: {error: 'Method not allowed'}, allow: 'POST'}

  const body: Body = input || {}
  const type: string | null = TYPE_INFO[body.type] ? body.type : null
  if (!type) return {status: 400, json: {error: 'Unknown form type'}}

  // Honeypot: humans never see this field. Answer 200 so a bot learns nothing, but log
  // it so a false positive shows up in Vercel logs instead of vanishing. The old field,
  // hp_company, was autofilled by Chrome and is deliberately ignored now.
  if (body.mend_trap && String(body.mend_trap).trim()) {
    console.warn('Honeypot tripped:', type, typeof body.page === 'string' ? body.page : '')
    return {status: 200, json: {ok: true}}
  }

  const info = TYPE_INFO[type]
  for (let i = 0; i < info.required.length; i++) {
    const field = info.required[i]
    if (!body[field] || !String(body[field]).trim()) return {status: 400, json: {error: 'Missing required field: ' + field}}
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return {status: 500, json: {error: 'Email service not configured'}}

  // Start the sheet write now so it runs alongside the emails; it's awaited before
  // every response below (a serverless function may freeze once it answers).
  const sheet = logToSheet(body, info.label)

  const fields = Object.keys(body)
    .filter((key) => key !== 'type' && key !== 'page' && key !== 'hp_company' && key !== 'mend_trap' && body[key] !== undefined && String(body[key]).trim() !== '')
    .map((key) => ({label: FIELD_LABELS[key] || key, value: String(body[key])}))
  const lines = fields.map((f) => f.label + ': ' + f.value)
  const title = 'New ' + info.label

  try {
    const response = await sendEmail(apiKey, {
      from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
      to: leadInbox(),
      reply_to: body.email,
      subject: title + (body.name ? ' from ' + body.name : ''),
      text: lines.join('\n'),
      html: renderHtml(title, fields, typeof body.page === 'string' ? body.page : ''),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Resend error:', errText)
      await sheet
      return {status: 502, json: {error: 'Failed to send message'}}
    }

    // The lead already reached the inbox, so a failed confirmation is logged, not surfaced.
    const c = CONFIRM[type]
    if (c && body.email) {
      try {
        const confirm = await sendEmail(apiKey, {
          from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
          to: String(body.email),
          reply_to: TEAM_INBOX,
          subject: c.subject,
          text: renderConfirmText(c, body),
          html: renderConfirmHtml(c, body),
        })
        if (!confirm.ok) console.error('Confirmation email error:', await confirm.text())
      } catch (confirmErr) {
        console.error('Confirmation email error:', confirmErr)
      }
    }

    await sheet
    return {status: 200, json: {ok: true}}
  } catch (err) {
    console.error('Lead form error:', err)
    await sheet
    return {status: 500, json: {error: 'Failed to send message'}}
  }
}
