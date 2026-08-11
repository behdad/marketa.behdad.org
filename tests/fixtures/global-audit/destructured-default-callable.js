const __fallbackPublish = function () {};
window.__defaultCallableOwner = { publish: function (host) { host.rogueDestructuredDefaultCallable = true; } };
const { publish: __defaultPublish = __fallbackPublish } = window.__defaultCallableOwner;
__defaultPublish(window);
