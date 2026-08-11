window.loft.__proto__.weddingLoftPrototypeLeak = { public: true };
window.__weddingCombinedResolution = {
  lexicalBare: weddingLexicalLeak.public === true,
  lexicalOwn: Object.prototype.hasOwnProperty.call(window, "weddingLexicalLeak"),
  prototypeWindow: window.weddingLoftPrototypeLeak.public === true,
  prototypeBare: (0, eval)("weddingLoftPrototypeLeak").public === true
};
delete window.loft.__proto__.weddingLoftPrototypeLeak;
