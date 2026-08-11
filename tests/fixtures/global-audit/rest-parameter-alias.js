function expose(...args) {
  const [host] = args;
  host.rogueRestAlias = true;
}
expose(window);
