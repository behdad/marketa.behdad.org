window.loft = {};
window.__privateHook = true;
Object.defineProperty(window, "__privateDescriptor", { value: true });
window.loft.Widget = function () {};
window.loft.Widget.prototype.method = function () {};
(function () {
  function localShadow(window) { window.localOnly = true; }
  function exposeSafe(name) { window[name] = true; }
  function exposeDefault(name = "__safeDefault") { window[name] = true; }
  function exposeObject({ name }) { window[name] = true; }
  exposeSafe("__safeProbe");
  exposeDefault();
  exposeObject({ name: "__safeObject" });
})();
