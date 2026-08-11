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
  (function () { "use strict"; if (this) this.localOnly = true; }());
  ({ update: function () { this.localOnly = true; } }).update();
  const localOwner = { update: function (item) { item.localOnly = true; } };
  localOwner.update({});
  [function (item) { item.localOnly = true; }][0]({});
  [{}].flatMap(function (item) { item.localOnly = true; return []; });
  [{}].flatMap(function (_item, _index, owners) { owners[0].localOnly = true; return []; });
  [{}].forEach(function () { "use strict"; if (this) this.localOnly = true; });
  [{}].reduce(function (previous, item) { item.localOnly = true; return previous; }, {});
  function localThis() { this.localOnly = true; }
  localThis.call({});
  localThis.apply({}, []);
  localThis.bind({})();
})();
for (let weddingLoopLocal = 0; weddingLoopLocal < 1; weddingLoopLocal++) {}
for (const weddingLoopValue of [1]) { void weddingLoopValue; }
switch (1) { case 1: const weddingSwitchLocal = 1; void weddingSwitchLocal; }
