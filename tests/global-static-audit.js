#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");

function internalModule(name) {
  var source = process.binding("natives")[name];
  if (!source) throw new Error("Node's bundled parser is unavailable: " + name);
  var module = { exports: {} };
  Function("exports", "require", "module", "__filename", "__dirname", source)(module.exports, require, module, name, "");
  return module.exports;
}
var acorn = internalModule("internal/deps/acorn/acorn/dist/acorn");
var walk = internalModule("internal/deps/acorn/acorn-walk/dist/walk");

function lexicalModel(ast) {
  var nodeScopes = new WeakMap(), functionBindings = new WeakMap(), scopes = [];
  function makeScope(parent, type) {
    var scope = { parent: parent, type: type, bindings: new Map() };
    scopes.push(scope);
    return scope;
  }
  var programScope = makeScope(null, "program");
  function nearestVarScope(scope) {
    while (scope.parent && scope.type !== "function" && scope.type !== "program") scope = scope.parent;
    return scope;
  }
  function binding(scope, name) {
    if (!scope.bindings.has(name)) scope.bindings.set(name, { name: name, scope: scope, sources: [], params: null, functionNode: null });
    return scope.bindings.get(name);
  }
  function resolve(scope, name) {
    while (scope) {
      if (scope.bindings.has(name)) return scope.bindings.get(name);
      scope = scope.parent;
    }
    return null;
  }
  function markPattern(pattern, scope, declareScope, param) {
    if (!pattern) return;
    nodeScopes.set(pattern, scope);
    if (pattern.type === "Identifier") {
      var found = binding(declareScope, pattern.name);
      if (param) { found.paramOwner = param.owner; found.paramIndex = param.index; }
      return found;
    }
    if (pattern.type === "RestElement") return markPattern(pattern.argument, scope, declareScope, param);
    if (pattern.type === "AssignmentPattern") {
      var assigned = markPattern(pattern.left, scope, declareScope, param);
      scan(pattern.right, scope);
      return assigned;
    }
    if (pattern.type === "ArrayPattern") {
      pattern.elements.forEach(function (item) { markPattern(item, scope, declareScope, param); });
      return;
    }
    if (pattern.type === "ObjectPattern") {
      pattern.properties.forEach(function (property) {
        nodeScopes.set(property, scope);
        if (property.computed) scan(property.key, scope);
        markPattern(property.type === "RestElement" ? property.argument : property.value, scope, declareScope, param);
      });
    }
  }
  function scanChildren(node, scope, skip) {
    Object.keys(node).forEach(function (key) {
      if (skip && skip[key]) return;
      var value = node[key];
      if (Array.isArray(value)) value.forEach(function (child) { if (child && typeof child.type === "string") scan(child, scope); });
      else if (value && typeof value.type === "string") scan(value, scope);
    });
  }
  function scanFunction(node, outerScope, outerBinding) {
    var functionScope = makeScope(outerScope, "function");
    nodeScopes.set(node, outerScope);
    if (node.type === "FunctionExpression" && node.id) {
      nodeScopes.set(node.id, functionScope);
      binding(functionScope, node.id.name).functionNode = node;
    }
    var params = [];
    node.params.forEach(function (param, index) {
      markPattern(param, functionScope, functionScope, { owner: node, index: index });
      if (param.type === "Identifier") params[index] = resolve(functionScope, param.name);
    });
    if (outerBinding) {
      outerBinding.functionNode = node;
      outerBinding.params = params;
      functionBindings.set(node, outerBinding);
    }
    scan(node.body, functionScope);
  }
  function scan(node, scope) {
    if (!node) return;
    nodeScopes.set(node, scope);
    if (node.type === "Program") { node.body.forEach(function (child) { scan(child, scope); }); return; }
    if (node.type === "BlockStatement") {
      var blockScope = makeScope(scope, "block");
      node.body.forEach(function (child) { scan(child, blockScope); });
      return;
    }
    if (node.type === "FunctionDeclaration") {
      var declared = node.id ? binding(scope, node.id.name) : null;
      if (node.id) nodeScopes.set(node.id, scope);
      scanFunction(node, scope, declared);
      return;
    }
    if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") { scanFunction(node, scope, null); return; }
    if (node.type === "VariableDeclaration") {
      var declareScope = node.kind === "var" ? nearestVarScope(scope) : scope;
      node.declarations.forEach(function (declarator) {
        nodeScopes.set(declarator, scope);
        var found = markPattern(declarator.id, scope, declareScope, null);
        if (found && declarator.init) {
          found.sources.push({ node: declarator.init, scope: scope });
          if (declarator.init.type === "FunctionExpression" || declarator.init.type === "ArrowFunctionExpression") scanFunction(declarator.init, scope, found);
          else scan(declarator.init, scope);
        } else if (declarator.init) {
          if (declarator.id.type === "ObjectPattern") declarator.id.properties.forEach(function (property) {
            if (property.type !== "Property" || property.value.type !== "Identifier") return;
            var destructured = resolve(scope, property.value.name);
            if (destructured) destructured.destructuredMethod = { owner: declarator.init, key: property.key, computed: property.computed };
          });
          scan(declarator.init, scope);
        }
      });
      return;
    }
    if (node.type === "ClassDeclaration") {
      if (node.id) { nodeScopes.set(node.id, scope); binding(scope, node.id.name); }
      scanChildren(node, scope, { id: true });
      return;
    }
    if (node.type === "CatchClause") {
      var catchScope = makeScope(scope, "block");
      markPattern(node.param, catchScope, catchScope, null);
      scan(node.body, catchScope);
      return;
    }
    scanChildren(node, scope);
  }
  scan(ast, programScope);

  walk.simple(ast, {
    AssignmentExpression: function (node) {
      if (node.operator !== "=" || node.left.type !== "Identifier") return;
      var found = resolve(nodeScopes.get(node.left), node.left.name);
      if (found) found.sources.push({ node: node.right, scope: nodeScopes.get(node.right) });
    },
    CallExpression: function (node) {
      if (node.callee.type !== "Identifier") return;
      var found = resolve(nodeScopes.get(node.callee), node.callee.name);
      if (!found || !found.functionNode || !found.params) return;
      found.params.forEach(function (param, index) {
        if (param) param.sources.push({ node: node.arguments[index] || null, scope: nodeScopes.get(node.arguments[index]) || nodeScopes.get(node) });
      });
    }
  });
  walk.ancestor(ast, {
    Identifier: function (node, ancestors) {
      var found = resolve(nodeScopes.get(node), node.name);
      if (!found || !found.functionNode) return;
      var parent = ancestors[ancestors.length - 2];
      if ((parent.type === "FunctionDeclaration" || parent.type === "FunctionExpression") && parent.id === node) return;
      if (parent.type === "VariableDeclarator" && parent.id === node) return;
      if (parent.type === "CallExpression" && parent.callee === node) return;
      found.indirectReference = true;
    }
  });
  return { nodeScopes: nodeScopes, resolve: resolve, programScope: programScope, functionBindings: functionBindings };
}

function auditSource(source, file) {
  var ast;
  try { ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script", locations: true, allowHashBang: true }); }
  catch (error) { return [{ file: file, line: error.loc && error.loc.line || 0, kind: "parse", name: null, message: error.message }]; }
  var model = lexicalModel(ast), nodeScopes = model.nodeScopes, resolve = model.resolve;
  var globalNames = new Set(["window", "globalThis", "self"]), metaOwners = new Set(["Object", "Reflect"]);
  var vendorCaptures = new Set(["turnstile", "loadPyodide", "V86"]);
  function bindingOf(node) { return node && node.type === "Identifier" ? resolve(nodeScopes.get(node), node.name) : null; }
  function isGlobalIdentifier(node, names) { return node && node.type === "Identifier" && names.has(node.name) && !bindingOf(node); }
  function bindingMatches(found, predicate, seen) {
    if (!found || seen.has(found) || !found.sources.length) return false;
    seen.add(found);
    var matched = found.sources.some(function (sourceRef) { return sourceRef.node && predicate(sourceRef.node, sourceRef.scope, seen); });
    seen.delete(found);
    return matched;
  }
  function isWindow(node, scope, seen) {
    if (isGlobalIdentifier(node, globalNames)) return true;
    if (!(node && node.type === "Identifier")) return false;
    return bindingMatches(resolve(scope || nodeScopes.get(node), node.name), isWindow, seen || new Set());
  }
  function metaOwner(node, scope, seen) {
    if (isGlobalIdentifier(node, metaOwners)) return node.name;
    if (!(node && node.type === "Identifier")) return null;
    var found = resolve(scope || nodeScopes.get(node), node.name), result = null;
    if (!found || (seen = seen || new Set()).has(found)) return null;
    seen.add(found);
    found.sources.some(function (sourceRef) { result = metaOwner(sourceRef.node, sourceRef.scope, seen); return !!result; });
    seen.delete(found);
    return result;
  }
  function mergeValues(parts) {
    var values = new Set();
    for (var i = 0; i < parts.length; i++) {
      if (!parts[i]) return null;
      parts[i].forEach(function (value) { values.add(value); });
    }
    return values;
  }
  function stringValues(node, scope, seen) {
    if (!node) return null;
    if (node.type === "Literal" && typeof node.value === "string") return new Set([node.value]);
    if (node.type === "TemplateLiteral" && node.expressions.length === 0) return new Set([node.quasis[0].value.cooked]);
    if (node.type === "Identifier") {
      var found = resolve(scope || nodeScopes.get(node), node.name);
      if (!found || (seen = seen || new Set()).has(found) || !found.sources.length) return null;
      if (found.paramOwner) {
        var ownerBinding = model.functionBindings.get(found.paramOwner);
        if (!ownerBinding || ownerBinding.indirectReference) return null;
      }
      seen.add(found);
      var resolved = mergeValues(found.sources.map(function (sourceRef) { return stringValues(sourceRef.node, sourceRef.scope, seen); }));
      seen.delete(found);
      return resolved;
    }
    if (node.type === "ConditionalExpression") return mergeValues([stringValues(node.consequent, nodeScopes.get(node.consequent), seen), stringValues(node.alternate, nodeScopes.get(node.alternate), seen)]);
    if (node.type === "LogicalExpression") return mergeValues([stringValues(node.left, nodeScopes.get(node.left), seen), stringValues(node.right, nodeScopes.get(node.right), seen)]);
    if (node.type === "BinaryExpression" && node.operator === "+") {
      var left = stringValues(node.left, nodeScopes.get(node.left), seen), right = stringValues(node.right, nodeScopes.get(node.right), seen);
      if (left && !right && Array.from(left).every(function (value) { return value.indexOf("__") === 0; })) return new Set(["__*"]);
      if (!left || !right) return null;
      var combined = new Set();
      left.forEach(function (a) { right.forEach(function (b) { combined.add(a + b); }); });
      return combined;
    }
    if (node.type === "MemberExpression") {
      var objectBinding = bindingOf(node.object), objects = objectBinding && objectBinding.sources.map(function (sourceRef) { return sourceRef.node; });
      if (!objects || !objects.length || objects.some(function (candidate) { return candidate.type !== "ObjectExpression"; })) return null;
      var wanted = node.computed ? stringValues(node.property, nodeScopes.get(node.property), seen) : new Set([node.property.name]);
      var outputs = [];
      objects.forEach(function (object) {
        object.properties.forEach(function (property) {
          if (property.type !== "Property") { outputs.push(null); return; }
          var keys = property.computed ? stringValues(property.key, nodeScopes.get(property.key), seen) : new Set([property.key.name || property.key.value]);
          if (!wanted || (keys && Array.from(keys).some(function (key) { return wanted.has(key); }))) outputs.push(stringValues(property.value, nodeScopes.get(property.value), seen));
        });
      });
      return outputs.length ? mergeValues(outputs) : null;
    }
    return null;
  }
  function propertyValues(member) {
    return member.computed ? stringValues(member.property, nodeScopes.get(member.property), new Set()) : new Set([member.property.name]);
  }
  function memberPaths(node) {
    if (isWindow(node, nodeScopes.get(node), new Set())) return [[]];
    if (!node || node.type !== "MemberExpression") return null;
    if (isGlobalIdentifier(node.object, new Set(["Window"]))) {
      var constructorProperties = propertyValues(node);
      if (constructorProperties && constructorProperties.size === 1 && constructorProperties.has("prototype")) return [["prototype"]];
    }
    var bases = memberPaths(node.object);
    if (!bases) return null;
    var properties = propertyValues(node);
    if (!properties) return bases.map(function (base) { return base.concat([null]); });
    var paths = [];
    bases.forEach(function (base) { properties.forEach(function (property) { paths.push(base.concat([property])); }); });
    return paths;
  }
  function allowedName(name) { return name === "loft" || vendorCaptures.has(name) || (typeof name === "string" && name.indexOf("__") === 0 && name !== "__proto__"); }
  var violations = [];
  function add(node, kind, name, message, force) {
    if (!force && allowedName(name)) return;
    violations.push({ file: file, line: node.loc.start.line, kind: kind, name: name, message: message || (name === null ? "unclassified dynamic Window write" : "public Window write: " + name) });
  }
  function auditPath(node, kind, path, appendedName) {
    var full = path.slice();
    if (appendedName !== undefined) full.push(appendedName);
    var prototypeIndex = full.findIndex(function (part) { return part === "__proto__" || part === "prototype"; });
    if (prototypeIndex >= 0) {
      add(node, kind, full[full.length - 1] || null, "inherited Window surface write", true);
      return;
    }
    // Mutating a member of an ordinary Window-owned object does not add or replace Window
    // surface. Prototype traversal above is different: it changes inherited global lookup.
    if (full.length > 1) return;
    add(node, kind, full.length ? full[0] : null);
  }
  function auditTarget(node, kind) {
    if (!node) return;
    if (node.type === "VariableDeclaration") { node.declarations.forEach(function (declaration) { auditTarget(declaration.id, kind); }); return; }
    if (node.type === "MemberExpression") {
      var paths = memberPaths(node);
      if (paths) paths.forEach(function (path) { auditPath(node, kind, path); });
      return;
    }
    if (node.type === "ArrayPattern") { node.elements.forEach(function (entry) { auditTarget(entry, kind); }); return; }
    if (node.type === "ObjectPattern") { node.properties.forEach(function (property) { auditTarget(property.type === "RestElement" ? property.argument : property.value, kind); }); return; }
    if (node.type === "AssignmentPattern" || node.type === "RestElement") auditTarget(node.left || node.argument, kind);
  }
  function directMethod(node, seen) {
    if (!node) return null;
    if (node.type === "Identifier") {
      var found = bindingOf(node), result = null;
      if (!found || (seen = seen || new Set()).has(found)) return null;
      if (found.destructuredMethod) {
        var destructuredOwner = metaOwner(found.destructuredMethod.owner, nodeScopes.get(found.destructuredMethod.owner), new Set());
        var destructuredNames = found.destructuredMethod.computed ? stringValues(found.destructuredMethod.key, nodeScopes.get(found.destructuredMethod.key), new Set()) : new Set([found.destructuredMethod.key.name || found.destructuredMethod.key.value]);
        if (destructuredOwner && destructuredNames && destructuredNames.size === 1) return destructuredOwner + "." + Array.from(destructuredNames)[0];
      }
      seen.add(found);
      found.sources.some(function (sourceRef) { result = directMethod(sourceRef.node, seen); return !!result; });
      seen.delete(found);
      return result;
    }
    if (node.type !== "MemberExpression") return null;
    var owner = metaOwner(node.object, nodeScopes.get(node.object), new Set()), names = propertyValues(node);
    return owner && names && names.size === 1 ? owner + "." + Array.from(names)[0] : null;
  }
  function operation(node) {
    var method = directMethod(node.callee, new Set()), args = node.arguments;
    if (method) return { method: method, args: args };
    if (node.callee.type !== "MemberExpression") return null;
    var suffixes = propertyValues(node.callee);
    if (!suffixes || suffixes.size !== 1) return null;
    var suffix = Array.from(suffixes)[0], base = directMethod(node.callee.object, new Set());
    if (!base || (suffix !== "call" && suffix !== "apply")) return null;
    if (suffix === "call") return { method: base, args: args.slice(1) };
    if (args[1] && args[1].type === "ArrayExpression") return { method: base, args: args[1].elements };
    return { method: base, args: null };
  }
  walk.simple(ast, {
    AssignmentExpression: function (node) { auditTarget(node.left, "assignment"); },
    UpdateExpression: function (node) { auditTarget(node.argument, "update"); },
    UnaryExpression: function (node) { if (node.operator === "delete") auditTarget(node.argument, "delete"); },
    ForInStatement: function (node) { auditTarget(node.left, "for-in"); },
    ForOfStatement: function (node) { auditTarget(node.left, "for-of"); },
    CallExpression: function (node) {
      var op = operation(node);
      if (!op || !["Object.assign", "Object.defineProperty", "Object.defineProperties", "Object.setPrototypeOf", "Reflect.set", "Reflect.defineProperty", "Reflect.deleteProperty", "Reflect.setPrototypeOf"].includes(op.method)) return;
      if (!op.args) { add(node, op.method + ".apply", null); return; }
      var targetPaths = memberPaths(op.args[0]);
      if (!targetPaths) return;
      if (op.method === "Object.setPrototypeOf" || op.method === "Reflect.setPrototypeOf") {
        targetPaths.forEach(function (targetPath) { add(node, op.method, targetPath[0] || "[[Prototype]]", "Window prototype replacement", true); });
        return;
      }
      if (op.method === "Object.assign") {
        op.args.slice(1).forEach(function (sourceNode) {
          if (!sourceNode || sourceNode.type !== "ObjectExpression") { add(node, op.method, null); return; }
          sourceNode.properties.forEach(function (property) {
            var names = property.type === "SpreadElement" ? null : (property.computed ? stringValues(property.key, nodeScopes.get(property.key), new Set()) : new Set([property.key.name || property.key.value]));
            if (!names) { add(property, op.method, null); return; }
            targetPaths.forEach(function (targetPath) { names.forEach(function (name) { auditPath(property, op.method, targetPath, name); }); });
          });
        });
        return;
      }
      if (op.method === "Object.defineProperties") {
        var descriptors = op.args[1];
        if (!descriptors || descriptors.type !== "ObjectExpression") { add(node, op.method, null); return; }
        descriptors.properties.forEach(function (property) {
          var names = property.computed ? stringValues(property.key, nodeScopes.get(property.key), new Set()) : new Set([property.key.name || property.key.value]);
          if (!names) { add(property, op.method, null); return; }
          targetPaths.forEach(function (targetPath) { names.forEach(function (name) { auditPath(property, op.method, targetPath, name); }); });
        });
        return;
      }
      var names = stringValues(op.args[1], nodeScopes.get(op.args[1]), new Set());
      if (!names) { add(node, op.method, null); return; }
      targetPaths.forEach(function (targetPath) { names.forEach(function (name) { auditPath(node, op.method, targetPath, name); }); });
    }
  });
  return violations;
}

function authoredSources(root) {
  var html = fs.readFileSync(path.join(root, "loft-day.html"), "utf8"), files = [];
  var scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, match, inline = 0;
  while ((match = scriptRe.exec(html))) {
    var src = match[1].match(/\bsrc=["']([^"']+)["']/i);
    if (src) {
      var relative = src[1].split(/[?#]/)[0];
      if (!/^[a-z]+:/i.test(relative)) files.push({ name: relative, source: fs.readFileSync(path.join(root, relative), "utf8") });
    } else files.push({ name: "loft-day.html#inline-" + (++inline), source: match[2] });
  }
  return files;
}

function main() {
  var root = path.join(__dirname, ".."), violations = [];
  authoredSources(root).forEach(function (file) { violations = violations.concat(auditSource(file.source, file.name.replace(/#inline-\d+$/, "") === "loft-day.html" ? "loft-day.html" : file.name)); });
  var fixtureDir = path.join(__dirname, "fixtures", "global-audit");
  var fixtures = fs.readdirSync(fixtureDir).filter(function (name) { return /\.js$/.test(name); }).sort();
  var expected = {
    "alias-baseline.js": "open", "assign.js": "rogueAssign", "computed.js": "rogueComputed",
    "define-properties.js": "rogueDefinedMany", "define-property-apply.js": "rogueApply",
    "define-property-call.js": "rogueCall", "define-property.js": "rogueDefined",
    "delete.js": "fetch", "destructured-meta.js": "rogueDestructuredMeta", "destructuring.js": "rogueDestructured",
    "duplicate-scope-alias.js": "rogueDuplicate", "dynamic-helper.js": null, "dynamic.js": null,
    "for-in.js": "rogueForIn", "for-of.js": "rogueForOf", "nested-shadow.js": "rogueShadowed",
    "prototype-chain.js": "roguePrototype", "reflect.js": "rogueReflected"
  };
  var fixtureFailures = [];
  fixtures.forEach(function (name) {
    var found = auditSource(fs.readFileSync(path.join(fixtureDir, name), "utf8"), name);
    var passed = name === "allowed.js" ? found.length === 0 : Object.prototype.hasOwnProperty.call(expected, name) && found.some(function (violation) { return violation.name === expected[name]; });
    if (!passed) fixtureFailures.push({ fixture: name, expected: expected[name], violations: found });
  });
  console.log("Loft static Window audit:");
  if (violations.length) violations.forEach(function (entry) { console.log("  ✗ " + entry.file + ":" + entry.line + " " + entry.kind + " " + (entry.name === null ? "<dynamic>" : entry.name)); });
  else console.log("  ✓ authored sources contain no public or unclassified dynamic Window writes");
  if (fixtureFailures.length) fixtureFailures.forEach(function (entry) { console.log("  ✗ hostile fixture classification: " + JSON.stringify(entry)); });
  else console.log("  ✓ hostile fixtures cover lexical shadows, aliases, loops, prototype chains, dynamic keys, assignments, destructuring, Object meta-writes, Reflect, and delete");
  console.log("  ✓ parser: Node-bundled Acorn " + acorn.version + " (zero network)");
  if (violations.length || fixtureFailures.length) process.exit(1);
  console.log("All static Window audit checks passed.");
}

if (require.main === module) main();
module.exports = { auditSource: auditSource, authoredSources: authoredSources };
