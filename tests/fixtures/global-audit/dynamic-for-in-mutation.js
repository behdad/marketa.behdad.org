function expose(name) {
  for (name in { rogue: true }) {}
  window[name] = true;
}
expose("__safe");
