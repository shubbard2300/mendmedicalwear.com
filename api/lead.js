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
  source: 'Source'
};

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
    .filter(function(key) { return key !== 'type' && key !== 'page' && body[key] !== undefined && String(body[key]).trim() !== ''; })
    .map(function(key) {
      return { label: FIELD_LABELS[key] || key, value: String(body[key]) };
    });
  var lines = fields.map(function(f) { return f.label + ': ' + f.value; });
  var title = 'New ' + info.label;

  try {
    var response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
        to: 'contact@mendmedicalwear.com',
        reply_to: body.email,
        subject: title + (body.name ? ' from ' + body.name : ''),
        text: lines.join('\n'),
        html: renderHtml(title, fields, typeof body.page === 'string' ? body.page : '')
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('Resend error:', errText);
      return res.status(502).json({ error: 'Failed to send message' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Lead form error:', err);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}
