(function () {
  const left = {};
  const right = {};
  const local = flag ? left : right;
  local.notGlobal = true;
})();
