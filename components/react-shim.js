// The MEND site is static HTML with no bundler, so React arrives as a UMD global
// from the CDN. This shim lets the component source use ordinary `import React
// from 'react'` — esbuild aliases the import here at build time.
var React = window.React;
if (!React) throw new Error('React global missing — load react.production.min.js first');
export default React;
export var useState = React.useState;
export var useEffect = React.useEffect;
export var useMemo = React.useMemo;
export var useCallback = React.useCallback;
export var useRef = React.useRef;
export var createElement = React.createElement;
export var Fragment = React.Fragment;
