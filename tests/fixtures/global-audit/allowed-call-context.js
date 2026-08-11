(function () { "use strict"; if (this) this.localOnly = true; }());
({ update: function () { this.localOnly = true; } }).update();
function __localReceiver() { this.localOnly = true; }
__localReceiver.call({});
__localReceiver.apply({}, []);
__localReceiver.bind({})();
const __assignedLocalOwner = {};
__assignedLocalOwner.update = function () { this.localOnly = true; };
__assignedLocalOwner.update();
