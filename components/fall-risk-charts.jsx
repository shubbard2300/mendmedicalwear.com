import React, { useEffect, useMemo, useState } from 'react';

/**
 * Chart layer for the Fall Risk Check.
 *
 * Palette note: MEND's sage accent (#7C8B7A) clears the 3:1 mark threshold on the
 * panel surface (3.11:1) so it carries the single-series country chart — one hue for
 * every bar, never a value ramp, because bar length already encodes the value.
 *
 * It cannot carry the four-way contribution chart: its chroma (OKLCH C ≈ 0.04) is far
 * under the 0.10 categorical floor, so it reads as gray and stops doing identity work.
 * That chart uses a brand-adjacent set validated with the dataviz validator against
 * the #F1EEE7 panel — teal / clay / slate / gold, worst adjacent CVD ΔE 9.1 (≥8
 * target) and normal-vision ΔE 22.5 (≥15 floor). Gold sits at 2.63:1, under the 3:1
 * mark floor, so the relief rule applies: in-segment values where they fit, a legend
 * carrying every value, and a table view. Do not re-order or re-step these by eye —
 * re-run the validator.
 */

export const SECTION_COLORS = {
  steadi: '#0E8F6E',
  medications: '#C4622E',
  withdrawal: '#3E6EA8',
  environment: '#C08A1E'
};

// Gold is light enough that white text on it fails; ink is the correct pick there.
const INK_ON = { '#C08A1E': true };

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** Counts from 0 to `target`, or lands on it instantly when motion is reduced. */
export function useCountUp(target, duration = 750) {
  const reduced = usePrefersReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) { setValue(target); return; }
    let raf, start;
    const tick = now => {
      if (start === undefined) start = now;
      const t = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast out of the gate, settles rather than stops dead.
      setValue(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, reduced]);
  return value;
}

/* ── Hero meter ─────────────────────────────────────────────────────────────
   A meter, not a bar chart: one ratio against a limit. The fill carries severity
   and the track is the same ramp a step lighter, so state reads across the whole
   arc. Proportional figures — tabular-nums makes a display-size number look loose. */
export function ScoreMeter({ score, max, tone, bandLabel }) {
  const shown = useCountUp(score);
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const pct = Math.min(shown / max, 1);

  return (
    <div className="fr-meter">
      <svg className="fr-meter-svg" viewBox="0 0 140 140" role="img"
           aria-label={`Score ${score} out of ${max}. ${bandLabel}.`}>
        <circle cx="70" cy="70" r={r} className="fr-meter-track" />
        <circle
          cx="70" cy="70" r={r}
          className={`fr-meter-fill fr-tone-${tone}`}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - pct)}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="fr-meter-figure" aria-hidden="true">
        <span className="fr-meter-num">{Math.round(shown)}</span>
        <span className="fr-meter-den">of {max}</span>
      </div>
    </div>
  );
}

/* ── Contribution: part-to-whole, horizontal stacked bar ────────────────────
   Horizontal because the category names are long. Legend always present (four
   series), every value visible in the legend, and in-segment only where it fits. */
export function ContributionChart({ sections, total }) {
  const [active, setActive] = useState(null);
  const scored = sections.filter(s => s.score > 0);

  if (!total) {
    return (
      <p className="fr-note">
        Nothing scored, so there is no breakdown to draw. That is the good outcome.
      </p>
    );
  }

  return (
    <div className="fr-contrib">
      <div className="fr-contrib-bar" role="img"
           aria-label={
             'Score contribution: ' +
             scored.map(s => `${s.title} ${s.score} of ${total}`).join(', ')
           }>
        {scored.map(s => {
          const share = s.score / total;
          const color = SECTION_COLORS[s.id];
          // Only label inside the mark when the text genuinely fits — a clipped
          // label is worse than none. The value stays in the legend and table.
          const fits = share >= 0.18;
          return (
            <button
              type="button"
              key={s.id}
              className={`fr-contrib-seg${active === s.id ? ' is-active' : ''}`}
              style={{ flexGrow: s.score, background: color }}
              onMouseEnter={() => setActive(s.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(s.id)}
              onBlur={() => setActive(null)}
              aria-label={`${s.title}: ${s.score} of ${total} points`}
            >
              {fits && (
                <span className="fr-contrib-inline"
                      style={{ color: INK_ON[color] ? '#2B2B28' : '#fff' }}>
                  {s.score}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <ul className="fr-legend">
        {sections.map(s => (
          <li key={s.id}
              className={`fr-legend-item${active === s.id ? ' is-active' : ''}${s.score ? '' : ' is-zero'}`}>
            <span className="fr-legend-key" style={{ background: SECTION_COLORS[s.id] }} aria-hidden="true" />
            <span className="fr-legend-label">{s.title}</span>
            <span className="fr-legend-val">{s.score} / {s.max}</span>
          </li>
        ))}
      </ul>

      <p className="fr-contrib-read" aria-live="polite">
        {active
          ? (() => {
              const s = sections.find(x => x.id === active);
              return s.drivers.length
                ? `${s.title}: ${s.drivers.join(', ')}.`
                : `${s.title}: nothing flagged.`;
            })()
          : 'Hover or focus a band to see what is behind it.'}
      </p>
    </div>
  );
}

/* ── Country chart: magnitude across nominal categories ─────────────────────
   One series, so one hue for every bar and no legend box — the heading names what
   is plotted. Bars are absolutely positioned by rank so a filter change slides them
   to their new places instead of repainting; colour follows nothing but the series,
   never the rank. Filters sit in one row above the plot, and during a refetch the
   previous render is held at reduced opacity rather than flashing a skeleton. */

const ROW_H = 34;
const MEDIAN_GUTTER = 22;   // room under the plot for the median rule's label

export function CountryChart({
  data, state, error, topN,
  sex, region, onSexChange, onRegionChange, regions
}) {
  const [active, setActive] = useState(null);
  const [asTable, setAsTable] = useState(false);
  const reduced = usePrefersReducedMotion();

  const rows = data ? data.topCountries : [];
  const max = useMemo(
    () => Math.max(...rows.map(c => c.rate), data ? data.globalMedian : 0, 1),
    [rows, data]
  );

  const controls = (
    <div className="fr-filters">
      <label className="fr-filter">
        <span>Compare</span>
        <select value={sex} onChange={e => onSexChange(e.target.value)}>
          <option value="all">All adults</option>
          <option value="female">Women</option>
          <option value="male">Men</option>
        </select>
      </label>
      <label className="fr-filter">
        <span>Region</span>
        <select value={region} onChange={e => onRegionChange(e.target.value)}>
          <option value="">Worldwide</option>
          {regions.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <button type="button" className="fr-btn-link"
              onClick={() => setAsTable(t => !t)}
              aria-pressed={asTable}>
        {asTable ? 'Show chart' : 'Show table'}
      </button>
    </div>
  );

  if (error) {
    return (
      <>
        {controls}
        <p className="fr-note fr-note-quiet">
          The global comparison is unavailable right now — {error}. Your score above is
          unaffected; it was worked out in your browser.
        </p>
      </>
    );
  }

  if (!data) {
    return (
      <>
        {controls}
        <p className="fr-note fr-note-quiet">Loading WHO mortality data…</p>
      </>
    );
  }

  const sexLabel = { all: 'all adults', male: 'men', female: 'women' }[data.sex];
  const medianPct = data.globalMedian / max;

  return (
    <>
      {controls}

      <p className="fr-note">
        Age-standardised fall death rate among <strong>{sexLabel}</strong>
        {data.region ? <> in <strong>{data.region}</strong></> : null}, highest {topN} of{' '}
        {data.countriesRanked} WHO member states. This is population data — where falls
        carry the heaviest burden, not your own odds in any of these places.
      </p>

      {asTable ? (
        <table className="fr-table">
          <caption className="fr-sr">
            Fall deaths per 100,000 population per year, age-standardised
          </caption>
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Country</th>
              <th scope="col">WHO region</th>
              <th scope="col">Rate</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.iso3}>
                <td>{i + 1}</td>
                <th scope="row">{c.name}</th>
                <td>{c.region}</td>
                <td className="fr-num">{c.rate.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={`fr-plot${state === 'loading' ? ' is-stale' : ''}`}
             style={{ height: rows.length * ROW_H + MEDIAN_GUTTER }}>
          <div className={`fr-plot-median${medianPct > 0.72 ? ' is-right' : ''}`}
               style={{ '--pct': medianPct }} aria-hidden="true">
            <span className="fr-plot-median-label">
              global median {data.globalMedian}
            </span>
          </div>

          {rows.map((c, i) => {
            const pct = c.rate / max;
            return (
              <button
                type="button"
                key={c.iso3}
                className={`fr-row${active === c.iso3 ? ' is-active' : ''}`}
                style={{
                  transform: `translateY(${i * ROW_H}px)`,
                  transition: reduced ? 'none' : undefined
                }}
                onMouseEnter={() => setActive(c.iso3)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(c.iso3)}
                onBlur={() => setActive(null)}
                aria-label={`${i + 1}. ${c.name}, ${c.region}: ${c.rate.toFixed(1)} deaths per 100,000`}
              >
                <span className="fr-row-rank" aria-hidden="true">{i + 1}</span>
                <span className="fr-row-name">{c.name}</span>
                <span className="fr-row-track" aria-hidden="true">
                  <span className="fr-row-bar"
                        style={{ width: `${pct * 100}%`, transition: reduced ? 'none' : undefined }} />
                </span>
                <span className="fr-row-val" aria-hidden="true">{c.rate.toFixed(1)}</span>
              </button>
            );
          })}

          {active && (() => {
            const i = rows.findIndex(c => c.iso3 === active);
            const c = rows[i];
            if (!c) return null;
            const ratio = data.globalMedian ? c.rate / data.globalMedian : null;
            return (
              <div className="fr-tip" style={{ transform: `translateY(${i * ROW_H}px)` }} role="status">
                <span className="fr-tip-val">{c.rate.toFixed(1)}</span>
                <span className="fr-tip-unit">deaths per 100,000 · age-standardised</span>
                <span className="fr-tip-meta">
                  {c.name} · {c.region}
                  {ratio ? ` · ${ratio.toFixed(1)}× the global median` : ''}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      <p className="fr-axis-note">Deaths per 100,000 people per year, age-standardised.</p>
    </>
  );
}
