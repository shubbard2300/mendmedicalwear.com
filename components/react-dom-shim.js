// Companion to react-shim.js — see the note there.
var ReactDOM = window.ReactDOM;
if (!ReactDOM) throw new Error('ReactDOM global missing — load react-dom.production.min.js first');
export var createRoot = ReactDOM.createRoot;
