const __conditionalOwner = {};
__conditionalOwner.publish = function (host) { host.rogueConditionalMember = true; };
if (flag) __conditionalOwner.publish = function () {};
__conditionalOwner.publish(window);
