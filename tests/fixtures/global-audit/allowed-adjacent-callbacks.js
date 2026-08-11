Promise.resolve().then(function () { "use strict"; if (this) this.localOnly = true; });
const __localScheduler = function (callback) { callback.call({}); };
const __schedulerAlias = __localScheduler;
__schedulerAlias(function () { this.localOnly = true; });
const __localComputed = "pub" + "lish";
({ [__localComputed]: function (host) { host.localOnly = true; } })[__localComputed]({});
