window.__safeNestedOwner = { publish: function () { this.localOnly = true; } };
window.__safeNestedOwner.publish();
({ ["publish"]: function (host) { host.localOnly = true; } }).publish({});
const __safeMethodName = "publish";
({ [__safeMethodName]: function (host) { host.localOnly = true; } })[__safeMethodName]({});
document.addEventListener("audit-safe", function () { this.localOnly = true; });
