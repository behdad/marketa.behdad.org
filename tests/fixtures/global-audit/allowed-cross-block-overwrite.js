const __blockOwner = {};
__blockOwner.publish = function (host) { host.staleBlock = true; };
{ __blockOwner.publish = function () {}; }
__blockOwner.publish(window);
const __trueOwner = {};
__trueOwner.publish = function (host) { host.staleTrue = true; };
if (true) __trueOwner.publish = function () {};
__trueOwner.publish(window);
const __falseOwner = {};
__falseOwner.publish = function (host) { host.staleFalseElse = true; };
if (false) {} else __falseOwner.publish = function () {};
__falseOwner.publish(window);
const __deadOwner = { publish: function () {} };
if (false) __deadOwner.publish = function (host) { host.deadBranch = true; };
__deadOwner.publish(window);
