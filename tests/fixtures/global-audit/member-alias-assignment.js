const __rootOwner = {};
const __ownerAlias = __rootOwner;
__ownerAlias.publish = function (host) { host.rogueAliasedMember = true; };
__rootOwner.publish(window);
