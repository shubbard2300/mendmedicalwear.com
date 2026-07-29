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
  'background:var(--accent)', 'z-index:999', 'pointer-events:none',
  'transition:width .1s linear'
].join(';');
document.body.appendChild(progressBar);

window.addEventListener('scroll', function() {
  var pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  progressBar.style.width = Math.min(pct, 100) + '%';
}, { passive: true });

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

// Product card 3D tilt
if (!prefersReducedMotion)
document.querySelectorAll('.product-card').forEach(function(card) {
  card.addEventListener('mousemove', function(e) {
    var r = card.getBoundingClientRect();
    var rx = ((e.clientY - r.top) / r.height - 0.5) * -10;
    var ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
    card.style.transform = 'perspective(800px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-8px)';
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

// Contact form → /api/contact (Resend email forwarding)
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
    name: form.name.value,
    email: form.email.value,
    message: form.message.value
  };

  fetch('/api/contact', {
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

// ── Popup modals for FAQ, Privacy & Terms, and Contact ──
// Every page links to these with plain hrefs (FAQ.html, Privacy-Terms.html,
// index.html#contact) so navigation still works with JS disabled; here we
// intercept those exact links and show the content in an overlay instead.
(function() {
  var MODAL_SOURCES = {
    'FAQ.html': { extract: '#modalBody', label: 'Frequently Asked Questions', inlineStyles: true },
    'Privacy-Terms.html': { extract: '#modalBody', label: 'Privacy & Terms', inlineStyles: true },
    'index.html#contact': { extract: '#contact', label: 'Get in Touch' },
    '#contact': { extract: '#contact', label: 'Get in Touch', src: 'index.html' }
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
    '.mend-modal-panel input, .mend-modal-panel textarea{width:100%; padding:12px 14px; border-radius:8px; border:1px solid var(--line); background:var(--panel); color:var(--fg); font-family:inherit; font-size:14px;}',
    '.mend-modal-panel input:focus, .mend-modal-panel textarea:focus{outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(124,139,122,.15);}',
    '.mend-modal-panel textarea{resize:vertical; min-height:110px;}',
    '.mend-modal-panel .form-msg{font-size:13px; color:var(--accent); display:none; margin-top:8px;}',
    '.mend-modal-panel .form-msg.show{display:block;}',
    '@media(max-width:640px){.mend-modal-panel{padding:36px 22px 44px; border-radius:16px;}}',
    '@media (prefers-reduced-motion: reduce){',
    '  .mend-modal-overlay, .mend-modal-panel{transition:none !important;}',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  var overlay = document.createElement('div');
  overlay.className = 'mend-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = '<div class="mend-modal-panel"><button type="button" class="mend-modal-close" aria-label="Close">✕</button><div class="mend-modal-body"><div class="mend-modal-loading">Loading…</div></div></div>';
  document.body.appendChild(overlay);

  var panelBody = overlay.querySelector('.mend-modal-body');
  var lastFocused = null;

  function closeModal() {
    overlay.classList.remove('mend-open');
    document.body.style.overflow = '';
    if (lastFocused) lastFocused.focus();
  }

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

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target.closest('.mend-modal-close')) closeModal();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('mend-open')) closeModal();
  });

  document.addEventListener('click', function(e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    var config = MODAL_SOURCES[href];
    if (!config) return;
    e.preventDefault();
    openModal(config.src || href, config.extract, config.label, config.inlineStyles);
  });
})();
