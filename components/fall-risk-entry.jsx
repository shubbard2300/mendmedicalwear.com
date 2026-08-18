// Browser entry point. Mounts FallRiskAssessment into #fall-risk-root and reads
// its options from data- attributes so the same bundle can be dropped onto any page.
import React from 'react';
import { createRoot } from 'react-dom/client';
import FallRiskAssessment from './FallRiskAssessment.jsx';

var el = document.getElementById('fall-risk-root');
if (el) {
  createRoot(el).render(
    <FallRiskAssessment
      apiPath={el.dataset.api || '/api/fall-risk-regions'}
      topN={parseInt(el.dataset.top, 10) || 5}
      headingTag={el.dataset.heading || 'h1'}
    />
  );
}
