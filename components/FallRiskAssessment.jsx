import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AGE_BANDS,
  REGIONS,
  RISK_BANDS,
  SECTIONS,
  SEX_OPTIONS,
  STEADI_THRESHOLD,
  isComplete,
  scoreAssessment
} from './fall-risk-model.js';

/**
 * MEND Fall Risk Check.
 *
 * Answers live in component state and are never transmitted. The only thing that
 * leaves the browser is the sex and region used to query the global panel, and
 * those go to our own endpoint, which forwards nothing.
 *
 * Props:
 *   apiPath     — endpoint for the WHO panel (default '/api/fall-risk-regions')
 *   topN        — how many countries and regions to show (default 5)
 *   headingTag  — level for the component title; 'h1' when it owns the page,
 *                 'h2' when embedded below one (default 'h1')
 *   onComplete  — called with the score object when results are first shown
 */

const STEPS = ['about', ...SECTIONS.map(s => s.id), 'results'];

function bandTone(bandId) {
  return { lower: 'ok', increased: 'watch', high: 'high', veryhigh: 'urgent' }[bandId] || 'ok';
}

function ScoreDial({ score, max, tone }) {
  const pct = Math.min(score / max, 1);
  const r = 52;
  const circumference = 2 * Math.PI * r;
  return (
    <svg className="fr-dial" viewBox="0 0 130 130" role="img"
         aria-label={`Score ${score} out of ${max}`}>
      <circle cx="65" cy="65" r={r} className="fr-dial-track" />
      <circle
        cx="65" cy="65" r={r}
        className={`fr-dial-value fr-tone-${tone}`}
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={circumference * (1 - pct)}
        transform="rotate(-90 65 65)"
      />
      <text x="65" y="62" className="fr-dial-num">{score}</text>
      <text x="65" y="82" className="fr-dial-den">of {max}</text>
    </svg>
  );
}

function GlobalPanel({ data, state, error, topN }) {
  if (error) {
    return (
      <p className="fr-note fr-note-quiet">
        The global comparison is unavailable right now — {error}. Your score above is
        unaffected; it was calculated in your browser.
      </p>
    );
  }
  if (state !== 'ready' || !data) {
    return <p className="fr-note fr-note-quiet">Loading WHO mortality data…</p>;
  }

  const maxRate = Math.max(...data.topCountries.map(c => c.rate), 1);
  const sexLabel = { all: 'all adults', male: 'men', female: 'women' }[data.sex] || 'all adults';

  return (
    <div className="fr-global">
      <h3 className="fr-h3">Where falls are deadliest, worldwide</h3>
      <p className="fr-note">
        The {topN} countries with the highest age-standardised fall death rate among{' '}
        <strong>{sexLabel}</strong>
        {data.region ? <> within <strong>{data.region}</strong></> : null}, from the WHO
        Global Health Observatory. This is population data — it describes where falls carry
        the heaviest burden, not your own odds in any of these places.
      </p>

      <ol className="fr-bars">
        {data.topCountries.map((c, i) => (
          <li key={c.iso3} className="fr-bar-row">
            <span className="fr-bar-rank">{i + 1}</span>
            <span className="fr-bar-name">{c.name}</span>
            <span className="fr-bar-track">
              <span className="fr-bar-fill" style={{ width: `${(c.rate / maxRate) * 100}%` }} />
            </span>
            <span className="fr-bar-val">{c.rate.toFixed(1)}</span>
          </li>
        ))}
      </ol>
      <p className="fr-bar-unit">Deaths per 100,000 people per year, age-standardised.</p>

      <h4 className="fr-h4">By WHO region</h4>
      <div className="fr-table-wrap">
      <table className="fr-table">
        <thead>
          <tr>
            <th scope="col">Region</th>
            <th scope="col">Median rate</th>
            <th scope="col">Highest member state</th>
          </tr>
        </thead>
        <tbody>
          {data.topRegions.map(r => (
            <tr key={r.region}>
              <th scope="row">{r.region}</th>
              <td>{r.medianRate.toFixed(1)}</td>
              <td>{r.highest.name} <span className="fr-muted">({r.highest.rate.toFixed(1)})</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <p className="fr-source">
        Source: {data.source}, indicator {data.indicator} — {data.indicatorName}, {data.dataYear}.
        Ranked across {data.countriesRanked} member states; global median {data.globalMedian}.
        {data.live
          ? ' Queried live.'
          : ` Served from our cached copy taken ${data.snapshotRetrieved} — the WHO API did not respond.`}
        {' '}States with populations under about 300,000 are excluded, because a rate over
        so small a population turns on a handful of deaths.
      </p>
    </div>
  );
}

export default function FallRiskAssessment({
  apiPath = '/api/fall-risk-regions',
  topN = 5,
  headingTag: Heading = 'h1',
  onComplete
}) {
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('all');
  const [region, setRegion] = useState('');
  const [answers, setAnswers] = useState({});
  const [global, setGlobal] = useState({ state: 'idle', data: null, error: null });
  const resultsRef = useRef(null);
  const announcedRef = useRef(false);

  const stepId = STEPS[step];
  const onResults = stepId === 'results';
  const result = useMemo(() => scoreAssessment({ age, sex, answers }), [age, sex, answers]);
  const canAdvance = stepId !== 'about' || isComplete({ age });

  const toggle = useCallback(id => {
    setAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const restart = useCallback(() => {
    setStep(0);
    setAnswers({});
    setAge('');
    setSex('all');
    setRegion('');
    announcedRef.current = false;
  }, []);

  // Fetch the WHO panel only once the person reaches the results step, so nobody
  // who abandons the form halfway triggers a request at all.
  useEffect(() => {
    if (!onResults) return;
    let cancelled = false;
    setGlobal(g => ({ ...g, state: 'loading', error: null }));

    const params = new URLSearchParams({ sex, limit: String(topN) });
    if (region) params.set('region', region);

    fetch(`${apiPath}?${params}`, { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error(`the data service returned ${res.status}`);
        return res.json();
      })
      .then(data => { if (!cancelled) setGlobal({ state: 'ready', data, error: null }); })
      .catch(err => { if (!cancelled) setGlobal({ state: 'error', data: null, error: err.message }); });

    return () => { cancelled = true; };
  }, [onResults, apiPath, sex, region, topN]);

  useEffect(() => {
    if (onResults && resultsRef.current) {
      resultsRef.current.focus({ preventScroll: true });
      if (!announcedRef.current) {
        announcedRef.current = true;
        if (typeof onComplete === 'function') onComplete(result);
      }
    }
  }, [onResults, onComplete, result]);

  const tone = result.band ? bandTone(result.band.id) : 'ok';
  const hasWithdrawalFlag = result.criticalFlags.includes('w1');

  return (
    <section className="fr" aria-labelledby="fr-title">
      <div className="fr-head">
        <p className="fr-eyebrow">MEND Fall Risk Check</p>
        <Heading className="fr-title" id="fr-title">How likely is a fall — and what would change it?</Heading>
        <p className="fr-lede">
          Twelve questions from the CDC’s STEADI screener, plus a look at medications,
          withdrawal, and your home. It takes about three minutes. Nothing you answer
          leaves this page.
        </p>
      </div>

      <ol className="fr-progress" aria-label="Progress">
        {STEPS.map((id, i) => (
          <li key={id}
              className={`fr-progress-dot${i === step ? ' is-current' : ''}${i < step ? ' is-done' : ''}`}
              aria-current={i === step ? 'step' : undefined}>
            <span className="fr-sr">Step {i + 1} of {STEPS.length}</span>
          </li>
        ))}
      </ol>

      {stepId === 'about' && (
        <div className="fr-step">
          <h3 className="fr-h3">About you</h3>
          <fieldset className="fr-field">
            <legend>Your age <span className="fr-req">required</span></legend>
            <div className="fr-chips">
              {AGE_BANDS.map(b => (
                <label key={b.value} className={`fr-chip${age === b.value ? ' is-on' : ''}`}>
                  <input type="radio" name="fr-age" value={b.value}
                         checked={age === b.value}
                         onChange={() => setAge(b.value)} />
                  {b.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="fr-field">
            <legend>Sex</legend>
            <p className="fr-hint">
              Fall mortality differs enough between men and women that the WHO publishes
              them separately, so this changes the global comparison at the end.
            </p>
            <div className="fr-chips">
              {SEX_OPTIONS.map(o => (
                <label key={o.value} className={`fr-chip${sex === o.value ? ' is-on' : ''}`}>
                  <input type="radio" name="fr-sex" value={o.value}
                         checked={sex === o.value}
                         onChange={() => setSex(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="fr-field">
            <label className="fr-label" htmlFor="fr-region">Your region (optional)</label>
            <p className="fr-hint">Narrows the global comparison to your part of the world.</p>
            <select id="fr-region" className="fr-select" value={region}
                    onChange={e => setRegion(e.target.value)}>
              <option value="">Compare worldwide</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {SECTIONS.map(section => section.id === stepId && (
        <div className="fr-step" key={section.id}>
          <h3 className="fr-h3">{section.title}</h3>
          <p className="fr-hint">{section.note}</p>
          <ul className="fr-questions">
            {section.questions.map(q => (
              <li key={q.id}>
                <label className={`fr-q${answers[q.id] ? ' is-on' : ''}`}>
                  <input type="checkbox" checked={Boolean(answers[q.id])}
                         onChange={() => toggle(q.id)} />
                  <span className="fr-q-box" aria-hidden="true" />
                  <span className="fr-q-text">{q.text}</span>
                </label>
              </li>
            ))}
          </ul>
          <p className="fr-note fr-note-quiet">Leave anything that does not apply unchecked.</p>
        </div>
      ))}

      {onResults && (
        <div className="fr-step fr-results" ref={resultsRef} tabIndex={-1}>
          {hasWithdrawalFlag && (
            <div className="fr-alert" role="alert">
              <h3 className="fr-alert-title">Please do not detox alone</h3>
              <p>
                You told us you are withdrawing from alcohol or sedatives. Beyond the
                unsteadiness that brought you to this page, withdrawal from either can
                cause seizures and delirium, and it can be fatal without medical
                supervision. Falls are the smaller of the two risks here.
              </p>
              <p>
                Please speak to a doctor before going further. In the US, the SAMHSA
                National Helpline is free, confidential, and staffed around the clock at{' '}
                <a href="tel:18006624357">1-800-662-4357</a>. If you are shaking badly,
                seeing things, or feeling confused, treat that as an emergency.
              </p>
            </div>
          )}

          <div className="fr-verdict">
            <ScoreDial score={result.totalScore} max={result.maxScore} tone={tone} />
            <div className="fr-verdict-body" aria-live="polite">
              <p className={`fr-band fr-tone-${tone}`}>{result.band.label}</p>
              <p className="fr-verdict-summary">{result.band.summary}</p>
              <p className="fr-verdict-meta">
                {result.meetsSteadiThreshold
                  ? `Your STEADI-equivalent score is at or above ${STEADI_THRESHOLD}, the published screening threshold.`
                  : `Below the STEADI screening threshold of ${STEADI_THRESHOLD}.`}
                {result.ageBand
                  ? ` Age band ${result.ageBand.label}, which carries about ${result.ageBand.multiplier}× the fall-mortality rate of a 65-to-69-year-old.`
                  : ''}
              </p>
            </div>
          </div>

          <div className="fr-cols">
            <div>
              <h3 className="fr-h3">What is driving this</h3>
              {result.topDrivers.length ? (
                <ul className="fr-drivers">
                  {result.topDrivers.map(d => <li key={d}>{d}</li>)}
                </ul>
              ) : (
                <p className="fr-note">You did not flag any individual risk factors.</p>
              )}
              <table className="fr-table fr-table-compact">
                <tbody>
                  {result.sections.map(s => (
                    <tr key={s.id}>
                      <th scope="row">{s.title}</th>
                      <td>{s.score} / {s.max}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="fr-h3">What to do next</h3>
              <p className="fr-advice">{result.band.advice}</p>
              <p className="fr-note fr-note-quiet">
                Medication is worth singling out. Sedatives, opioids, and blood pressure
                medicines are among the few fall risks that can be reduced this month
                rather than over a year of training — but only with the prescriber who
                started them. Do not stop anything on the strength of a web page.
              </p>
            </div>
          </div>

          <GlobalPanel data={global.data} state={global.state} error={global.error} topN={topN} />

          <p className="fr-disclaimer">
            <strong>This is not a diagnosis.</strong> The MEND Fall Risk Check is an
            educational screener built on the CDC STEADI questionnaire and published WHO
            mortality statistics. It cannot see your medical record, examine your gait, or
            know your history, and no score here rules a fall in or out. Talk to a doctor,
            nurse, or pharmacist about anything that concerns you.
          </p>
        </div>
      )}

      <div className="fr-nav">
        <button type="button" className="fr-btn fr-btn-ghost"
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}>
          Back
        </button>
        <span className="fr-nav-count">Step {step + 1} of {STEPS.length}</span>
        {onResults ? (
          <button type="button" className="fr-btn fr-btn-primary" onClick={restart}>
            Start over
          </button>
        ) : (
          <button type="button" className="fr-btn fr-btn-primary"
                  onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
                  disabled={!canAdvance}>
            {STEPS[step + 1] === 'results' ? 'See my results' : 'Continue'}
          </button>
        )}
      </div>
      {!canAdvance && (
        <p className="fr-note fr-note-quiet" role="status">Choose an age band to continue.</p>
      )}
    </section>
  );
}
