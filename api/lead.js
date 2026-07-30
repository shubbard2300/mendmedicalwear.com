// Handles every lead-capture form on the site (Reserve, Waitlist, Facility
// Quote, Schedule Demo, Distributor Application, Manufacturing Updates, and
// the general Contact form) through one endpoint, forwarding each as a
// clearly labeled email via Resend. There is no database/CRM behind this —
// every submission is routed straight to the inbox.

var TYPE_INFO = {
  contact: { label: 'Contact Form', required: ['name', 'email', 'message'] },
  reserve: { label: 'Reservation — Founding Customer', required: ['name', 'email'] },
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
  region: 'Region Served'
};

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

  var lines = Object.keys(body)
    .filter(function(key) { return key !== 'type' && body[key] !== undefined && String(body[key]).trim() !== ''; })
    .map(function(key) {
      var label = FIELD_LABELS[key] || key;
      return label + ': ' + body[key];
    });

  try {
    var response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'MEND Medical Apparel <no-reply@mendmedicalwear.com>',
        to: 'contact@stevenjhubbard.com',
        reply_to: body.email,
        subject: 'New ' + info.label + (body.name ? ' from ' + body.name : ''),
        text: lines.join('\n')
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
