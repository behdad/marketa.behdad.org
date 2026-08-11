const define = flag ? Object.defineProperty : localFallback;
define(window, "rogueConditionalMeta", { value: true });
