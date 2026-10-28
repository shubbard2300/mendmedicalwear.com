import type {BlockContent, CtaLink} from '@/sanity/types'
import {Cta} from './Cta'
import {RichText} from './RichText'

// The custom-branding block every product page ends with. The copy and the button are stored; the logo-preview widget is UI and stays in
// code, copied from the live page (it comes alive in P4). The copy runs lede, paragraph, list, so those nodes carry the live classes.
const COPY_CLASSES = {0: 'brand-it-lede', 2: 'brand-it-list'}

export function BrandIt({heading, body, cta, footnote}: {heading?: string; body?: BlockContent; cta?: CtaLink; footnote?: string}) {
  return (
    <div className="section brand-it">
      <h2>{heading}</h2>
      <div className="brand-it-inner">
        <div className="brand-it-copy">
          <RichText value={body} classes={COPY_CLASSES} />
        </div>
        <div className="brand-it-preview">
          <span className="brand-it-upload-label">Live Logo Preview</span>
          <div className="brand-it-drop" id="brandItDrop">
            <input type="file" accept="image/*" id="brandItFile" />
            <div className="brand-it-placeholder">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Drop your logo here or click to upload</span>
              <span className="sub">PNG with transparency recommended · SVG · JPG</span>
            </div>
            <canvas id="brandItCanvas" className="brand-it-canvas"></canvas>
          </div>
          <div className="brand-it-actions">
            <a className="btn btn-secondary" id="brandItDownload" style={{display: 'none'}} download="mend-brand-preview.png">
              Download Preview
            </a>
            <button className="btn btn-secondary" id="brandItReset" style={{display: 'none'}}>
              Reset
            </button>
          </div>
        </div>
      </div>
      <div className="brand-it-cta">
        {cta && <Cta cta={cta} className="btn btn-primary" />} <span className="brand-it-hint">{footnote}</span>
      </div>
    </div>
  )
}
