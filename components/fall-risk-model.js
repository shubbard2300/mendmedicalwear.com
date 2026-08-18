/**
 * Fall-risk questionnaire + scoring model.
 *
 * Framework-agnostic on purpose: no React, no DOM, no network. The component
 * renders it and the endpoint never sees it — every answer stays in the browser.
 *
 * Clinical backbone is the CDC STEADI "Stay Independent" self-assessment (public
 * domain, 12 items, 14 points, >=4 flags increased risk). STEADI is a screening
 * questionnaire, not a diagnostic instrument, and it is validated for adults 65+;
 * we surface it to younger adults too but weight the age gradient accordingly.
 *
 * Three blocks extend STEADI where the brief asked for more detail — medication
 * classes, withdrawal/detox state, and home environment. Those weights are
 * clinically motivated (fall-risk-increasing drugs, or FRIDs, are the best
 * documented modifiable driver in the literature) but they are house calibration,
 * not a validated published scale. Anything derived from them is presented as a
 * relative index, never as a probability.
 */

export const STEADI_THRESHOLD = 4;

/** Approximate relative gradient of fall mortality by age, indexed to 65-69 = 1.0.
 *  Shape follows the CDC WISQARS fall-death curve, which roughly doubles per
 *  decade past 65. Relative only — never render these as a personal probability. */
export const AGE_BANDS = [
  { value: 'under50', label: 'Under 50',  multiplier: 0.35 },
  { value: '50-59',   label: '50 – 59',   multiplier: 0.6 },
  { value: '60-64',   label: '60 – 64',   multiplier: 0.8 },
  { value: '65-69',   label: '65 – 69',   multiplier: 1.0 },
  { value: '70-74',   label: '70 – 74',   multiplier: 1.4 },
  { value: '75-79',   label: '75 – 79',   multiplier: 2.1 },
  { value: '80-84',   label: '80 – 84',   multiplier: 3.2 },
  { value: '85plus',  label: '85 or older', multiplier: 5.0 }
];

export const SEX_OPTIONS = [
  { value: 'all',    label: 'Prefer not to say' },
  { value: 'female', label: 'Female' },
  { value: 'male',   label: 'Male' }
];

/** WHO regions, matching the ParentLocation values in the GHO dataset. */
export const REGIONS = [
  'Africa', 'Americas', 'Eastern Mediterranean',
  'Europe', 'South-East Asia', 'Western Pacific'
];

/**
 * Question blocks. Every item is a yes/no checkbox worth `points`.
 * `driver` is the plain-language phrase echoed back in the results summary.
 */
export const SECTIONS = [
  {
    id: 'steadi',
    title: 'Balance and mobility',
    note: 'The 12 questions below are the CDC STEADI “Stay Independent” screener, used as published.',
    questions: [
      { id: 's1',  points: 2, text: 'I have fallen in the past year.', driver: 'a fall in the past year' },
      { id: 's2',  points: 2, text: 'I use, or have been advised to use, a cane or walker to get around safely.', driver: 'use of a mobility aid' },
      { id: 's3',  points: 1, text: 'Sometimes I feel unsteady when I am walking.', driver: 'unsteadiness when walking' },
      { id: 's4',  points: 1, text: 'I steady myself by holding onto furniture when walking at home.', driver: 'furniture walking at home' },
      { id: 's5',  points: 1, text: 'I am worried about falling.', driver: 'worry about falling' },
      { id: 's6',  points: 1, text: 'I need to push with my hands to stand up from a chair.', driver: 'difficulty rising from a chair' },
      { id: 's7',  points: 1, text: 'I have some trouble stepping up onto a curb.', driver: 'trouble with curbs and steps' },
      { id: 's8',  points: 1, text: 'I often have to rush to the toilet.', driver: 'urinary urgency' },
      { id: 's9',  points: 1, text: 'I have lost some feeling in my feet.', driver: 'reduced sensation in the feet' },
      { id: 's10', points: 1, text: 'I take medicine that sometimes makes me feel light-headed or more tired than usual.', driver: 'medication causing light-headedness' },
      { id: 's11', points: 1, text: 'I take medicine to help me sleep or improve my mood.', driver: 'sleep or mood medication' },
      { id: 's12', points: 1, text: 'I often feel sad or depressed.', driver: 'low mood' }
    ]
  },
  {
    id: 'medications',
    title: 'Medications',
    note: 'Check every class you currently take. These are fall-risk-increasing drugs (FRIDs) — the most modifiable driver on this page.',
    questions: [
      { id: 'm1', points: 2, text: 'Benzodiazepines or prescription sleep aids (diazepam, lorazepam, zolpidem, and similar).', driver: 'benzodiazepines or sleep aids' },
      { id: 'm2', points: 2, text: 'Opioid pain medicine.', driver: 'opioid pain medicine' },
      { id: 'm3', points: 2, text: 'Antipsychotics.', driver: 'antipsychotic medication' },
      { id: 'm4', points: 1, text: 'Antidepressants.', driver: 'antidepressants' },
      { id: 'm5', points: 1, text: 'Blood pressure medicine or diuretics (“water pills”).', driver: 'blood pressure medicine or diuretics' },
      { id: 'm6', points: 1, text: 'Anticonvulsants or medicine for seizures.', driver: 'anticonvulsants' },
      { id: 'm7', points: 1, text: 'Anticholinergics — bladder medicine, or older antihistamines.', driver: 'anticholinergic medication' },
      { id: 'm8', points: 1, text: 'Insulin or sulfonylureas that can drop blood sugar.', driver: 'medication that can drop blood sugar' },
      { id: 'm9', points: 2, text: 'I take four or more prescription medicines every day.', driver: 'polypharmacy (four or more daily medicines)' }
    ]
  },
  {
    id: 'withdrawal',
    title: 'Withdrawal, detox, and recent changes',
    note: 'Withdrawal states raise fall risk sharply through tremor, unsteady gait, low blood pressure, and disturbed sleep.',
    questions: [
      { id: 'w1', points: 3, critical: true, text: 'I am currently withdrawing or detoxing from alcohol or sedatives.', driver: 'active alcohol or sedative withdrawal' },
      { id: 'w2', points: 2, text: 'I am in the first month of a taper, detox, or newly stopped a long-term medicine.', driver: 'an early taper or recent detox' },
      { id: 'w3', points: 1, text: 'A medicine of mine was started or had its dose changed in the past two weeks.', driver: 'a recent medication change' },
      { id: 'w4', points: 1, text: 'I drink alcohol most days.', driver: 'daily alcohol use' }
    ]
  },
  {
    id: 'environment',
    title: 'Home and daily life',
    note: 'Environment does not cause falls on its own, but it decides whether a stumble becomes an injury.',
    questions: [
      { id: 'e1', points: 1, text: 'I live alone.', driver: 'living alone' },
      { id: 'e2', points: 1, text: 'I use stairs daily without a secure handrail.', driver: 'daily stairs without a handrail' },
      { id: 'e3', points: 1, text: 'My eyesight has changed in the past year, or my glasses are out of date.', driver: 'a recent change in eyesight' },
      { id: 'e4', points: 1, text: 'There are loose rugs, cords, or poor lighting on the paths I walk at home.', driver: 'trip hazards at home' },
      { id: 'e5', points: 1, text: 'My bathroom has no grab bar near the toilet or shower.', driver: 'a bathroom without grab bars' }
    ]
  }
];

export const MAX_SCORE = SECTIONS.reduce(
  (total, section) => total + section.questions.reduce((n, q) => n + q.points, 0), 0
);

export const RISK_BANDS = [
  {
    id: 'lower', label: 'Lower risk', min: 0, max: 3,
    summary: 'Nothing here points to a raised risk of falling right now.',
    advice: 'Keep the habits that hold this steady: strength and balance work a few times a week, an annual eye test, and a yearly look at your medicine list with a pharmacist.'
  },
  {
    id: 'increased', label: 'Increased risk', min: 4, max: 7,
    summary: 'You scored at or above the CDC STEADI threshold of 4, which is the point at which a clinician would start screening you for falls.',
    advice: 'Bring this score to your next appointment and ask for a gait-and-balance check. Ask a pharmacist to review every medicine on your list, including anything over the counter.'
  },
  {
    id: 'high', label: 'High risk', min: 8, max: 13,
    summary: 'Several risk drivers are stacking here, and they compound rather than simply add.',
    advice: 'This is worth a dedicated appointment rather than a mention in passing. Ask about a formal falls assessment, a medication review, and a home safety visit — most regions fund all three.'
  },
  {
    id: 'veryhigh', label: 'Very high risk', min: 14, max: Infinity,
    summary: 'This profile carries the risk load a clinician would want to see quickly.',
    advice: 'Please speak to a doctor or nurse soon rather than at your next routine visit, and ask specifically about a falls clinic referral.'
  }
];

/**
 * @param {{age?: string, sex?: string, answers?: Record<string, boolean>}} input
 */
export function scoreAssessment(input) {
  const answers = input.answers || {};
  const ageBand = AGE_BANDS.find(b => b.value === input.age) || null;

  const sections = SECTIONS.map(section => {
    const hit = section.questions.filter(q => answers[q.id]);
    return {
      id: section.id,
      title: section.title,
      score: hit.reduce((n, q) => n + q.points, 0),
      max: section.questions.reduce((n, q) => n + q.points, 0),
      drivers: hit.map(q => q.driver)
    };
  });

  const totalScore = sections.reduce((n, s) => n + s.score, 0);
  const band = RISK_BANDS.find(b => totalScore >= b.min && totalScore <= b.max);

  // Relative index, not a probability: the age gradient scaled by how much of the
  // questionnaire's total weight the person actually carries. Capped so a maxed-out
  // questionnaire triples the age term rather than running away.
  const ageMultiplier = ageBand ? ageBand.multiplier : 1;
  const profileMultiplier = ageMultiplier * (1 + Math.min(totalScore / MAX_SCORE, 1) * 2);

  // Named separately from the score because it changes the advice, not the arithmetic:
  // unsupervised alcohol or benzodiazepine withdrawal can be fatal on its own terms.
  const criticalFlags = SECTIONS
    .flatMap(s => s.questions)
    .filter(q => q.critical && answers[q.id])
    .map(q => q.id);

  return {
    ageBand,
    sex: input.sex || 'all',
    sections,
    totalScore,
    maxScore: MAX_SCORE,
    meetsSteadiThreshold: totalScore >= STEADI_THRESHOLD,
    band,
    ageMultiplier,
    profileMultiplier: Math.round(profileMultiplier * 100) / 100,
    criticalFlags,
    topDrivers: sections
      .flatMap(s => s.drivers)
      .slice(0, 6)
  };
}

/** Answered enough to be worth scoring? Age alone is the only hard requirement. */
export function isComplete(input) {
  return Boolean(AGE_BANDS.find(b => b.value === input.age));
}
