function expose(name) {
  for (name of ["rogue"]) {}
  window[name] = true;
}
expose("__safe");
