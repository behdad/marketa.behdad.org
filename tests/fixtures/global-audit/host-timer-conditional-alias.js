const __localLater = function () {};
const __conditionalLater = flag ? window.setTimeout : __localLater;
__conditionalLater(function () { this.rogueConditionalTimerAlias = true; }, 0);
