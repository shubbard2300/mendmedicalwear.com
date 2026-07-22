# MEND Pulse — Product Detail Page: Design Brief

Companion document to `Product Detail - MEND Pulse.html`. Everything here is
written to port directly into a Next.js/Tailwind implementation.

---

## 1 · Naming

**Working name: MEND Pulse** — short, human, medically literate. Strong default.

Alternatives, in rough order of preference:

| Name | Why it works |
|---|---|
| **MEND Signal** | The product's whole promise: your body's signal, delivered to your care team. Pairs beautifully with marketing ("Never miss a signal"). |
| **MEND Vital** | Owns the clinical word ("vitals") while sounding warm. Scales to a product family: Vital BP, Vital SpO₂, Vital Scale. |
| **MEND Beacon** | Evokes watchfulness and safety at a distance — perfect for RPM. |
| **MEND Meridian** | Calm, premium, slightly Star Trek. Reads as flagship hardware. |
| **MEND Cadence** | The rhythm of the heart and of a daily routine. Gentle, musical. |
| **MEND True** | Accuracy-first positioning ("True by design"). Minimal, Apple-like. |
| **MEND Sentinel** | Strongest clinical-guardian framing; slightly more serious tone. |
| **MEND Current** | Double meaning: up-to-the-moment data + the body's flow. |
| **MEND Echo BP** | Soft, biological, memorable — check trademark distance from Amazon Echo. |

Recommendation: **Pulse** for launch; reserve **Vital** as the family name if the
ecosystem grows (Pulse, Scale, Sense…).

---

## 2 · Design tokens

```css
--white:#FBFCFE;  --mist:#F2F5F9;   --ink:#1B2430;   --slate:#5A6B7E;
--faint:#8FA0B3;  --line:#E4EAF1;   --blue:#2E6BE6;  --blue-deep:#1E4FC2;
--cyan:#3FA8E0;   --night:#0B1B2B;  --night-2:#122536;
--radius: 28 / 18 / 12px  ·  shadows: 0 24px 60px rgba(20,40,70,.10)
```

- Type: SF Pro Display / system stack. Display weight 700 at −0.03em tracking;
  body 400/17px; kickers 13px, +0.18em, uppercase, medical blue.
- Tabular numerals (`font-variant-numeric: tabular-nums`) on every reading,
  spec value, and timestamp.
- Glass: `rgba(255,255,255,.62)` + 1px `rgba(255,255,255,.55)` border +
  `backdrop-filter: blur(14px)` — used sparingly (floating spec chips, secondary
  hero button).

Tailwind port: expose the palette in `theme.extend.colors` as `mend.{white,mist,ink,slate,faint,line,blue,blueDeep,cyan,night}`.

## 3 · UX layout (section order & jobs)

1. **Nav** — persistent, blurred, hairline appears on scroll. One conversion pill.
2. **Hero** — name + one-sentence promise + device render with live reading.
   Floating glass chips carry the three hero specs (±3 mmHg, 6 months, one touch).
3. **Statement strip** — the emotional thesis ("Know how you're doing before
   symptoms appear") + condition chips (who it's for).
4. **Features** — 4 hero cards (accuracy, sync, one-touch, notifications) +
   9 compact chips. Two visual weights = clear hierarchy of 13 features.
5. **Industrial design** — dark clinical-navy section. The "Starfleet sickbay"
   moment: unibody, hidden OLED, halo button, fabric cuff.
6. **Ecosystem** — 7-node animated flow: Patient → Pulse → Bluetooth → App →
   Cloud → Dashboard → Care Team. Dashed connectors animate directionally.
7. **Benefits + Lifestyle** — left: the "no more" strikethrough list resolving
   into the one-button promise; right: the 7:02–7:06 Tuesday-morning timeline.
8. **App** — CSS phone mock (Dashboard, Today's Reading, trend sparkline,
   reminders, provider message, RPM progress) + 9 capability chips.
9. **Specs** — 15-row polished table + certification pill strip.
10. **CTA** — "Healthcare, Connected." on deep navy with blue aurora glow.
    Three actions: Get Started / Talk to Your Provider / Learn More.
11. **Footer** — quiet, regulatory-honest.

Conversion logic: emotional promise (3) → rational proof (4, 9) → desire (5) →
trust (6, certifications) → habit-fit (7) → close (10).

## 4 · Component hierarchy (Next.js)

```
app/products/mend-pulse/page.tsx
├─ <ProductNav />                      // sticky, blur, scroll hairline
├─ <Hero>
│   ├─ <HeroCopy />                    // kicker, h1, sub, CTAs, price note
│   └─ <DeviceRender>                  // replace CSS mock with <Image> renders
│       └─ <SpecFloat × 3 />           // glass chips
├─ <StatementStrip />                  // thesis + <ConditionChip × 6>
├─ <FeatureSection>
│   ├─ <FeatureCard × 4 />             // icon, title, body
│   └─ <FeatureChip × 9 />
├─ <DesignSection>                     // dark theme boundary
│   └─ <DesignCard × 4 />
├─ <EcosystemFlow>
│   ├─ <EcoNode × 7 />
│   └─ <EcoConnector × 6 />            // animated dashes; vertical on mobile
├─ <BenefitsSection>
│   ├─ <NoMoreList />                  // strikethrough items
│   └─ <MorningTimeline />             // step rows + closing banner
├─ <AppSection>
│   ├─ <PhoneMock />                   // later: real app screenshots
│   └─ <AppChip × 9 />
├─ <SpecTable rows={15} />             // definition-list markup for a11y
├─ <CertStrip />
├─ <FinalCTA />
└─ <SiteFooter />
```

State: none required beyond an `useInView` reveal hook and the nav scroll flag.
All content props are typed objects — the page is fully CMS-able.

## 5 · Suggested animations

| Where | Motion | Spec |
|---|---|---|
| Device render | Idle float | translateY 0→−14px, ±0.4° rotate, 7s ease-in-out loop |
| Halo button | Breathing ring | scale .86→1.22 + fade, 2.6s loop; switches to steady ring on "synced" |
| Heart-rate dot | Pulse | scale 1→1.5, 1s loop |
| OLED reading | Live variance | numbers drift ±2 every 8s (skipped under reduced-motion) |
| Ecosystem connectors | Directional flow | stroke-dashoffset loop, 1.4s linear |
| All sections | Reveal on scroll | opacity+28px rise, 0.8s cubic-bezier(.2,.6,.2,1), 80ms stagger |
| Nav | Hairline + blur | border fades in past 8px scroll |
| Cards/chips | Hover lift | −4…−6px translate + soft shadow, 250–300ms |
| Final CTA | Aurora glow | static radial blur; optionally 30s hue drift |

Principles: nothing loops faster than a resting heartbeat; hovers stay under
300ms; **all** motion is gated behind `prefers-reduced-motion` (already
implemented); reveals fire once, never re-trigger.

## 6 · Responsive guidance

- Breakpoints: 1140 (content max), 900 (hero + app grids stack), 880
  (benefits stack), 760 (nav collapses to logo + pill), 640 (spec rows stack
  label-over-value), 520 (hide floating glass chips).
- Hero: device render moves *below* copy on stack; keep it ≥ 280px wide.
- Ecosystem: horizontal flow becomes a vertical rail on <900px (connectors
  rotate 90°) — the top-to-bottom order matches the data journey.
- Type scales via `clamp()` — h1 46→76px, h2 30→46px; body stays 17px.
- Touch targets ≥ 44px; chips wrap, never truncate.
- Spec table: single-column definition pairs on mobile; keep row hover off touch.
- Test matrix: 375 (SE), 390, 768, 1024, 1280, 1536.

## 7 · Image generation prompts (photorealistic renders)

1. **Hero on white** — "Photorealistic product photograph of a premium wireless
   upper-arm blood pressure monitor, seamless ceramic-white unibody with satin
   graphite accents, hidden OLED display glowing softly beneath smoked glass
   showing '118/76', woven light-grey fabric cuff with magnetic closure, no
   visible screws or seams, centered on an infinite pure-white studio
   background, soft top-diffused lighting, subtle contact shadow, shot on
   Phase One 150MP, 100mm lens, f/11, product photography for an Apple-style
   landing page, 8k."
2. **45° beauty shot** — "Three-quarter 45-degree studio photograph of the same
   ceramic-white blood pressure monitor, dramatic soft key light from upper
   left revealing the sculptural curvature of the unibody, satin graphite
   accent ring around a capacitive touch button with a faint cyan LED halo,
   smoked-glass display off, deep depth of field, light grey seamless
   backdrop, floating dust-free minimalism, premium medical device
   aesthetic, 8k."
3. **Floating render** — "Product levitating at a slight dynamic angle against
   a soft gradient background (pale blue #E6EFF9 to white), gentle ambient
   occlusion beneath, fabric cuff unfurled elegantly like a ribbon, OLED
   displaying a heartbeat waveform in white, rim lighting tracing the
   silhouette, hyper-real CGI render, octane, 8k."
4. **Exploded view** — "Technical exploded-axonometric render of a premium
   blood pressure monitor: smoked glass panel, OLED module, precision-machined
   aluminum chassis, quiet micro-pump, Li-ion cell, USB-C board, woven cuff
   with magnetic spine — components floating in perfect vertical alignment on
   a pale grey background, thin annotation hairlines, industrial design
   portfolio style, studio lighting, 8k."
5. **USB-C charging** — "Macro photograph of a braided white USB-C cable
   connecting into the seamless port of the ceramic-white monitor, faint amber
   charge halo around the capacitive button, shallow depth of field, warm
   morning light across a pale oak nightstand, 8k."
6. **OLED close-up** — "Extreme macro of the smoked-glass display: crisp white
   OLED digits '118 / 76' and a small pulsing heart icon at 62 bpm floating in
   deep black glass, micro-reflections of a soft window, glass edge catching
   a thin line of cyan light, 100mm macro, f/2.8, 8k."
7. **At home** — "Lifestyle photograph, a woman in her 40s seated at a bright
   Scandinavian kitchen table taking her blood pressure with the sleek white
   monitor on her upper arm, relaxed posture, morning coffee and a phone
   showing a clean blue health app on the table, natural window light,
   editorial calm, 35mm, f/2.0, 8k."
8. **Older adult** — "Warm lifestyle photograph of a silver-haired man in his
   70s in a cardigan, comfortably reading the large white digits on the
   monitor's display, seated in a sunlit living-room armchair, reassured
   slight smile, soft golden-hour light, shallow depth of field, dignified and
   independent mood, 8k."
9. **Young professional** — "Candid morning photograph of a professional in
   her early 30s in business attire taking a one-button blood pressure reading
   at a minimalist entryway shelf before leaving for work, keys and laptop bag
   nearby, phone in other hand showing the reading syncing, cool daylight,
   motion-in-stillness energy, 8k."
10. **Ecosystem tableau** — "Wide hero image of the connected-care ecosystem:
    the white monitor in the foreground, a smartphone showing a blue health
    dashboard, and a softly blurred clinician at a monitor in the background
    reviewing the same data; a thin luminous cyan thread of light arcs from
    device to phone to screen symbolizing secure data flow, dark clinical-navy
    environment with glass surfaces, cinematic Star-Trek-medical mood, 8k."

## 8 · Implementation notes

- The shipped HTML is dependency-free and CSP-safe; the device and phone are
  CSS constructions — swap for renders (prompts above) without layout change.
- Section backgrounds alternate white / mist / navy to create rhythm; keep the
  navy sections to exactly two (Design, CTA) so they stay special.
- Accessibility: device + phone mocks carry `role="img"` labels; icons are
  decorative (`aria-hidden` via empty text); color contrast ≥ 4.5:1 throughout;
  focus states inherit browser defaults intentionally — style with
  `:focus-visible` ring in `--blue` when porting.
- Regulatory honesty: footer marks the page as concept; remove once actual
  510(k) clearance exists.
