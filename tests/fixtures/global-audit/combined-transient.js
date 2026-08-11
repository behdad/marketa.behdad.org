const host = true ? window : window;
host.weddingTransientLeak = { public: true };
window.__weddingTransientResolution = {
  windowValue: window.weddingTransientLeak.public === true,
  bareValue: (0, eval)("weddingTransientLeak").public === true
};
delete host.weddingTransientLeak;
