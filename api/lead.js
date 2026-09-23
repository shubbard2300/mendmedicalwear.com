// Handles every lead-capture form on the site (Reserve, Waitlist, Facility
// Quote, Schedule Demo, Distributor Application, Manufacturing Updates, and
// the general Contact form) through one endpoint. Each submission is:
//   1. emailed to contact@ via Resend (the lead, as before),
//   2. confirmed to the person who filled the form (all types but Contact),
//   3. appended as a row to the private "MEND Leads" Google Sheet through an
//      Apps Script web app (LEADS_WEBHOOK_URL + LEADS_WEBHOOK_TOKEN).
// A failure in 2 or 3 is logged, never surfaced: the lead email is what matters.

var TYPE_INFO = {
  contact: { label: 'Contact Form', required: ['name', 'email', 'message'] },
  reserve: { label: 'Order', required: ['name', 'email'] },
  waitlist: { label: 'Waitlist Signup', required: ['name', 'email'] },
  facilityQuote: { label: 'Facility Pricing Request', required: ['facility', 'facilityType', 'name', 'email'] },
  demo: { label: 'Demo Request', required: ['facility', 'name', 'email'] },
  distributor: { label: 'Distributor Application', required: ['company', 'businessType', 'name', 'email'] },
  newsletter: { label: 'Manufacturing Updates Signup', required: ['email'] }
};

var FIELD_LABELS = {
  name: 'Name', email: 'Email', message: 'Message', product: 'Product',
  quantity: 'Quantity', procedureDate: 'Procedure Date', facility: 'Facility',
  facilityType: 'Facility Type', role: 'Role / Title', phone: 'Phone',
  estimatedUnits: 'Estimated Units', preferredTime: 'Preferred Time',
  company: 'Company', businessType: 'Business Type', website: 'Website',
  region: 'Region Served', color: 'Color', size: 'Size', closure: 'Closure',
  buyingFor: 'Buying For', heardAbout: 'Heard About Us', marketingOptIn: 'MEND Updates Opt-In',
  source: 'Source'
};

var SITE = 'https://www.mendmedicalwear.com';
var SHARE_URL = SITE + '/?utm_source=referral&utm_medium=email&utm_campaign=reserve_confirm';

function esc(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

/* ---------------- Internal lead email (to contact@) ---------------- */

// Inline styles and tables only: Gmail strips <style> blocks and flexbox.
function renderHtml(title, fields, page) {
  var rows = fields.map(function(f) {
    return '<tr>' +
      '<td style="padding:14px 16px 14px 0;border-bottom:1px solid #E3DFD6;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6B675F;vertical-align:top;width:36%;">' + esc(f.label) + '</td>' +
      '<td style="padding:14px 0;border-bottom:1px solid #E3DFD6;font-size:18px;font-weight:700;color:#2B2B28;line-height:1.4;">' + esc(f.value).replace(/\n/g, '<br>') + '</td>' +
      '</tr>';
  }).join('');
  return '<div style="margin:0;padding:32px 16px;background:#F1EEE7;font-family:Helvetica,Arial,sans-serif;">' +
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
    '</table></div>';
}

/* ---------------- Customer confirmation emails ---------------- */

// Product → hosted 192px thumbnail + page + founding price. Matched by substring
// because the product field carries the full product name from the page.
var PRODUCTS = [
  { match: /comfort wrap|gown/i, thumb: 'email-thumb-gown.jpg', url: '/products/stylish-washable-hospital-gown', price: '$68.00' },
  { match: /scrub/i, thumb: 'email-thumb-scrubs.jpg', url: '/products/residential-nurse-scrub-set', price: '$74.00' },
  { match: /compression|socks/i, thumb: 'email-thumb-socks.jpg', url: '/products/compression-socks', price: '$28.00' },
  { match: /airguard/i, thumb: 'email-thumb-airguard.jpg', url: '/products/airguard-collar', device: true },
  { match: /pulse/i, thumb: 'email-thumb-pulse.jpg', url: '/products/mend-pulse', device: true },
  { match: /oxi/i, thumb: 'email-thumb-oxi.jpg', url: '/products/mend-oxi', device: true }
];
function productInfo(name) {
  if (!name) return null;
  // Bundles ("Scrub Set + Compression Socks") have no single founding price.
  var bundle = /bundle|\+/i.test(name);
  for (var i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].match.test(name)) {
      var p = Object.assign({}, PRODUCTS[i]);
      if (bundle) p.price = '';
      return p;
    }
  }
  return null;
}

// What each form type says back. Device waitlists must never read as a
// reservation or order (FDA CPG 300.600).
var CONFIRM = {
  reserve: {
    subject: 'You’re reserved — MEND founding customer list',
    preheader: 'Nothing has been charged. Here’s what happens next.',
    title: 'You’re reserved.',
    intro: 'Your spot in MEND’s first production run is saved, and nothing has been charged.',
    steps: [
      ['Reserved, no charge', 'You’re on the founding customer list. Your founding price is locked.'],
      ['Confirm before production', 'As your order nears production, we’ll email you to confirm your size and details, and that’s when you pay.'],
      ['Ships from the first run', 'Change or cancel anytime before you pay. Just reply to this email.']
    ],
    share: true
  },
  waitlist: {
    subject: 'You’re on the MEND waitlist',
    preheader: 'We’ll email you as soon as it’s available.',
    title: 'You’re on the list.',
    intro: 'We’ll email you as soon as this is available. There’s nothing to do until then.',
    note: 'Joining a waitlist is not an order or a reservation, and nothing is ever charged from it.'
  },
  newsletter: {
    subject: 'You’re subscribed to MEND updates',
    preheader: 'Short, occasional notes as we move through production.',
    title: 'You’re subscribed.',
    intro: 'Short, occasional emails as we move through production: first samples, launch timing, and founding-customer news.',
    note: 'To stop them, reply “unsubscribe” anytime.'
  },
  facilityQuote: { subject: 'We received your MEND facility request', preheader: 'We’ll follow up within one business day.', title: 'Request received.', intro: 'We’re glad you’re interested in the Founding Facility Pilot. We’ll follow up within one business day with pilot pricing.', b2b: true },
  demo: { subject: 'We received your MEND demo request', preheader: 'We’ll reach out to find a time.', title: 'Request received.', intro: 'We’ll reach out to find a time that works for you and your team.', b2b: true },
  distributor: { subject: 'We received your MEND partner application', preheader: 'Our team will review it and follow up.', title: 'Application received.', intro: 'We’ll review your application to carry MEND and follow up shortly.', b2b: true }
};

var C = { page: '#F1EEE7', card: '#FFFFFF', ink: '#2B2B28', muted: '#6B675F', line: '#E3DFD6', sage: '#677866', sageSoft: '#EEF1EC' };
var FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function button(href, label, primary) {
  // Table-cell button: survives Outlook's Word renderer, which ignores padding on <a>.
  return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="border-collapse:separate;"><tr>' +
    '<td align="center" bgcolor="' + (primary ? C.sage : C.card) + '"' + (primary ? '' : ' class="btn2"') + ' style="border-radius:999px;' + (primary ? '' : 'border:1.5px solid ' + C.sage + ';') + '">' +
    '<a href="' + esc(href) + '" style="display:inline-block;padding:14px 28px;font-family:' + FONT + ';font-size:15px;font-weight:700;line-height:1;color:' + (primary ? '#FFFFFF' : C.sage) + ';text-decoration:none;border-radius:999px;">' + esc(label) + '</a>' +
    '</td></tr></table>';
}

function renderConfirmHtml(c, body) {
  var first = String(body.name || '').trim().split(/\s+/)[0];
  var p = c.b2b ? null : productInfo(body.product);
  var details = [body.color, body.size, body.closure].filter(Boolean).join(' · ');
  var qty = body.quantity && String(body.quantity) !== '1' ? 'Qty ' + body.quantity : '';

  var orderCard = '';
  if (body.product && !c.b2b) {
    var priceLine = p && p.price && !p.device && body.type === 'reserve'
      ? '<div class="t-sage" style="margin-top:6px;font-size:14px;color:' + C.sage + ';font-weight:700;">Founding price ' + esc(p.price) + (qty ? ' each' : '') + ' · locked</div>' : '';
    orderCard =
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="panel" style="background:' + C.sageSoft + ';border-radius:14px;margin:4px 0 28px;"><tr>' +
      (p ? '<td width="96" valign="top" style="padding:16px 0 16px 16px;"><img src="' + SITE + '/' + p.thumb + '" width="96" height="96" alt="" style="display:block;border-radius:10px;border:0;width:96px;height:96px;"></td>' : '') +
      '<td valign="middle" style="padding:16px 18px;font-family:' + FONT + ';">' +
      '<div class="t-ink" style="font-size:16px;font-weight:700;line-height:1.35;color:' + C.ink + ';">' + esc(body.product) + '</div>' +
      (details || qty ? '<div class="t-muted" style="margin-top:4px;font-size:14px;line-height:1.4;color:' + C.muted + ';">' + esc([details, qty].filter(Boolean).join(' · ')) + '</div>' : '') +
      priceLine +
      '</td></tr></table>';
  }
  if (c.b2b) {
    var org = body.facility || body.company;
    var orgType = body.facilityType || body.businessType;
    if (org) orderCard =
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="panel" style="background:' + C.sageSoft + ';border-radius:14px;margin:4px 0 28px;"><tr><td style="padding:16px 18px;font-family:' + FONT + ';">' +
      '<div class="t-ink" style="font-size:16px;font-weight:700;color:' + C.ink + ';">' + esc(org) + '</div>' +
      (orgType ? '<div class="t-muted" style="margin-top:4px;font-size:14px;color:' + C.muted + ';">' + esc(orgType) + '</div>' : '') +
      '</td></tr></table>';
  }

  var steps = '';
  if (c.steps) {
    steps = '<div class="t-ink" style="font-family:' + FONT + ';font-size:13px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:' + C.muted + ';margin:0 0 14px;">What happens next</div>' +
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">' +
      c.steps.map(function(s, i) {
        return '<tr>' +
          '<td width="40" valign="top" style="padding:0 0 18px;"><div style="width:30px;height:30px;line-height:30px;border-radius:50%;background:' + C.sage + ';color:#FFFFFF;text-align:center;font-family:' + FONT + ';font-size:14px;font-weight:700;">' + (i + 1) + '</div></td>' +
          '<td valign="top" style="padding:3px 0 18px 8px;font-family:' + FONT + ';">' +
          '<div class="t-ink" style="font-size:15px;font-weight:700;color:' + C.ink + ';line-height:1.35;">' + esc(s[0]) + '</div>' +
          '<div class="t-muted" style="margin-top:3px;font-size:14px;line-height:1.55;color:' + C.muted + ';">' + esc(s[1]) + '</div>' +
          '</td></tr>';
      }).join('') + '</table>';
  }

  var ctas = '';
  if (c.share) {
    ctas = '<div class="t-ink" style="font-family:' + FONT + ';font-size:15px;line-height:1.55;color:' + C.ink + ';margin:0 0 14px;">Know someone with a surgery or hospital stay coming up? Send them MEND.</div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0" class="stackwrap"><tr><td class="stack" style="padding:0 10px 10px 0;">' + button(SHARE_URL, 'Share MEND', true) + '</td>' +
      (p ? '<td class="stack" style="padding:0 0 10px;">' + button(SITE + p.url, 'View your ' + (/(gown|comfort wrap)/i.test(body.product) ? 'gown' : 'order'), false) + '</td>' : '') +
      '</tr></table>';
  } else if (!c.b2b) {
    ctas = button(SITE + (p && p.device ? '/#products' : '/'), p && p.device ? 'See what’s available now' : 'Visit MEND', true);
  } else {
    ctas = button(SITE + '/facilities', 'Pilot details', true);
  }

  var note = c.note ? '<div class="t-muted" style="font-family:' + FONT + ';font-size:13px;line-height:1.6;color:' + C.muted + ';margin:22px 0 0;">' + esc(c.note) + '</div>' : '';

  return '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>' +
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
    '</td></tr></table></body></html>';
}

function renderConfirmText(c, body) {
  var lines = [c.title, '', (body.name ? 'Thanks, ' + String(body.name).trim().split(/\s+/)[0] + '. ' : '') + c.intro, ''];
  var details = [body.product, body.color, body.size, body.closure].filter(Boolean).join(' · ');
  if (details && !c.b2b) lines.push(details, '');
  if (c.steps) { lines.push('What happens next:'); c.steps.forEach(function(s, i) { lines.push((i + 1) + '. ' + s[0] + ': ' + s[1]); }); lines.push(''); }
  if (c.share) lines.push('Know someone with a surgery coming up? ' + SHARE_URL, '');
  if (c.note) lines.push(c.note, '');
  lines.push('Questions? Reply to this email or call (971) 254-1565.', '', 'MEND Medical Apparel · Portland, OR · mendmedicalwear.com');
  return lines.join('\n');
}

/* ---------------- Google Sheet log ---------------- */

// Column header in the "MEND Leads" sheet → value. The Apps Script appends by
// header name, so column order in the sheet can change without breaking this.
var SHEET_COLUMNS = {
  'Submitted At': function() { return new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }); },
  'Type': function(b) { return TYPE_INFO[b.type].label; },
  'Name': 'name', 'Email': 'email', 'Phone': 'phone', 'Product': 'product', 'Color': 'color', 'Size': 'size',
  'Closure': 'closure', 'Quantity': 'quantity', 'Procedure Date': 'procedureDate', 'Buying For': 'buyingFor',
  'Heard About': 'heardAbout',
  'Marketing Opt-In': function(b) { return b.type === 'newsletter' || b.marketingOptIn === 'Yes' ? 'Yes' : 'No'; },
  'Organization': function(b) { return b.facility || b.company || ''; },
  'Org Type': function(b) { return b.facilityType || b.businessType || ''; },
  'Role': 'role', 'Est. Units': 'estimatedUnits', 'Website': 'website', 'Region': 'region',
  'Preferred Time': 'preferredTime', 'Message': 'message', 'Page': 'page', 'Source': 'source'
};

function sheetRow(body) {
  var row = {};
  Object.keys(SHEET_COLUMNS).forEach(function(h) {
    var col = SHEET_COLUMNS[h];
    var v = typeof col === 'function' ? col(body) : body[col];
    row[h] = v === undefined || v === null ? '' : String(v);
  });
  return row;
}

async function logToSheet(body) {
  var url = process.env.LEADS_WEBHOOK_URL, token = process.env.LEADS_WEBHOOK_TOKEN;
  if (!url || !token) { console.warn('Lead sheet not configured'); return; }
  try {
    // Apps Script answers a POST with a redirect to its output; fetch follows it.
    var r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token: token, row: sheetRow(body) }),
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    var t = await r.text();
    if (!r.ok || t.indexOf('"ok":true') === -1) console.error('Lead sheet error:', r.status, t.slice(0, 200));
  } catch (err) {
    console.error('Lead sheet error:', err && err.message);
  }
}

function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

/* ---------------- Handler ---------------- */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  var body = req.body || {};
  var type = TYPE_INFO[body.type] ? body.type : null;
  if (!type) {
    return res.status(400).json({ error: 'Unknown form type' });
  }

  // Honeypot: humans never see this field. Answer 200 so a bot learns nothing, but log
  // it so a false positive shows up in Vercel logs instead of vanishing. The old field,
  // hp_company, was autofilled by Chrome and is deliberately ignored now.
  if (body.mend_trap && String(body.mend_trap).trim()) {
    console.warn('Honeypot tripped:', type, typeof body.page === 'string' ? body.page : '');
    return res.status(200).json({ ok: true });
  }

  var info = TYPE_INFO[type];
  for (var i = 0; i < info.required.length; i++) {
    var field = info.required[i];
    if (!body[field] || !String(body[field]).trim()) {
      return res.status(400).json({ error: 'Missing required field: ' + field });
    }
  }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Start the sheet write now so it runs alongside the emails; it's awaited before
  // every response below (a serverless function may freeze once it answers).
  var sheet = logToSheet(body);

  var fields = Object.keys(body)
    .filter(function(key) { return key !== 'type' && key !== 'page' && key !== 'hp_company' && key !== 'mend_trap' && body[key] !== undefined && String(body[key]).trim() !== ''; })
    .map(function(key) {
      return { label: FIELD_LABELS[key] || key, value: String(body[key]) };
    });
  var lines = fields.map(function(f) { return f.label + ': ' + f.value; });
  var title = 'New ' + info.label;

  try {
    var response = await sendEmail(apiKey, {
      from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
      to: 'contact@mendmedicalwear.com',
      reply_to: body.email,
      subject: title + (body.name ? ' from ' + body.name : ''),
      text: lines.join('\n'),
      html: renderHtml(title, fields, typeof body.page === 'string' ? body.page : '')
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Resend error:', errText);
      await sheet;
      return res.status(502).json({ error: 'Failed to send message' });
    }

    // The lead already reached the inbox, so a failed confirmation is logged, not surfaced.
    var c = CONFIRM[type];
    if (c && body.email) {
      try {
        var confirm = await sendEmail(apiKey, {
          from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
          to: String(body.email),
          reply_to: 'contact@mendmedicalwear.com',
          subject: c.subject,
          text: renderConfirmText(c, body),
          html: renderConfirmHtml(c, body)
        });
        if (!confirm.ok) console.error('Confirmation email error:', await confirm.text());
      } catch (confirmErr) {
        console.error('Confirmation email error:', confirmErr);
      }
    }

    await sheet;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Lead form error:', err);
    await sheet;
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
