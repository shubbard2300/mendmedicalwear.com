import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AGE_BANDS,
  REGIONS,
  SECTIONS,
  SEX_OPTIONS,
  STEADI_THRESHOLD,
  answeredCount,
  completion,
  isComplete,
  scoreAssessment
} from './fall-risk-model.js';
import {
  ContributionChart,
  CountryChart,
  ScoreMeter,
  usePrefersReducedMotion
} from './fall-risk-charts.jsx';

/**
 * MEND Fall Risk Check.
 *
 * Questions arrive one at a time: answering reveals the next, and answering the last
 * in a block moves to the next block on its own. Everything already answered stays on
 * screen and stays changeable, so the reveal is disclosure, not a wizard that traps you.
 *
 * Answers live in component state and are never transmitted. The only thing that
 * leaves the browser is the sex and region used to query the global panel, and those
 * go to our own endpoint, which stores nothing.
 *
 * Props:
 *   apiPath     — endpoint for the WHO panel (default '/api/fall-risk-regions')
 *   topN        — how many countries to chart (default 5)
 *   headingTag  — level for the component title; 'h1' when it owns the page,
 *                 'h2' when embedded below one (default 'h1')
 *   onComplete  — called with the score object when results are first shown
 */

const STEPS = ['about', ...SECTIONS.map(s => s.id), 'results'];
const ADVANCE_MS = 520;

function bandTone(bandId) {
  return { lower: 'ok', increased: 'watch', high: 'high', veryhigh: 'urgent' }[bandId] || 'ok';
}

function Question({ question, value, onAnswer, isNew }) {
  return (
    <li className={`fr-q${isNew ? ' is-new' : ''}${value !== undefined ? ' is-answered' : ''}`}>
      <p className="fr-q-text" id={`q-${question.id}`}>{question.text}</p>
      <div className="fr-yn" role="group" aria-labelledby={`q-${question.id}`}>
        <button type="button"
                className={`fr-yn-btn${value === true ? ' is-on' : ''}`}
                aria-pressed={value === true}
                onClick={() => onAnswer(question.id, true)}>Yes</button>
        <button type="button"
                className={`fr-yn-btn${value === false ? ' is-on' : ''}`}
                aria-pressed={value === false}
                onClick={() => onAnswer(question.id, false)}>No</button>
      </div>
    </li>
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
  const [newest, setNewest] = useState(null);

  // The chart's own filters start from the answers but are then independent, so
  // someone can compare across groups without their score shifting underneath them.
  const [chartSex, setChartSex] = useState('all');
  const [chartRegion, setChartRegion] = useState('');

  const [global, setGlobal] = useState({ state: 'idle', data: null, error: null });
  const resultsRef = useRef(null);
  const announcedRef = useRef(false);
  const advanceRef = useRef(null);
  const reduced = usePrefersReducedMotion();

  const stepId = STEPS[step];
  const onResults = stepId === 'results';
  const section = SECTIONS.find(s => s.id === stepId) || null;
  const result = useMemo(() => scoreAssessment({ age, sex, answers }), [age, sex, answers]);
  const progress = completion(answers);

  const answer = useCallback((id, value) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
    setNewest(id);
  }, []);

  const goNext = useCallback(() => setStep(s => Math.min(STEPS.length - 1, s + 1)), []);

  // Answering the final question in a block advances on its own, after a beat long
  // enough to see the answer register. Any further interaction cancels it.
  useEffect(() => {
    if (!section) return undefined;
    const done = answeredCount(section, answers) === section.questions.length;
    if (!done) return undefined;
    advanceRef.current = setTimeout(goNext, reduced ? 0 : ADVANCE_MS);
    return () => clearTimeout(advanceRef.current);
  }, [section, answers, goNext, reduced]);

  const restart = useCallback(() => {
    clearTimeout(advanceRef.current);
    setStep(0); setAnswers({}); setAge(''); setSex('all'); setRegion('');
    setChartSex('all'); setChartRegion(''); setNewest(null);
    announcedRef.current = false;
  }, []);

  // Seed the chart filters from the person's own answers the first time results show.
  useEffect(() => {
    if (!onResults || announcedRef.current) return;
    setChartSex(sex);
    setChartRegion(region);
  }, [onResults, sex, region]);

  // Fetch only once results are reached, so abandoning the form costs no request.
  useEffect(() => {
    if (!onResults) return undefined;
    let cancelled = false;
    setGlobal(g => ({ ...g, state: 'loading', error: null }));

    const params = new URLSearchParams({ sex: chartSex, limit: String(topN) });
    if (chartRegion) params.set('region', chartRegion);

    fetch(`${apiPath}?${params}`, { headers: { Accept: 'application/json' } })
      .then(res => {
        if (!res.ok) throw new Error(`the data service returned ${res.status}`);
        return res.json();
      })
      .then(data => { if (!cancelled) setGlobal({ state: 'ready', data, error: null }); })
      .catch(err => {
        if (!cancelled) setGlobal(g => ({ state: 'error', data: g.data, error: err.message }));
      });

    return () => { cancelled = true; };
  }, [onResults, apiPath, chartSex, chartRegion, topN]);

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
  const revealed = section ? Math.min(answeredCount(section, answers) + 1, section.questions.length) : 0;
  const canAdvance = stepId !== 'about' || isComplete({ age });

  return (
    <section className="fr" aria-labelledby="fr-title">
      <div className="fr-head">
        <p className="fr-eyebrow">MEND Fall Risk Check</p>
        <Heading className="fr-title" id="fr-title">How likely is a fall — and what would change it?</Heading>
        <p className="fr-lede">
          Questions from the CDC’s STEADI screener, plus a look at medications,
          withdrawal, and your home — one at a time, about three minutes. Nothing you
          answer leaves this page.
        </p>
      </div>

      <div className="fr-progress" role="progressbar"
           aria-valuemin={0} aria-valuemax={100}
           aria-valuenow={Math.round(progress * 100)}
           aria-label="Questions answered">
        <span className="fr-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>

      {stepId === 'about' && (
        <div className="fr-step">
          <h3 className="fr-h3">About you</h3>
          <fieldset className="fr-field">
            <legend>Your age <span className="fr-req">required</span></legend>
            <div className="fr-chips">
              {AGE_BANDS.map(b => (
                <label key={b.value} className={`fr-chip${age === b.value ? ' is-on' : ''}`}>
                  <input type="radio" name="fr-age" value={b.value}
                         checked={age === b.value} onChange={() => setAge(b.value)} />
                  {b.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className={`fr-field${age ? ' is-new' : ''}`} disabled={!age}>
            <legend>Sex</legend>
            <p className="fr-hint">
              Fall mortality differs enough between men and women that the WHO publishes
              them separately, so this changes the comparison at the end.
            </p>
            <div className="fr-chips">
              {SEX_OPTIONS.map(o => (
                <label key={o.value} className={`fr-chip${sex === o.value ? ' is-on' : ''}`}>
                  <input type="radio" name="fr-sex" value={o.value}
                         checked={sex === o.value} onChange={() => setSex(o.value)} />
                  {o.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className={`fr-field${age ? ' is-new' : ''}`}>
            <label className="fr-label" htmlFor="fr-region">Your region (optional)</label>
            <select id="fr-region" className="fr-select" value={region}
                    disabled={!age}
                    onChange={e => setRegion(e.target.value)}>
              <option value="">Compare worldwide</option>
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {section && (
        <div className="fr-step" key={section.id}>
          <h3 className="fr-h3">{section.title}</h3>
          <p className="fr-hint">{section.note}</p>
          <ol className="fr-questions">
            {section.questions.slice(0, revealed).map(q => (
              <Question key={q.id} question={q} value={answers[q.id]}
                        onAnswer={answer} isNew={newest === q.id || revealed === 1} />
            ))}
          </ol>
          <p className="fr-step-count" aria-live="polite">
            {answeredCount(section, answers)} of {section.questions.length} answered
          </p>
        </div>
      )}

      {onResults && (
        <div className="fr-step fr-results" ref={resultsRef} tabIndex={-1}>
          {hasWithdrawalFlag && (
            <div className="fr-alert" role="alert">
              <h3 className="fr-alert-title">Please do not detox alone</h3>
              <p>
                You told us you are withdrawing from alcohol or sedatives. Beyond the
                unsteadiness that brought you here, withdrawal from either can cause
                seizures and delirium, and it can be fatal without medical supervision.
                Falls are the smaller of the two risks.
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
            <ScoreMeter score={result.totalScore} max={result.maxScore}
                        tone={tone} bandLabel={result.band.label} />
            <div className="fr-verdict-body">
              <p className={`fr-band fr-tone-${tone}`}>
                <span className="fr-band-dot" aria-hidden="true" />
                {result.band.label}
              </p>
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

          <h3 className="fr-h3">Where your score comes from</h3>
          <ContributionChart sections={result.sections} total={result.totalScore} />

          <h3 className="fr-h3 fr-h3-spaced">What to do next</h3>
          <p className="fr-advice">{result.band.advice}</p>
          <p className="fr-note fr-note-quiet">
            Medication is worth singling out. Sedatives, opioids, and blood pressure
            medicines are among the few fall risks that can be reduced this month rather
            than over a year of training — but only with the prescriber who started them.
            Do not stop anything on the strength of a web page.
          </p>

          <div className="fr-global">
            <h3 className="fr-h3">Where falls are deadliest, worldwide</h3>
            <CountryChart
              data={global.data} state={global.state} error={global.error} topN={topN}
              sex={chartSex} region={chartRegion}
              onSexChange={setChartSex} onRegionChange={setChartRegion}
              regions={REGIONS}
            />
            {global.data && (
              <p className="fr-source">
                Source: {global.data.source}, indicator {global.data.indicator} —{' '}
                {global.data.indicatorName}, {global.data.dataYear}. Global median{' '}
                {global.data.globalMedian}.
                {global.data.live
                  ? ' Queried live.'
                  : ` Served from our cached copy taken ${global.data.snapshotRetrieved} — the WHO API did not respond.`}
                {' '}States with populations under about 300,000 are excluded, because a
                rate over so small a population turns on a handful of deaths.
              </p>
            )}
          </div>

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
                onClick={() => { clearTimeout(advanceRef.current); setStep(s => Math.max(0, s - 1)); }}
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
                  onClick={() => { clearTimeout(advanceRef.current); goNext(); }}
                  disabled={!canAdvance}>
            {stepId === 'about'
              ? 'Start the questions'
              : STEPS[step + 1] === 'results' ? 'Skip to results' : 'Skip this block'}
          </button>
        )}
      </div>
      {!canAdvance && (
        <p className="fr-note fr-note-quiet" role="status">Choose an age band to continue.</p>
      )}
    </section>
  );
}
