(function () {
  this.weddingSloppyTransient = { source: "sloppy-this" };
  window.__weddingFiveNameProof = { sloppy: [window.weddingSloppyTransient.source, (0, eval)("weddingSloppyTransient").source] };
  delete this.weddingSloppyTransient;
}());
loft.__proto__.weddingBareLoftTransient = { source: "bare-loft-prototype" };
window.__weddingFiveNameProof.bareLoft = [window.weddingBareLoftTransient.source, (0, eval)("weddingBareLoftTransient").source];
delete loft.__proto__.weddingBareLoftTransient;
window.top.weddingTopTransient = { source: "top-alias" };
window.__weddingFiveNameProof.top = [window.weddingTopTransient.source, (0, eval)("weddingTopTransient").source];
delete window.top.weddingTopTransient;
Function.prototype.call.call(Object.defineProperty, null, window, "weddingUncurryTransient", { configurable: true, value: { source: "call-uncurry" } });
window.__weddingFiveNameProof.uncurry = [window.weddingUncurryTransient.source, (0, eval)("weddingUncurryTransient").source];
delete window.top.weddingUncurryTransient;
({ publish: function (host) {
  host.weddingMethodTransient = { source: "member-call" };
  window.__weddingFiveNameProof.method = [window.weddingMethodTransient.source, (0, eval)("weddingMethodTransient").source];
  delete host.weddingMethodTransient;
} }).publish(window);
