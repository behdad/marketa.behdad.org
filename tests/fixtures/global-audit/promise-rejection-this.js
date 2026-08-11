Promise.reject(new Error("expected")).then(null, function () { this.roguePromiseRejectionThis = true; });
