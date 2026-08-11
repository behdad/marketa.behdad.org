function expose(name) {
  [name] = ["rogue"];
  window[name] = true;
}
expose("__safe");
