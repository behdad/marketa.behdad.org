const define = Function.prototype.call.bind(Object.defineProperty);
define(Object, window, "rogueCallBind", { value: true });
