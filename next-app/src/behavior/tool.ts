// Ported from the Fall Risk page's inline script (P4a). That page deliberately does not load main.js, so it gets only the mobile nav
// toggle and the first-touch lead source, the same two blocks live inlines there.
import {initNavToggle, recordSource, type Cleanup} from './shared'

export function initTool(): Cleanup {
  recordSource()
  return initNavToggle()
}
