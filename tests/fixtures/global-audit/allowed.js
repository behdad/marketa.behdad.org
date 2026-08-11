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
  function localRest(...items) { items[0].localOnly = true; }
  function localSpread(item) { item.localOnly = true; }
  function LocalConstructor() {}
  LocalConstructor.prototype.safeMethod = function () {};
  exposeSafe("__safeProbe");
  exposeDefault();
  exposeObject({ name: "__safeObject" });
  localRest({});
  localSpread(...[{}]);
  const [first, ...tail] = [{}, {}];
  tail[0].localOnly = true;
  [{}].forEach(function (item) { item.localOnly = true; });
})();
