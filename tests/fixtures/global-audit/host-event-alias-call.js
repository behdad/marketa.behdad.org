const __listen = window.addEventListener;
__listen.call(window, "audit-alias", function () { this.rogueEventAliasCall = true; });
