const __safeOwner = { publish: function (host) { host.localOnly = true; } };
__safeOwner.publish({});
[function (host) { host.localOnly = true; }][0]({});
[{}].flatMap(function (host) { host.localOnly = true; return []; });
[{}].reduce(function (previous, host) { host.localOnly = true; return previous; }, {});
