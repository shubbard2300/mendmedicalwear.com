// Handles every lead-capture form on the site (Reserve, Waitlist, Facility
// Quote, Schedule Demo, Distributor Application, Manufacturing Updates, and
// the general Contact form) through one endpoint, forwarding each as a
// clearly labeled email via Resend. There is no database/CRM behind this —
// every submission is routed straight to the inbox.

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
  buyingFor: 'Buying For', heardAbout: 'Heard About Us', source: 'Source'
};

// What the person who filled in the form gets back. Contact has no entry: a human
// replies to those. Device waitlists must never read as a reservation (FDA CPG 300.600).
var CONFIRM = {
  reserve: {
    subject: 'You’re reserved — MEND founding customer list',
    title: 'You’re reserved.',
    lines: [
      'Thanks for reserving with MEND. Here is what happens next:',
      '1. Nothing has been charged, and nothing will be until you confirm.',
      '2. As your order nears production, we’ll email you to confirm your size and details and take payment. Your founding price is locked.',
      '3. Want to change or cancel? Just reply to this email, any time before you pay.'
    ],
    share: true
  },
  waitlist: {
    subject: 'You’re on the MEND waitlist',
    title: 'You’re on the list.',
    lines: [
      'Thanks for joining the waitlist. We’ll email you as soon as this is available — nothing to do until then.',
      'Joining a waitlist is not an order or a reservation, and nothing is ever charged from it.'
    ]
  },
  newsletter: {
    subject: 'You’re subscribed to MEND manufacturing updates',
    title: 'You’re subscribed.',
    lines: ['Short, occasional emails as we move through production. Reply “unsubscribe” any time to stop them.']
  },
  facilityQuote: { subject: 'We received your MEND facility request', title: 'Request received.', lines: ['Thanks — our team will follow up within one business day. Reply to this email with anything you’d like us to know first.'] },
  demo: { subject: 'We received your MEND demo request', title: 'Request received.', lines: ['Thanks — we’ll reach out to find a time that works. Reply to this email with anything you’d like us to know first.'] },
  distributor: { subject: 'We received your MEND partner application', title: 'Application received.', lines: ['Thanks — our team will review it and follow up shortly. Reply to this email with anything you’d like us to know first.'] }
};

var SHARE_URL = 'https://www.mendmedicalwear.com/?utm_source=referral&utm_medium=email&utm_campaign=reserve_confirm';

function renderConfirmHtml(c, product) {
  var body = c.lines.map(function(l) {
    return '<p style="margin:0 0 14px;font-size:16px;line-height:1.6;color:#2B2B28;">' + esc(l) + '</p>';
  }).join('');
  return '<div style="margin:0;padding:32px 16px;background:#F1EEE7;font-family:Helvetica,Arial,sans-serif;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border-collapse:separate;">' +
    '<tr><td style="background:#677866;padding:28px 32px;color:#FFFFFF;">' +
    '<div style="font-size:13px;font-weight:700;letter-spacing:.3em;">MEND</div>' +
    '<div style="font-size:28px;font-weight:700;margin-top:8px;">' + esc(c.title) + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:28px 32px 12px;">' +
    (product ? '<p style="margin:0 0 18px;font-size:14px;color:#6B675F;">' + esc(product) + '</p>' : '') +
    body +
    (c.share ? '<p style="margin:22px 0 8px;font-size:15px;color:#2B2B28;">Know someone with a surgery or hospital stay coming up? <a href="' + SHARE_URL + '" style="color:#677866;font-weight:700;">Send them MEND</a>.</p>' : '') +
    '</td></tr>' +
    '<tr><td style="background:#F1EEE7;padding:20px 32px;font-size:13px;line-height:1.6;color:#6B675F;">' +
    '<strong style="color:#2B2B28;">MEND Medical Apparel</strong> · <a href="https://www.mendmedicalwear.com" style="color:#677866;">mendmedicalwear.com</a><br>' +
    'You’re getting this because this address was entered on our site. Didn’t do that? Ignore this email and we’ll never write again.' +
    '</td></tr>' +
    '</table></div>';
}

function sendEmail(apiKey, payload) {
  return fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

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
    '<strong style="color:#2B2B28;">MEND Medical Apparel</strong> · <a href="https://www.mendmedicalwear.com" style="color:#677866;">mendmedicalwear.com</a><br>' +
    (page ? 'Submitted from mendmedicalwear.com' + esc(page) + '<br>' : '') +
    'Reply to this email to respond to the sender directly.' +
    '</td></tr>' +
    '</table></div>';
}

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
      return res.status(502).json({ error: 'Failed to send message' });
    }

    // The lead already reached the inbox, so a failed confirmation is logged, not surfaced.
    var c = CONFIRM[type];
    if (c && body.email) {
      try {
        var product = [body.product, body.color, body.size, body.closure].filter(Boolean).join(' · ');
        var confirm = await sendEmail(apiKey, {
          from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
          to: String(body.email),
          reply_to: 'contact@mendmedicalwear.com',
          subject: c.subject,
          text: (product ? product + '\n\n' : '') + c.lines.join('\n\n') + (c.share ? '\n\nKnow someone with a surgery coming up? ' + SHARE_URL : ''),
          html: renderConfirmHtml(c, product)
        });
        if (!confirm.ok) console.error('Confirmation email error:', await confirm.text());
      } catch (confirmErr) {
        console.error('Confirmation email error:', confirmErr);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Lead form error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
