/**
 * Stub for @mariozechner/clipboard on Termux (Linux ARM64 musl). No native binding; clipboard skill won't work on Pixel.
 */

function noop() {}
function noopAsync() { return Promise.resolve(); }
function returnEmpty() { return ''; }
function returnFalse() { return false; }
function returnEmptyArray() { return []; }
function returnNull() { return null; }

module.exports = {
  availableFormats: returnEmptyArray,
  getText: returnEmpty,
  setText: noop,
  hasText: returnFalse,
  getImageBinary: returnNull,
  getImageBase64: returnEmpty,
  setImageBinary: noop,
  setImageBase64: noop,
  hasImage: returnFalse,
  getHtml: returnEmpty,
  setHtml: noop,
  hasHtml: returnFalse,
  getRtf: returnEmpty,
  setRtf: noop,
  hasRtf: returnFalse,
  clear: noop,
  watch: noop,
  callThreadsafeFunction: noopAsync
};
