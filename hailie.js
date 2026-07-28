/* Hailie — MEND's voice concierge widget.
   Self-contained: injects its own styles and DOM. Talks to /api/hailie for
   answers (Claude), falls back to a built-in knowledge base offline.
   Voice in via the Web Speech API (SpeechRecognition), voice out via
   speechSynthesis. */
(function () {
  'use strict';
  if (window.__hailieLoaded) return;
  window.__hailieLoaded = true;

  var API_URL = '/api/hailie';
  var VOICE_PREF_KEY = 'hailie-voice-on';
  var GREETING =
    "Hi, I'm Hailie — MEND's concierge. Ask me about our recovery gowns, scrubs, compression socks, or the AirGuard collar. Tap the mic to talk to me, and I'll talk back.";

  /* ---------- Local knowledge fallback (works with no API key) ---------- */
  function localAnswer(q) {
    var t = q.toLowerCase();
    function has(re) { return re.test(t); }

    if (has(/\b(hi|hello|hey|good (morning|afternoon|evening))\b/) && t.length < 30)
      return "Hi there! I'm Hailie. Ask me anything about MEND's products, shipping, sizing, or returns.";
    if (has(/who are you|your name|what are you/))
      return "I'm Hailie, MEND's virtual concierge. I can answer questions about our recovery wear, prices, shipping, and more — by text or voice.";
    // Intent words (wash, logo, shipping, returns…) must be checked before
    // product nouns, or "how do I wash the gown" answers with gown specs.
    if (has(/price|cost|how much/))
      return "The Comfort Wrap gown is $68, Comfort Scrubs are $74, and Compression Socks are $28. Coming soon: the AirGuard collar at $89, MEND Pulse at $129, and MEND Oxi at $59. Standard US shipping is free.";
    if (has(/wash|clean|care instruction|laundry|dry\b/))
      return "Machine wash cold on gentle, tumble dry low, no bleach. Our fabrics are tested to over 100 wash cycles. For the AirGuard, remove the sensor and CO2 canister first — the fabric shell is washable.";
    if (has(/logo|custom|brand|embroider|wholesale|bulk|facility order/))
      return "Yes — for bulk orders of 24 or more units we embroider your facility's logo on gowns and scrubs, with about a 3 to 4 week lead time, and we offer wholesale pricing for hospitals and care agencies. Try the Brand-It preview on any product page, or reach out through the contact form.";
    if (has(/ship|deliver|arrive|international|canada|\buk\b|europe/))
      return "We ship to all 50 US states with free standard shipping in 5 to 7 business days. Expedited is $12 for 2 to 3 days, overnight is $28. International shipping to Canada, the UK, and the EU is coming late 2026.";
    if (has(/return|refund|exchange/))
      return "You can return unworn, unwashed items within 30 days of delivery — we'll email you a prepaid label. Compression socks need to be unopened. Refunds process within 3 to 5 business days of us receiving the return.";
    if (has(/\bsize|sizing|what size|fit\b/))
      return "Gowns and scrubs run XS to 3XL, true to standard US sizing — order your usual top size. Socks are sized by calf circumference: S/M for 12 to 16 inches, L/XL for 16 to 20, and XL/XXL above that. Need something outside that range? Contact us and we'll help.";
    if (has(/gown|comfort wrap|hospital wear/))
      return "The Comfort Wrap is our stylish washable hospital gown — $68, in Heather Grey, Sage, Blue, Oatmeal, and a Classic Print, sizes XS to 3XL. It closes fully at the back and has a front zip for IV access, in a soft cotton-merino blend.";
    if (has(/scrub/))
      return "Comfort Scrubs are our residential nurse scrub set — $74, sizes XS to 3XL. Durable, breathable, and soft enough to feel like you instead of a uniform.";
    if (has(/sock|compression/))
      return "Our Compression Socks are $28 with 20 to 30 millimeters of mercury graduated compression — the clinical standard for long shifts. Sizes go by calf circumference: S/M for 12 to 16 inches, L/XL for 16 to 20, and XL/XXL above that.";
    if (has(/airguard|collar|fall|airbag/))
      return "The AirGuard is a wearable airbag collar that detects a fall, inflates to protect, and alerts your emergency contacts with GPS in about two seconds. It's $89 on pre-order, pending FDA clearance, with an estimated Q3 2026 ship date — you're only charged when it ships.";
    if (has(/pulse|blood pressure|\bbp\b/))
      return "MEND Pulse is our wireless upper-arm blood pressure monitor, coming soon at $129. You can find details on its product page.";
    if (has(/oxi|oximeter|oxygen|spo2/))
      return "MEND Oxi is our fingertip pulse oximeter, coming soon at $59. Check its product page for details.";
    if (has(/how long|delivery time/))
      return "Standard shipping is free and takes 5 to 7 business days. Expedited is $12 for 2 to 3 days, and overnight is $28.";
    if (has(/damaged|defect|broken/))
      return "If something arrives damaged, contact us within 7 days with a photo and your order number and we'll send a free replacement — no return needed.";
    if (has(/contact|email|phone|reach|human|person/))
      return "You can reach the MEND team at contact@stevenjhubbard.com, or through the contact form at the bottom of the homepage. We're based in Portland, Oregon.";
    if (has(/fda|cleared|ce mark|regulat/))
      return "Our apparel doesn't require FDA clearance. The AirGuard collar is a medical device pending FDA 510(k) clearance and CE Mark — it ships only after clearance is received.";
    if (has(/order|cancel|change/))
      return "Orders can be changed or cancelled within 24 hours of placing them. After that, contact us right away and we'll do our best.";
    if (has(/thank/))
      return "You're so welcome! Anything else I can help with?";
    return "I'm not sure about that one — but our FAQ page covers a lot, and you can always reach the team through the contact form on the homepage. Want to ask me about a product, shipping, or returns?";
  }

  /* ---------- Styles ---------- */
  var css = [
    '.hailie-launcher{position:fixed;right:20px;bottom:20px;z-index:9000;display:flex;align-items:center;gap:10px;padding:12px 18px 12px 14px;border:none;border-radius:999px;background:var(--accent,#7C8B7A);color:#fff;font-family:inherit;font-size:14px;font-weight:600;cursor:pointer;box-shadow:0 10px 30px rgba(0,0,0,.18);transition:transform .2s ease,background .2s ease;}',
    '.hailie-launcher:hover{background:var(--accent-dark,#677866);transform:translateY(-2px);}',
    '.hailie-launcher svg{width:20px;height:20px;flex-shrink:0;}',
    '.hailie-panel{position:fixed;right:20px;bottom:20px;z-index:9001;width:min(380px,calc(100vw - 24px));height:min(560px,calc(100vh - 40px));display:none;flex-direction:column;background:var(--bg,#FAFAF8);border:1px solid var(--line,#E3DFD6);border-radius:18px;box-shadow:0 24px 60px rgba(0,0,0,.22);overflow:hidden;font-family:inherit;}',
    '.hailie-panel.open{display:flex;animation:hailie-in .25s ease;}',
    '@keyframes hailie-in{from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);}}',
    '@media (prefers-reduced-motion:reduce){.hailie-panel.open{animation:none;}}',
    '.hailie-head{display:flex;align-items:center;gap:10px;padding:14px 16px;background:var(--accent,#7C8B7A);color:#fff;}',
    '.hailie-head .hailie-avatar{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;flex-shrink:0;}',
    '.hailie-head .hailie-avatar svg{width:18px;height:18px;}',
    '.hailie-head .hailie-title{flex:1;line-height:1.25;}',
    '.hailie-head .hailie-title strong{display:block;font-size:15px;}',
    '.hailie-head .hailie-title span{font-size:11px;opacity:.85;letter-spacing:.04em;}',
    '.hailie-iconbtn{background:none;border:none;color:#fff;cursor:pointer;padding:6px;border-radius:8px;display:flex;align-items:center;justify-content:center;transition:background .15s ease;}',
    '.hailie-iconbtn:hover{background:rgba(255,255,255,.18);}',
    '.hailie-iconbtn svg{width:18px;height:18px;}',
    '.hailie-iconbtn.muted{opacity:.55;}',
    '.hailie-msgs{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;}',
    '.hailie-msg{max-width:85%;padding:10px 14px;border-radius:14px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;}',
    '.hailie-msg.bot{align-self:flex-start;background:var(--panel,#F1EEE7);color:var(--fg,#2B2B28);border-bottom-left-radius:4px;}',
    '.hailie-msg.user{align-self:flex-end;background:var(--accent,#7C8B7A);color:#fff;border-bottom-right-radius:4px;}',
    '.hailie-msg.typing span{display:inline-block;width:6px;height:6px;margin:0 2px;border-radius:50%;background:var(--muted,#8A857C);animation:hailie-dot 1.2s infinite;}',
    '.hailie-msg.typing span:nth-child(2){animation-delay:.15s;}',
    '.hailie-msg.typing span:nth-child(3){animation-delay:.3s;}',
    '@keyframes hailie-dot{0%,60%,100%{transform:translateY(0);opacity:.4;}30%{transform:translateY(-4px);opacity:1;}}',
    '.hailie-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 16px 8px;}',
    '.hailie-chip{border:1px solid var(--line,#E3DFD6);background:var(--bg,#FAFAF8);color:var(--muted,#8A857C);border-radius:999px;padding:6px 12px;font-size:12px;font-family:inherit;cursor:pointer;transition:border-color .15s ease,color .15s ease;}',
    '.hailie-chip:hover{border-color:var(--accent,#7C8B7A);color:var(--fg,#2B2B28);}',
    '.hailie-inputrow{display:flex;align-items:center;gap:8px;padding:12px;border-top:1px solid var(--line,#E3DFD6);background:var(--bg,#FAFAF8);}',
    '.hailie-input{flex:1;border:1px solid var(--line,#E3DFD6);background:#fff;border-radius:999px;padding:10px 16px;font-size:14px;font-family:inherit;color:var(--fg,#2B2B28);outline:none;transition:border-color .15s ease,box-shadow .15s ease;}',
    '.hailie-input:focus{border-color:var(--accent,#7C8B7A);box-shadow:0 0 0 3px rgba(124,139,122,.15);}',
    '.hailie-roundbtn{width:40px;height:40px;flex-shrink:0;border:none;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s ease,transform .15s ease;}',
    '.hailie-roundbtn svg{width:18px;height:18px;}',
    '.hailie-mic{background:var(--panel,#F1EEE7);color:var(--fg,#2B2B28);}',
    '.hailie-mic:hover{background:var(--line,#E3DFD6);}',
    '.hailie-mic.listening{background:#c0574f;color:#fff;animation:hailie-pulse 1.2s infinite;}',
    '@keyframes hailie-pulse{0%{box-shadow:0 0 0 0 rgba(192,87,79,.45);}70%{box-shadow:0 0 0 12px rgba(192,87,79,0);}100%{box-shadow:0 0 0 0 rgba(192,87,79,0);}}',
    '.hailie-send{background:var(--accent,#7C8B7A);color:#fff;}',
    '.hailie-send:hover{background:var(--accent-dark,#677866);}',
    '.hailie-note{font-size:11px;color:var(--muted,#8A857C);text-align:center;padding:0 16px 10px;}',
    '@media (max-width:480px){.hailie-panel{right:12px;bottom:12px;border-radius:14px;}}'
  ].join('\n');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---------- Icons ---------- */
  var ICON_WAVE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="4" y1="10" x2="4" y2="14"/><line x1="8" y1="7" x2="8" y2="17"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="16" y1="7" x2="16" y2="17"/><line x1="20" y1="10" x2="20" y2="14"/></svg>';
  var ICON_MIC =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="8" y1="22" x2="16" y2="22"/></svg>';
  var ICON_SEND =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  var ICON_SOUND_ON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var ICON_SOUND_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>';
  var ICON_CLOSE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  /* ---------- DOM ---------- */
  var launcher = document.createElement('button');
  launcher.className = 'hailie-launcher';
  launcher.setAttribute('aria-label', 'Open Hailie, the MEND voice assistant');
  launcher.innerHTML = ICON_WAVE + '<span>Ask Hailie</span>';

  var panel = document.createElement('div');
  panel.className = 'hailie-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Hailie voice assistant');
  panel.innerHTML =
    '<div class="hailie-head">' +
    '<div class="hailie-avatar">' + ICON_WAVE + '</div>' +
    '<div class="hailie-title"><strong>Hailie</strong><span>MEND Voice Concierge</span></div>' +
    '<button class="hailie-iconbtn hailie-soundtoggle" aria-label="Toggle voice replies" title="Toggle voice replies"></button>' +
    '<button class="hailie-iconbtn hailie-close" aria-label="Close">' + ICON_CLOSE + '</button>' +
    '</div>' +
    '<div class="hailie-msgs" aria-live="polite"></div>' +
    '<div class="hailie-chips">' +
    '<button class="hailie-chip">Tell me about the Comfort Wrap</button>' +
    '<button class="hailie-chip">When does AirGuard ship?</button>' +
    '<button class="hailie-chip">What’s your return policy?</button>' +
    '</div>' +
    '<div class="hailie-inputrow">' +
    '<button class="hailie-roundbtn hailie-mic" aria-label="Speak to Hailie" title="Speak to Hailie">' + ICON_MIC + '</button>' +
    '<input class="hailie-input" type="text" placeholder="Ask me anything…" aria-label="Message Hailie">' +
    '<button class="hailie-roundbtn hailie-send" aria-label="Send">' + ICON_SEND + '</button>' +
    '</div>' +
    '<div class="hailie-note"></div>';

  function mount() {
    document.body.appendChild(launcher);
    document.body.appendChild(panel);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  var msgsEl = panel.querySelector('.hailie-msgs');
  var inputEl = panel.querySelector('.hailie-input');
  var micBtn = panel.querySelector('.hailie-mic');
  var sendBtn = panel.querySelector('.hailie-send');
  var soundBtn = panel.querySelector('.hailie-soundtoggle');
  var closeBtn = panel.querySelector('.hailie-close');
  var noteEl = panel.querySelector('.hailie-note');
  var chipsEl = panel.querySelector('.hailie-chips');

  /* ---------- Voice out (speechSynthesis) ---------- */
  var voiceOn = localStorage.getItem(VOICE_PREF_KEY) !== 'off';
  var synth = window.speechSynthesis || null;
  var hailieVoice = null;

  function pickVoice() {
    if (!synth) return;
    var voices = synth.getVoices();
    if (!voices || !voices.length) return;
    var preferred = [
      'Google US English', 'Samantha', 'Victoria', 'Karen', 'Moira',
      'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira', 'Tessa'
    ];
    for (var i = 0; i < preferred.length; i++) {
      for (var j = 0; j < voices.length; j++) {
        if (voices[j].name.indexOf(preferred[i]) === 0 && /^en/i.test(voices[j].lang)) {
          hailieVoice = voices[j];
          return;
        }
      }
    }
    for (var k = 0; k < voices.length; k++) {
      if (/^en/i.test(voices[k].lang)) { hailieVoice = voices[k]; return; }
    }
    hailieVoice = voices[0];
  }
  if (synth) {
    pickVoice();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.addEventListener('voiceschanged', pickVoice);
    }
  }

  function speak(text) {
    if (!synth || !voiceOn) return;
    synth.cancel();
    // Speakable cleanup: drop URLs and markdown-ish characters TTS reads badly
    var clean = text
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[*_#`>\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (!clean) return;
    var u = new SpeechSynthesisUtterance(clean);
    if (hailieVoice) u.voice = hailieVoice;
    u.rate = 1;
    u.pitch = 1.05;
    synth.speak(u);
  }

  function renderSoundBtn() {
    soundBtn.innerHTML = voiceOn ? ICON_SOUND_ON : ICON_SOUND_OFF;
    soundBtn.classList.toggle('muted', !voiceOn);
    soundBtn.title = voiceOn ? 'Voice replies on — click to mute' : 'Voice replies off — click to unmute';
  }
  renderSoundBtn();

  soundBtn.addEventListener('click', function () {
    voiceOn = !voiceOn;
    localStorage.setItem(VOICE_PREF_KEY, voiceOn ? 'on' : 'off');
    if (!voiceOn && synth) synth.cancel();
    renderSoundBtn();
  });

  /* ---------- Voice in (SpeechRecognition) ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  var recognition = null;
  var listening = false;

  if (SR) {
    recognition = new SR();
    recognition.lang = document.documentElement.lang || 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = function (e) {
      var interim = '';
      var final = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (interim) inputEl.value = interim;
      if (final) {
        inputEl.value = '';
        send(final.trim(), true);
      }
    };
    recognition.onstart = function () {
      listening = true;
      micBtn.classList.add('listening');
      inputEl.placeholder = 'Listening…';
      noteEl.textContent = 'Listening — go ahead, I’m all ears.';
    };
    recognition.onend = function () {
      listening = false;
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Ask me anything…';
      noteEl.textContent = '';
    };
    recognition.onerror = function (e) {
      listening = false;
      micBtn.classList.remove('listening');
      inputEl.placeholder = 'Ask me anything…';
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        noteEl.textContent = 'Microphone access is blocked — allow it in your browser to talk to me.';
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        noteEl.textContent = 'I couldn’t hear that — try again or type instead.';
      } else {
        noteEl.textContent = '';
      }
    };

    micBtn.addEventListener('click', function () {
      if (listening) {
        recognition.stop();
        return;
      }
      if (synth) synth.cancel(); // don't transcribe our own voice
      try { recognition.start(); } catch (err) { /* already started */ }
    });
  } else {
    micBtn.style.display = 'none';
    noteEl.textContent = 'Voice input isn’t supported in this browser — you can still type, and I’ll talk back.';
  }

  /* ---------- Chat ---------- */
  var history = []; // [{role, content}]
  var greeted = false;

  function addMsg(role, text) {
    var el = document.createElement('div');
    el.className = 'hailie-msg ' + (role === 'user' ? 'user' : 'bot');
    el.textContent = text;
    msgsEl.appendChild(el);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return el;
  }

  function addTyping() {
    var el = document.createElement('div');
    el.className = 'hailie-msg bot typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgsEl.appendChild(el);
    msgsEl.scrollTop = msgsEl.scrollHeight;
    return el;
  }

  function fetchReply(text) {
    var payload = { messages: history.slice(-12).concat([{ role: 'user', content: text }]) };
    return fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function (res) {
      if (!res.ok) throw new Error('bad status ' + res.status);
      return res.json();
    }).then(function (data) {
      if (!data || typeof data.reply !== 'string' || !data.reply) throw new Error('bad payload');
      return data.reply;
    });
  }

  var pending = false;
  function send(text, viaVoice) {
    if (!text || pending) return;
    pending = true;
    chipsEl.style.display = 'none';
    addMsg('user', text);
    var typing = addTyping();

    function finish(reply) {
      typing.remove();
      addMsg('bot', reply);
      history.push({ role: 'user', content: text });
      history.push({ role: 'assistant', content: reply });
      if (history.length > 24) history = history.slice(-24);
      if (viaVoice || voiceOn) speak(reply);
      pending = false;
    }

    fetchReply(text).then(finish, function () {
      finish(localAnswer(text));
    });
  }

  function submitTyped() {
    var text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = '';
    send(text, false);
  }

  sendBtn.addEventListener('click', submitTyped);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitTyped();
  });
  chipsEl.addEventListener('click', function (e) {
    var chip = e.target.closest('.hailie-chip');
    if (chip) send(chip.textContent.trim(), false);
  });

  /* ---------- Open / close ---------- */
  function openPanel() {
    launcher.style.display = 'none';
    panel.classList.add('open');
    if (!greeted) {
      greeted = true;
      addMsg('bot', GREETING);
      speak(GREETING);
    }
    inputEl.focus();
  }
  function closePanel() {
    panel.classList.remove('open');
    launcher.style.display = 'flex';
    if (synth) synth.cancel();
    if (recognition && listening) recognition.stop();
  }
  launcher.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
  });
})();
