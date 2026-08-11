function expose(name) {
  ({ name } = { name: "rogue" });
  window[name] = true;
}
expose("__safe");
