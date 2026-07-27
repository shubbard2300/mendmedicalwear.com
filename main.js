/* MEND Medical Apparel — main.js */

// Scroll-reveal
var revealObserver = new IntersectionObserver(function(entries) {
  entries.forEach(function(entry) {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

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

// Brand-It logo customizer (called per PDP)
window.initBrandIt = function(productLabel) {
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

  function drawMockup(logo) {
    var W = 600, H = 380;
    canvas.width = W; canvas.height = H;

    // Background
    ctx.fillStyle = '#F1EEE7';
    ctx.fillRect(0, 0, W, H);

    // Fabric grid
    ctx.strokeStyle = 'rgba(227,223,214,.6)';
    ctx.lineWidth = 1;
    for (var x = 0; x < W; x += 18) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for (var y = 0; y < H; y += 18) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // Label patch
    var pw = 260, ph = 180, px = (W-pw)/2, py = (H-ph)/2 - 16;
    ctx.shadowColor = 'rgba(0,0,0,.12)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    ctx.fillStyle = '#fff';
    roundRect(px, py, pw, ph, 12); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Accent bar
    ctx.fillStyle = '#7C8B7A';
    roundRect(px, py, pw, 6, {tl:12, tr:12, br:0, bl:0}); ctx.fill();

    // Logo or placeholder
    if (logo) {
      var maxW = pw - 48, maxH = ph - 56;
      var ratio = Math.min(maxW / logo.width, maxH / logo.height);
      var lw = logo.width * ratio, lh = logo.height * ratio;
      ctx.drawImage(logo, px + (pw-lw)/2, py + 28 + (ph-56-lh)/2, lw, lh);
    } else {
      ctx.fillStyle = '#C8C4BC';
      ctx.font = '600 13px Inter,sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOUR LOGO HERE', W/2, py + ph/2 + 6);
    }

    // Label below patch
    ctx.fillStyle = '#8A857C';
    ctx.font = '500 11px Inter,sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText((productLabel || 'MEND Medical').toUpperCase(), W/2, py + ph + 26);

    // Stitch marks
    ctx.strokeStyle = '#7C8B7A'; ctx.lineWidth = 1.5;
    [[px-8,py-8],[px+pw+8,py-8],[px-8,py+ph+8],[px+pw+8,py+ph+8]].forEach(function(c) {
      ctx.beginPath(); ctx.moveTo(c[0]-6,c[1]); ctx.lineTo(c[0]+6,c[1]); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c[0],c[1]-6); ctx.lineTo(c[0],c[1]+6); ctx.stroke();
    });

    // Watermark
    ctx.fillStyle = 'rgba(138,133,124,.28)';
    ctx.font = '400 10px Inter,sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('custom branding preview · mendmedicalwear.com', W-14, H-12);

    canvas.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }

  drawMockup(null);

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
    if (placeholder) placeholder.style.display = '';
  });
};
