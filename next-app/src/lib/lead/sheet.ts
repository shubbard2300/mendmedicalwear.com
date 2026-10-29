// Ported from api/lead.js (P4b): the private "MEND Leads" Google Sheet log, written through an Apps Script web app
// (LEADS_WEBHOOK_URL + LEADS_WEBHOOK_TOKEN). With either unset it logs a warning and does nothing, which is what a preview does.
import type {Body} from './emails'

// Column header in the "MEND Leads" sheet → value. The Apps Script appends by
// header name, so column order in the sheet can change without breaking this.
const SHEET_COLUMNS: Record<string, string | ((b: Body, typeLabel: string) => unknown)> = {
  'Submitted At': () => new Date().toLocaleString('en-US', {timeZone: 'America/Los_Angeles'}),
  'Type': (_b, typeLabel) => typeLabel,
  'Name': 'name', 'Email': 'email', 'Phone': 'phone', 'Product': 'product', 'Color': 'color', 'Size': 'size',
  'Closure': 'closure', 'Quantity': 'quantity', 'Procedure Date': 'procedureDate', 'Buying For': 'buyingFor',
  'Heard About': 'heardAbout',
  'Marketing Opt-In': (b) => (b.type === 'newsletter' || b.marketingOptIn === 'Yes' ? 'Yes' : 'No'),
  'Organization': (b) => b.facility || b.company || '',
  'Org Type': (b) => b.facilityType || b.businessType || '',
  'Role': 'role', 'Est. Units': 'estimatedUnits', 'Website': 'website', 'Region': 'region',
  'Preferred Time': 'preferredTime', 'Message': 'message', 'Page': 'page', 'Source': 'source',
}

function sheetRow(body: Body, typeLabel: string): Record<string, string> {
  const row: Record<string, string> = {}
  Object.keys(SHEET_COLUMNS).forEach((h) => {
    const col = SHEET_COLUMNS[h]
    const v = typeof col === 'function' ? col(body, typeLabel) : body[col]
    row[h] = v === undefined || v === null ? '' : String(v)
  })
  return row
}

export async function logToSheet(body: Body, typeLabel: string): Promise<void> {
  const url = process.env.LEADS_WEBHOOK_URL
  const token = process.env.LEADS_WEBHOOK_TOKEN
  if (!url || !token) {
    console.warn('Lead sheet not configured')
    return
  }
  try {
    // Apps Script answers a POST with a redirect to its output; fetch follows it.
    const r = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'text/plain;charset=utf-8'},
      body: JSON.stringify({token: token, row: sheetRow(body, typeLabel)}),
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    })
    const t = await r.text()
    if (!r.ok || t.indexOf('"ok":true') === -1) console.error('Lead sheet error:', r.status, t.slice(0, 200))
  } catch (err: any) {
    console.error('Lead sheet error:', err && err.message)
  }
}
