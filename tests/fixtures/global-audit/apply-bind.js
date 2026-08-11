const define = Function.prototype.apply.bind(Object.defineProperty);
define(Object, [window, "rogueApplyBind", { value: true }]);
