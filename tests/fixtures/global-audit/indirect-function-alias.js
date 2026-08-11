function expose(host) {
  host.rogueIndirect = true;
  delete host.rogueIndirect;
}
const alias = expose;
alias(window);
