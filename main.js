/* MEND Medical Apparel — main.js */

// Scroll-reveal
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.section').forEach(function(el) {
  revealObserver.observe(el);
});

// Scroll progress bar
var progressBar = document.createElement('div');
progressBar.style.cssText = [
  'position:fixed', 'top:0', 'left:0', 'height:2px', 'width:0%',
  'background:linear-gradient(90deg, var(--accent-dark), var(--accent))',
  'z-index:999', 'pointer-events:none',
  'transition:width .1s linear'
].join(';');
document.body.appendChild(progressBar);

// Glass header condenses once the page has scrolled past the hero
var siteHeader = document.querySelector('header');

window.addEventListener('scroll', function() {
  var pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
  if (siteHeader) siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });
if (siteHeader) siteHeader.classList.toggle('is-scrolled', window.scrollY > 40);

// Button ripple on click
document.addEventListener('click', function(e) {
  var btn = e.target.closest('.btn');
  if (!btn) return;
  var ripple = document.createElement('span');
  ripple.className = 'ripple';
  var size = Math.max(btn.offsetWidth, btn.offsetHeight);
  var rect = btn.getBoundingClientRect();
  ripple.style.cssText = [
    'position:absolute', 'border-radius:50%',
    'background:rgba(255,255,255,.3)', 'pointer-events:none',
    'transform:scale(0)', 'animation:btn-ripple .55s linear',
    'width:' + size + 'px', 'height:' + size + 'px',
    'left:' + (e.clientX - rect.left - size / 2) + 'px',
    'top:' + (e.clientY - rect.top - size / 2) + 'px'
  ].join(';');
  btn.appendChild(ripple);
  setTimeout(function() { ripple.remove(); }, 600);
});

// Respect users who prefer reduced motion — skip pointer-driven effects below
var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Product card 3D tilt + cursor-tracked spotlight glow
if (!prefersReducedMotion)
document.querySelectorAll('.product-card').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var r = card.getBoundingClientRect();
    var px = (e.clientX - r.left) / r.width;
    var py = (e.clientY - r.top) / r.height;
    var rx = (py - 0.5) * -10;
    var ry = (px - 0.5) * 10;
    card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)';
    card.style.setProperty('--mx', (px * 100) + '%');
    card.style.setProperty('--my', (py * 100) + '%');
  });
  card.addEventListener('mouseleave', function() {
    card.style.transform = '';
  });
});

// Magnetic pull on primary buttons
if (!prefersReducedMotion)
document.querySelectorAll('.btn-primary').forEach(function(btn) {
  btn.addEventListener('mousemove', function(e) {
    var r = btn.getBoundingClientRect();
    var dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
    var dy = (e.clientY - (r.top + r.height / 2)) * 0.25;
    btn.style.transform = 'translate(' + dx + 'px,' + dy + 'px) translateY(-3px)';
  });
  btn.addEventListener('mouseleave', function() {
    btn.style.transform = '';
  });
});

// Logo cross rotation (inline SVG)
var logoLink = document.querySelector('header .logo-link');
if (logoLink) {
  var mark = logoLink.querySelector('.logo-mark');
  var text = logoLink.querySelector('.logo-text');
  var sub  = logoLink.querySelector('.logo-sub');
  logoLink.addEventListener('mouseenter', function() {
    if (mark) mark.style.transform = 'rotate(45deg)';
    if (text) text.style.letterSpacing = '12px';
    if (sub)  sub.style.opacity = '.5';
  });
  logoLink.addEventListener('mouseleave', function() {
    if (mark) mark.style.transform = '';
    if (text) text.style.letterSpacing = '';
    if (sub)  sub.style.opacity = '';
  });
}

// Brand-It logo customizer (called per PDP).
// photoSrc + logoBox (native-pixel {x,y,w,h} on that photo) make the preview
// show the uploaded logo composited directly onto the real product photo,
// at the spot the MEND mark normally sits — not a generic disconnected
// mockup card. Omit both to fall back to the old generic label-card preview.
window.initBrandIt = function(productLabel, photoSrc, logoBox) {
  var drop      = document.getElementById('brandItDrop');
  var fileInput = document.getElementById('brandItFile');
  var canvas    = document.getElementById('brandItCanvas');
  var placeholder = document.querySelector('.brand-it-placeholder');
  var dlBtn     = document.getElementById('brandItDownload');
  var resetBtn  = document.getElementById('brandItReset');
  if (!drop || !canvas) return;

  var ctx = canvas.getContext('2d');

  function roundRect(x, y, w, h, r) {
    if (typeof r === 'number') r = { tl:r, tr:r, br:r, bl:r };
    ctx.beginPath();
    ctx.moveTo(x + r.tl, y);
    ctx.lineTo(x + w - r.tr, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r.tr);
    ctx.lineTo(x + w, y + h - r.br); ctx.quadraticCurveTo(x+w, y+h, x+w-r.br, y+h);
    ctx.lineTo(x + r.bl, y + h); ctx.quadraticCurveTo(x, y+h, x, y+h-r.bl);
    ctx.lineTo(x, y + r.tl); ctx.quadraticCurveTo(x, y, x+r.tl, y);
    ctx.closePath();
  }

  function drawLogoFit(logo, x, y, w, h) {
    var ratio = Math.min(w / logo.width, h / logo.height);
    var lw = logo.width * ratio, lh = logo.height * ratio;
    ctx.drawImage(logo, x + (w-lw)/2, y + (h-lh)/2, lw, lh);
  }

  function drawWatermark(W, H) {
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.font = '400 10px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('custom branding preview · mendmedicalwear.com', W-10, H-10);
  }

  // ── Photo-composite mode: draw the real product photo, then overlay the
  // uploaded logo directly on top of it at logoBox. ──
  function drawOnPhoto(photo, logo) {
    var maxW = 560;
    var scale = Math.min(1, maxW / photo.width);
    var W = Math.round(photo.width * scale), H = Math.round(photo.height * scale);
    canvas.width = W; canvas.height = H;

    ctx.drawImage(photo, 0, 0, W, H);

    var bx = logoBox.x * scale, by = logoBox.y * scale, bw = logoBox.w * scale, bh = logoBox.h * scale;

    if (logo) {
      drawLogoFit(logo, bx, by, bw, bh);
    } else {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.strokeRect(bx, by, bw, bh);
      ctx.restore();
      ctx.fillStyle = 'rgba(0,0,0,.55)';
      roundRect(bx, by + bh + 8, 128, 22, 6); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '600 10px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR LOGO GOES HERE', bx + 64, by + bh + 23);
    }

    drawWatermark(W, H);
    canvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }

  // ── Fallback generic label-card mode (used only if no photo/logoBox given) ──
  function drawGenericCard(logo) {
    var W = 600, H = 380;
    canvas.width = W; canvas.height = H;

    ctx.fillStyle = '#F1EEE7';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(227,223,214,.6)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (var y = 0; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    var pw = 260, ph = 180, px = (W-pw)/2, py = (H-ph)/2 - 16;
    ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#fff';
    roundRect(px, py, pw, ph, 12); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    ctx.fillStyle = '#7C8B7A';
    roundRect(px, py, pw, 6, {tl:12, tr:12, br:0, bl:0}); ctx.fill();

    if (logo) {
      drawLogoFit(logo, px + 24, py + 28, pw - 48, ph - 56);
    } else {
      ctx.fillStyle = '#C8C4BC';
      ctx.font = '600 13px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR LOGO HERE', W/2, py + ph/2 + 6);
    }

    ctx.fillStyle = '#8A857C';
    ctx.font = '500 11px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((productLabel || 'MEND Medical').toUpperCase(), W/2, py + ph + 26);

    ctx.strokeStyle = '#7C8B7A'; ctx.lineWidth = 1.5;
    [[px-8,py-8],[px+pw+8,py-8],[px-8,py+ph+8],[px+pw+8,py+ph+8]].forEach(function(c) {
      ctx.beginPath(); ctx.moveTo(c[0]-6,c[1]); ctx.lineTo(c[0]+6,c[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c[0],c[1]-6); ctx.lineTo(c[0],c[1]+6); ctx.stroke();
    });

    ctx.fillStyle = 'rgba(138,133,124,.28)';
    ctx.font = '400 10px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('custom branding preview · mendmedicalwear.com', W-14, H-12);

    canvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }

  var photo = null;
  var usePhoto = !!(photoSrc && logoBox);

  function drawMockup(logo) {
    if (usePhoto) {
      if (photo) drawOnPhoto(photo, logo);
      // else: photo hasn't loaded yet — onload handler below will call drawMockup again
    } else {
      drawGenericCard(logo);
    }
  }

  if (usePhoto) {
    photo = new Image();
    photo.onload = function() { drawMockup(null); };
    photo.src = photoSrc;
  } else {
    drawMockup(null);
  }

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      var img = new Image();
      img.onload = function() {
        drawMockup(img);
        if (dlBtn) { dlBtn.href = canvas.toDataURL('image/png'); dlBtn.style.display = 'inline-block'; }
        if (resetBtn) resetBtn.style.display = 'inline-block';
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  fileInput.addEventListener('change', function() { handleFile(this.files[0]); });
  drop.addEventListener('dragover', function(e) { e.preventDefault(); drop.classList.add('drag-over'); });
  drop.addEventListener('dragleave', function() { drop.classList.remove('drag-over'); });
  drop.addEventListener('drop', function(e) {
    e.preventDefault(); drop.classList.remove('drag-over');
    handleFile(e.dataTransfer.files[0]);
  });

  if (dlBtn) dlBtn.addEventListener('click', function() { dlBtn.href = canvas.toDataURL('image/png'); });
  if (resetBtn) resetBtn.addEventListener('click', function() {
    fileInput.value = '';
    drawMockup(null);
    if (dlBtn) dlBtn.style.display = 'none';
    resetBtn.style.display = 'none';
    // drawMockup(null) already hides the static placeholder and redraws the
    // canvas in its empty state — don't re-show the placeholder on top of it.
  });
};

// Contact form → /api/lead (Resend email forwarding)
// Delegated so this works whether #contactForm is the original section on
// index.html or a copy injected into the Contact modal on any other page.
document.addEventListener('submit', function(e) {
  if (e.target.id !== 'contactForm') return;
  e.preventDefault();
  var form = e.target;
  var msg = form.querySelector('#formMsg');
  var err = form.querySelector('#formError');
  var btn = form.querySelector('button[type="submit"]');
  msg.classList.remove('show');
  err.classList.remove('show');
  btn.disabled = true;

  var data = {
    type: 'contact',
    name: form.name.value,
    email: form.email.value,
    message: form.message.value
  };

  fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function(res) {
    if (!res.ok) throw new Error('Request failed');
    msg.classList.add('show');
    form.reset();
  }).catch(function() {
    err.classList.add('show');
  }).finally(function() {
    btn.disabled = false;
  });
});

// FAQ accordion (used by injected FAQ content — FAQ.html itself defines the
// same function locally, which simply takes precedence there)
window.toggle = window.toggle || function(btn) {
  var item = btn.closest('.faq-item');
  var isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(function(i) { i.classList.remove('open'); });
  if (!isOpen) item.classList.add('open');
};

// Privacy/Terms tab switcher (used by injected Privacy & Terms content)
window.showTab = window.showTab || function(id, btn) {
  document.querySelectorAll('.doc-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.doc-tab').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById(id).classList.add('active');
  btn.classList.add('active');
};

// ── Popup modals for FAQ, Privacy & Terms, Contact, and every lead-capture
// form (Reserve, Waitlist, Facility Quote, Demo, Distributor, Updates) ──
// Page-content modals (FAQ/Privacy/Contact) are triggered by their existing
// plain hrefs so navigation still works with JS disabled. Lead-capture
// modals are triggered by a `data-modal="type"` attribute on any button —
// add one to `MODAL_FORMS` below and it's usable anywhere on the site with
// zero extra wiring. `data-product="…"` on the same button pre-fills the
// product field where the form has one.
(function() {
  var MODAL_SOURCES = {
    'FAQ.html': { extract: '#modalBody', label: 'Frequently Asked Questions', inlineStyles: true },
    'Privacy-Terms.html': { extract: '#modalBody', label: 'Privacy & Terms', inlineStyles: true },
    'index.html#contact': { extract: '#contact', label: 'Get in Touch' },
    '#contact': { extract: '#contact', label: 'Get in Touch', src: 'index.html' }
  };

  // Lead-capture form modals. Each `fields` function receives the trigger's
  // context (currently just { product }) so a Reserve button on a specific
  // product card can pre-fill and lock that field.
  var MODAL_FORMS = {
    reserve: {
      eyebrow: 'Founding Customer Program',
      title: 'Reserve Your Order',
      subtitle: 'No payment today. Reserving a spot puts you in our first production run and locks in founding-customer pricing — we’ll email you when it’s time to confirm and pay.',
      submitLabel: 'Reserve My Spot',
      successTitle: 'You’re reserved.',
      successBody: 'You’re on the founding customer list. Watch your inbox — we’ll follow up as your order nears production.',
      fields: function(ctx) {
        return [
          { name: 'product', label: 'Product', type: 'text', value: ctx.product || 'MEND Products (not sure yet)', readonly: !!ctx.product },
          { name: 'quantity', label: 'Quantity', type: 'number', value: '1', min: '1', max: '999' },
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'procedureDate', label: 'Surgery / procedure date (optional)', type: 'date' }
        ];
      }
    },
    waitlist: {
      eyebrow: 'Early Access',
      title: 'Join the Waitlist',
      subtitle: 'Be first to know the moment this product is ready to order.',
      submitLabel: 'Join Waitlist',
      successTitle: 'You’re on the list.',
      successBody: 'We’ll email you the moment early access opens.',
      fields: function(ctx) {
        return [
          { name: 'product', label: 'Product', type: 'text', value: ctx.product || '', readonly: !!ctx.product },
          { name: 'name', label: 'Full Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true }
        ];
      }
    },
    facilityQuote: {
      eyebrow: 'Healthcare Facilities',
      title: 'Request Facility Pricing',
      subtitle: 'Hospitals, surgery centers, clinics, and recovery centers get volume pricing and priority in our manufacturing queue.',
      submitLabel: 'Request Quote',
      successTitle: 'Request received.',
      successBody: 'Our team will follow up within one business day with facility pricing.',
      fields: function() {
        return [
          { name: 'facility', label: 'Facility Name', type: 'text', required: true },
          { name: 'facilityType', label: 'Facility Type', type: 'select', required: true, options: ['Hospital', 'Surgery Center', 'Clinic', 'Recovery Center', 'Other'] },
          { name: 'name', label: 'Your Name', type: 'text', required: true },
          { name: 'role', label: 'Role / Title', type: 'text' },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'estimatedUnits', label: 'Estimated Units Needed', type: 'select', options: ['Under 50', '50–200', '200–500', '500+'] }
        ];
      }
    },
    demo: {
      eyebrow: 'Healthcare Facilities',
      title: 'Schedule a Demo',
      subtitle: 'See MEND in action and talk through fit for your facility.',
      submitLabel: 'Request Demo',
      successTitle: 'Thanks — request received.',
      successBody: 'Our team will reach out to find a time that works for you.',
      fields: function() {
        return [
          { name: 'facility', label: 'Facility / Organization', type: 'text', required: true },
          { name: 'name', label: 'Your Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'preferredTime', label: 'Preferred time (optional)', type: 'text', placeholder: 'e.g. weekday mornings' }
        ];
      }
    },
    distributor: {
      eyebrow: 'Companies & Distributors',
      title: 'Become a Distribution Partner',
      subtitle: 'Medical distributors, retailers, medical supply companies, home health organizations, and physical therapy practices — let’s talk wholesale.',
      submitLabel: 'Submit Application',
      successTitle: 'Application received.',
      successBody: 'Our partnerships team will review your application and follow up shortly.',
      fields: function() {
        return [
          { name: 'company', label: 'Company Name', type: 'text', required: true },
          { name: 'businessType', label: 'Business Type', type: 'select', required: true, options: ['Medical Distributor', 'Retailer', 'Medical Supply Company', 'Home Health Organization', 'Physical Therapy Practice', 'Other'] },
          { name: 'name', label: 'Your Name', type: 'text', required: true },
          { name: 'email', label: 'Email', type: 'email', required: true },
          { name: 'phone', label: 'Phone', type: 'tel' },
          { name: 'website', label: 'Company Website', type: 'text' },
          { name: 'region', label: 'Region Served', type: 'text' }
        ];
      }
    },
    newsletter: {
      eyebrow: 'Stay in the Loop',
      title: 'Get Manufacturing Updates',
      subtitle: 'Short, occasional emails as we move through production — no spam.',
      submitLabel: 'Sign Up',
      successTitle: 'You’re subscribed.',
      successBody: 'Watch your inbox for updates as we get closer to launch.',
      fields: function() {
        return [
          { name: 'email', label: 'Email', type: 'email', required: true }
        ];
      }
    }
  };

  var style = document.createElement('style');
  style.textContent = [
    // Self-contained palette so extracted content (which uses var(--accent) etc.)
    // renders correctly even on pages that never loaded styles.css.
    '.mend-modal-panel{--bg:#FAFAF8; --fg:#2B2B28; --muted:#8A857C; --line:#E3DFD6; --accent:#7C8B7A; --accent-dark:#677866; --panel:#F1EEE7;}',
    '.mend-modal-overlay{position:fixed; inset:0; z-index:1000; display:flex; align-items:flex-start; justify-content:center;',
    '  padding:6vh 20px; background:rgba(30,28,24,0); overflow-y:auto; opacity:0; pointer-events:none;',
    '  transition:opacity .3s ease, background .3s ease;}',
    '.mend-modal-overlay.mend-open{opacity:1; pointer-events:auto; background:rgba(30,28,24,.5);}',
    '.mend-modal-panel{position:relative; background:var(--bg); color:var(--fg); width:100%; max-width:720px; border-radius:20px;',
    '  padding:44px 40px 56px; box-shadow:0 30px 80px rgba(0,0,0,.28); transform:translateY(18px) scale(.98); opacity:0;',
    '  transition:transform .35s cubic-bezier(.2,.7,.2,1), opacity .3s ease; font-family:"Inter",Helvetica,Arial,sans-serif;}',
    '.mend-modal-overlay.mend-open .mend-modal-panel{transform:translateY(0) scale(1); opacity:1;}',
    '.mend-modal-panel .wrap{max-width:none; padding:0; margin:0;}',
    '.mend-modal-close{position:absolute; top:18px; right:18px; width:36px; height:36px; border-radius:50%; border:1px solid var(--line);',
    '  background:#fff; color:var(--fg); font-size:18px; line-height:1; cursor:pointer; display:flex; align-items:center; justify-content:center;',
    '  transition:transform .2s ease, border-color .2s ease, color .2s ease;}',
    '.mend-modal-close:hover{transform:rotate(90deg); border-color:var(--accent); color:var(--accent);}',
    '.mend-modal-loading{padding:60px 0; text-align:center; color:var(--muted); font-size:14px;}',
    '.mend-modal-panel .page-hero{padding-top:0; margin-top:0;}',
    // Contact form, scoped to the modal panel only — never leaks onto the
    // host page's own forms/inputs (several PDPs have their own).
    '.mend-modal-panel .contact-grid{display:grid; grid-template-columns:1fr 1fr; gap:40px;}',
    '@media(max-width:640px){.mend-modal-panel .contact-grid{grid-template-columns:1fr;}}',
    '.mend-modal-panel .contact-grid h2{font-size:24px; font-weight:600; margin-bottom:12px;}',
    '.mend-modal-panel .contact-grid > div > p{color:var(--muted); font-size:15px; margin-bottom:8px;}',
    '.mend-modal-panel .detail{font-size:14px; margin-top:20px; padding:12px 14px; border-radius:10px; border:1px solid var(--line);}',
    '.mend-modal-panel .detail strong{display:block; color:var(--fg); margin-bottom:4px;}',
    '.mend-modal-panel form{display:flex; flex-direction:column; gap:14px;}',
    '.mend-modal-panel label{font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--muted); margin-bottom:6px; display:block;}',
    '.mend-modal-panel input, .mend-modal-panel textarea, .mend-modal-panel select{width:100%; padding:12px 14px; border-radius:8px; border:1px solid var(--line); background:var(--panel); color:var(--fg); font-family:inherit; font-size:14px;}',
    '.mend-modal-panel input:focus, .mend-modal-panel textarea:focus, .mend-modal-panel select:focus{outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(124,139,122,.15);}',
    '.mend-modal-panel input[readonly]{color:var(--muted); cursor:not-allowed;}',
    '.mend-modal-panel textarea{resize:vertical; min-height:110px;}',
    '.mend-modal-panel .form-msg{font-size:13px; color:var(--accent); display:none; margin-top:8px;}',
    '.mend-modal-panel .form-msg.show{display:block;}',
    // Lead-capture form modals (Reserve, Waitlist, Facility Quote, etc.)
    '.mend-lead-eyebrow{font-size:12px; letter-spacing:.14em; text-transform:uppercase; color:var(--accent-dark); font-weight:600; margin-bottom:10px;}',
    '.mend-modal-panel .mend-lead-title{font-size:26px; font-weight:600; margin-bottom:8px; line-height:1.2;}',
    '.mend-lead-subtitle{color:var(--muted); font-size:14px; line-height:1.6; margin-bottom:24px;}',
    '.mend-lead-form{display:flex; flex-direction:column; gap:14px;}',
    '.mend-lead-form .mend-lead-row{display:grid; grid-template-columns:1fr 1fr; gap:14px;}',
    '@media(max-width:480px){.mend-lead-form .mend-lead-row{grid-template-columns:1fr;}}',
    '.mend-lead-form button[type="submit"]{margin-top:6px;}',
    '.mend-lead-form select{appearance:none; background-image:url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="%238A857C" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>\'); background-repeat:no-repeat; background-position:right 14px center;}',
    '.mend-form-error{font-size:13px; color:#c0392b; display:none; margin-top:2px;}',
    '.mend-form-error.show{display:block;}',
    '.mend-form-success{text-align:center; padding:12px 0 4px;}',
    '.mend-success-check{width:52px; height:52px; border-radius:50%; background:var(--accent); color:#fff; font-size:24px; font-weight:700; display:flex; align-items:center; justify-content:center; margin:0 auto 20px; animation:mend-success-pop .5s cubic-bezier(.34,1.56,.64,1);}',
    '@keyframes mend-success-pop{0%{opacity:0; transform:scale(.6);} 60%{opacity:1; transform:scale(1.08);} 100%{opacity:1; transform:scale(1);}}',
    '.mend-form-success h2{font-size:22px; font-weight:600; margin-bottom:10px;}',
    '.mend-form-success p{color:var(--muted); font-size:14px; margin-bottom:22px;}',
    '@media(max-width:640px){.mend-modal-panel{padding:36px 22px 44px; border-radius:16px;}}',
    '@media (prefers-reduced-motion: reduce){',
    '  .mend-modal-overlay, .mend-modal-panel, .mend-success-check{transition:none !important; animation:none !important;}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.className = 'mend-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = '<div class="mend-modal-panel"><button type="button" class="mend-modal-close" aria-label="Close">✕</button><div class="mend-modal-body"><div class="mend-modal-loading">Loading…</div></div></div>';
  document.body.appendChild(overlay);

  var panel = overlay.querySelector('.mend-modal-panel');
  var panelBody = overlay.querySelector('.mend-modal-body');
  var lastFocused = null;

  function closeModal() {
    overlay.classList.remove('mend-open');
    overlay.removeAttribute('aria-labelledby');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

  // Basic focus trap: Tab/Shift+Tab cycle within the panel while it's open.
  panel.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    var focusable = panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    var first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  var injectedFrom = {};

  // FAQ.html and Privacy-Terms.html each carry their own inline <style> in
  // <head> (accordion, tabs, legal-doc layout) that a page like a PDP never
  // loaded. Their rules only ever target their own narrowly-scoped classes
  // (.faq-*, .page-hero, .doc-tab, .legal-*), so cloning that <style> block
  // in is safe. We do NOT do this for the Contact source (index.html) —
  // its inline styles use bare element selectors (form, label, input,
  // textarea) that would leak onto other pages' own forms; the contact
  // form's look is instead hand-written above, scoped to .mend-modal-panel.
  function ensureSourceStyles(doc, src) {
    if (injectedFrom[src]) return;
    injectedFrom[src] = true;
    doc.querySelectorAll('head style').forEach(function(styleEl) {
      var clone = document.createElement('style');
      clone.setAttribute('data-modal-source', src);
      clone.textContent = styleEl.textContent;
      document.head.appendChild(clone);
    });
  }

  function openModal(src, extractSelector, label, inlineStyles) {
    lastFocused = document.activeElement;
    panelBody.innerHTML = '<div class="mend-modal-loading">Loading…</div>';
    overlay.classList.add('mend-open');
    document.body.style.overflow = 'hidden';
    overlay.querySelector('.mend-modal-close').focus();
    if (window.gtag) gtag('event', 'modal_open', { modal_type: label });

    fetch(src).then(function(res) {
      if (!res.ok) throw new Error('Fetch failed');
      return res.text();
    }).then(function(html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      if (inlineStyles) ensureSourceStyles(doc, src);
      var content = doc.querySelector(extractSelector);
      panelBody.innerHTML = content ? content.innerHTML : '<p>Sorry, something went wrong loading "' + label + '".</p>';
      panelBody.querySelectorAll('.section').forEach(function(el) { el.classList.add('in-view'); });
    }).catch(function() {
      window.location.href = src;
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function(c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderField(f) {
    var id = 'mendField_' + f.name;
    var req = f.required ? ' required' : '';
    if (f.type === 'select') {
      var opts = (f.options || []).map(function(o) { return '<option value="' + esc(o) + '">' + esc(o) + '</option>'; }).join('');
      return '<div><label for="' + id + '">' + esc(f.label) + '</label><select id="' + id + '" name="' + f.name + '"' + req + '><option value="">Select…</option>' + opts + '</select></div>';
    }
    var attrs = 'id="' + id + '" name="' + f.name + '" type="' + f.type + '"' + req;
    if (f.value) attrs += ' value="' + esc(f.value) + '"';
    if (f.readonly) attrs += ' readonly';
    if (f.min) attrs += ' min="' + f.min + '"';
    if (f.max) attrs += ' max="' + f.max + '"';
    if (f.placeholder) attrs += ' placeholder="' + esc(f.placeholder) + '"';
    return '<div><label for="' + id + '">' + esc(f.label) + '</label><input ' + attrs + '></div>';
  }

  function openFormModal(type, ctx) {
    var cfg = MODAL_FORMS[type];
    if (!cfg) return;
    ctx = ctx || {};
    lastFocused = document.activeElement;
    var fields = cfg.fields(ctx).map(renderField).join('');
    var titleId = 'mendModalTitle';
    panelBody.innerHTML = [
      '<div class="mend-lead-eyebrow">' + esc(cfg.eyebrow) + '</div>',
      '<h2 class="mend-lead-title" id="' + titleId + '">' + esc(cfg.title) + '</h2>',
      '<p class="mend-lead-subtitle">' + esc(cfg.subtitle) + '</p>',
      '<form class="mend-lead-form" data-lead-type="' + esc(type) + '">',
      fields,
      '<button type="submit" class="btn btn-primary">' + esc(cfg.submitLabel) + '</button>',
      '<div class="mend-form-error" role="alert"></div>',
      '</form>'
    ].join('');
    overlay.setAttribute('aria-labelledby', titleId);
    overlay.classList.add('mend-open');
    document.body.style.overflow = 'hidden';
    var firstField = panelBody.querySelector('input:not([readonly]), select');
    (firstField || overlay.querySelector('.mend-modal-close')).focus();
    if (window.gtag) gtag('event', 'modal_open', { modal_type: type });
  }

  function showFormSuccess(cfg) {
    panelBody.innerHTML = [
      '<div class="mend-form-success">',
      '<div class="mend-success-check">✓</div>',
      '<h2>' + esc(cfg.successTitle) + '</h2>',
      '<p>' + esc(cfg.successBody) + '</p>',
      '<button type="button" class="btn btn-secondary mend-modal-done">Close</button>',
      '</div>'
    ].join('');
    panelBody.querySelector('.mend-modal-done').focus();
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.closest('.mend-modal-close') || e.target.closest('.mend-modal-done')) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('mend-open')) closeModal();
  });

  // Page-content modals (FAQ / Privacy & Terms / Contact) via plain hrefs.
  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var config = MODAL_SOURCES[href];
    if (!config) return;
    e.preventDefault();
    openModal(config.src || href, config.extract, config.label, config.inlineStyles);
  });

  // Lead-capture modals via data-modal="type" [data-product="…"].
  document.addEventListener('click', function(e) {
    var trigger = e.target.closest('[data-modal]');
    if (!trigger) return;
    e.preventDefault();
    openFormModal(trigger.getAttribute('data-modal'), { product: trigger.getAttribute('data-product') || '' });
  });

  // Lead-capture form submissions → /api/lead.
  document.addEventListener('submit', function(e) {
    var form = e.target.closest('.mend-lead-form');
    if (!form) return;
    e.preventDefault();
    var type = form.getAttribute('data-lead-type');
    var cfg = MODAL_FORMS[type];
    var errorEl = form.querySelector('.mend-form-error');
    var submitBtn = form.querySelector('button[type="submit"]');
    errorEl.classList.remove('show');
    submitBtn.disabled = true;

    var data = { type: type };
    new FormData(form).forEach(function(value, key) { data[key] = value; });

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(res) {
      if (!res.ok) throw new Error('Request failed');
      if (window.gtag) gtag('event', 'lead_submit', { modal_type: type });
      showFormSuccess(cfg);
    }).catch(function() {
      errorEl.textContent = 'Something went wrong — please try again.';
      errorEl.classList.add('show');
      submitBtn.disabled = false;
    });
  });

  window.MendModal = { open: openFormModal, close: closeModal };
})();

// Persistent floating Reserve CTA. Opt-in per page via `<body data-sticky-cta>`;
// add `data-sticky-cta-product="…"` to prefill/lock the Reserve modal's
// product field with the page's own product instead of the generic default.
// Styles are self-injected (not in styles.css) because several pages that
// use this CTA — the MEND Pulse/Oxi/App product pages — don't load
// styles.css at all, the same reason the modal system injects its own CSS.
(function() {
  if (!document.body.hasAttribute('data-sticky-cta')) return;

  var style = document.createElement('style');
  style.textContent = [
    '.mend-sticky-cta{',
    '  position:fixed; z-index:900; cursor:pointer; border:none; font-family:"Inter",Helvetica,Arial,sans-serif; font-weight:700;',
    '  letter-spacing:.04em; text-transform:uppercase; background:#7C8B7A; color:#fff;',
    '  box-shadow:0 14px 34px rgba(0,0,0,.22);',
    '  transition:transform .3s cubic-bezier(.34,1.56,.64,1), opacity .3s ease, background .2s ease, box-shadow .25s ease;',
    '  opacity:0; pointer-events:none;',
    '}',
    '.mend-sticky-cta.show{opacity:1; pointer-events:auto;}',
    '.mend-sticky-cta:hover{background:#677866; box-shadow:0 18px 40px rgba(0,0,0,.3);}',
    '@media(min-width:641px){',
    '  .mend-sticky-cta{left:24px; bottom:24px; padding:15px 28px; border-radius:999px; font-size:13px; transform:translateY(14px) scale(.94);}',
    '  .mend-sticky-cta.show{transform:translateY(0) scale(1);}',
    '  .mend-sticky-cta .sticky-cta-mobile{display:none;}',
    '}',
    '@media(max-width:640px){',
    '  .mend-sticky-cta{left:0; right:0; bottom:0; width:100%; padding:16px; font-size:14px; border-radius:0; box-shadow:0 -8px 24px rgba(0,0,0,.16); transform:translateY(100%); padding-bottom:calc(16px + env(safe-area-inset-bottom));}',
    '  .mend-sticky-cta.show{transform:translateY(0);}',
    '  .mend-sticky-cta .sticky-cta-desktop{display:none;}',
    '}',
    '@media (prefers-reduced-motion: reduce){ .mend-sticky-cta{transition:opacity .15s linear !important; transform:none !important;} }'
  ].join('\n');
  document.head.appendChild(style);

  var product = document.body.getAttribute('data-sticky-cta-product') || '';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mend-sticky-cta';
  btn.setAttribute('data-modal', 'reserve');
  if (product) btn.setAttribute('data-product', product);
  btn.setAttribute('aria-label', 'Reserve your order');
  btn.innerHTML = '<span class="sticky-cta-desktop">Reserve Your Order</span><span class="sticky-cta-mobile">Pre-Order Now</span>';
  document.body.appendChild(btn);

  function toggle() {
    btn.classList.toggle('show', window.scrollY > 400);
  }
  window.addEventListener('scroll', toggle, { passive: true });
  toggle();

  // Hide while any modal is open so it never stacks visually above the overlay.
  var overlayEl = document.querySelector('.mend-modal-overlay');
  if (overlayEl) {
    new MutationObserver(function() {
      btn.style.display = overlayEl.classList.contains('mend-open') ? 'none' : '';
    }).observe(overlayEl, { attributes: true, attributeFilter: ['class'] });
  }
})();

// Product-card mini slideshow — cards with multiple photos (color/angle variants)
// crossfade between them automatically, pausing while the card is hovered so
// shoppers get a still, zoomed-in look rather than a photo fading mid-hover.
(function() {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.querySelectorAll('.img-box[data-carousel]').forEach(function(box) {
    var imgs = box.querySelectorAll('img');
    if (imgs.length < 2 || reduceMotion) return;
    var dots = box.querySelectorAll('.img-dot');
    var i = 0;
    var timer = null;
    function show(next) {
      imgs[i].classList.remove('active');
      if (dots[i]) dots[i].classList.remove('active');
      i = (next + imgs.length) % imgs.length;
      imgs[i].classList.add('active');
      if (dots[i]) dots[i].classList.add('active');
    }
    function start() {
      stop();
      timer = setInterval(function() { show(i + 1); }, 3200);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }
    var card = box.closest('.product-card');
    card.addEventListener('mouseenter', stop);
    card.addEventListener('mouseleave', start);
    start();
  });
})();
