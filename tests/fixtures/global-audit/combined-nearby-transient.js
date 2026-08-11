window.__weddingNearProof = {};
window.__nestedOwner = {
  publish: function () {
    this.weddingNestedPrivateTransient = { s: "private-nested-member" };
    window.__weddingNearProof.nested = [window.weddingNestedPrivateTransient.s, (0, eval)("weddingNestedPrivateTransient").s];
    delete this.weddingNestedPrivateTransient;
  }
};
window.__nestedOwner.publish.call(window);
({ ["publish"]: function (host) {
  host.weddingComputedMemberTransient = { s: "computed-member" };
  window.__weddingNearProof.computed = [window.weddingComputedMemberTransient.s, (0, eval)("weddingComputedMemberTransient").s];
  delete host.weddingComputedMemberTransient;
} }).publish(window);
window.addEventListener("wedding-near-proof", function () {
  this.weddingEventThisTransient = { s: "event-this" };
  window.__weddingNearProof.eventThis = [window.weddingEventThisTransient.s, (0, eval)("weddingEventThisTransient").s];
  delete this.weddingEventThisTransient;
}, { once: true });
window.dispatchEvent(new Event("wedding-near-proof"));
Reflect.apply(Function.prototype.call, Object.defineProperty, [null, window, "weddingReflectUncurryTransient", { configurable: true, value: { s: "reflect-uncurry" } }]);
window.__weddingNearProof.reflectUncurry = [window.weddingReflectUncurryTransient.s, (0, eval)("weddingReflectUncurryTransient").s];
window.addEventListener("wedding-near-clean", function () { delete this.weddingReflectUncurryTransient; }, { once: true });
window.dispatchEvent(new Event("wedding-near-clean"));
