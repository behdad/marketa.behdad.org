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

function propertyName(node, constants) {
  if (!node) return null;
  if (node.type === "Literal" && typeof node.value === "string") return node.value;
  if (node.type === "TemplateLiteral" && node.expressions.length === 0) return node.quasis[0].value.cooked;
  if (node.type === "Identifier" && constants.has(node.name)) return constants.get(node.name);
  if (node.type === "BinaryExpression" && node.operator === "+") {
    var left = propertyName(node.left, constants);
    if (typeof left === "string" && left.indexOf("__") === 0) return "__*";
  }
  return null;
}
function memberProperty(node, constants) {
  if (!node || node.type !== "MemberExpression") return null;
  return node.computed ? propertyName(node.property, constants) : node.property.name;
}
function allowedName(name) { return name === "loft" || (typeof name === "string" && name.indexOf("__") === 0); }

function auditSource(source, file) {
  var ast;
  try { ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script", locations: true, allowHashBang: true }); }
  catch (error) { return [{ file: file, line: error.loc && error.loc.line || 0, kind: "parse", name: null, message: error.message }]; }
  var declarations = new Map();
  function countPattern(pattern) {
    if (!pattern) return;
    if (pattern.type === "Identifier") declarations.set(pattern.name, (declarations.get(pattern.name) || 0) + 1);
    else if (pattern.type === "ArrayPattern") pattern.elements.forEach(countPattern);
    else if (pattern.type === "ObjectPattern") pattern.properties.forEach(function (property) { countPattern(property.type === "RestElement" ? property.argument : property.value); });
    else if (pattern.type === "AssignmentPattern" || pattern.type === "RestElement") countPattern(pattern.left || pattern.argument);
  }
  walk.simple(ast, {
    VariableDeclarator: function (node) { countPattern(node.id); },
    FunctionDeclaration: function (node) { countPattern(node.id); node.params.forEach(countPattern); },
    FunctionExpression: function (node) { countPattern(node.id); node.params.forEach(countPattern); },
    ArrowFunctionExpression: function (node) { node.params.forEach(countPattern); },
    ClassDeclaration: function (node) { countPattern(node.id); }
  });
  var windowAliases = new Set();
  var objectAliases = new Map([["Object", "Object"], ["Reflect", "Reflect"]]);
  var methodAliases = new Map(), constants = new Map();
  var changed = true;
  function aliasOf(node) {
    if (!(node && node.type === "Identifier")) return false;
    if (["window", "globalThis", "self"].includes(node.name) && !declarations.has(node.name)) return true;
    return windowAliases.has(node.name);
  }
  function objectAlias(node) { return node && node.type === "Identifier" && objectAliases.get(node.name); }
  while (changed) {
    changed = false;
    walk.simple(ast, {
      VariableDeclarator: function (node) {
        if (node.id.type === "Identifier") {
          if ((declarations.get(node.id.name) || 0) === 1 && aliasOf(node.init) && !windowAliases.has(node.id.name)) { windowAliases.add(node.id.name); changed = true; }
          var owner = objectAlias(node.init);
          if ((declarations.get(node.id.name) || 0) === 1 && owner && !objectAliases.has(node.id.name)) { objectAliases.set(node.id.name, owner); changed = true; }
          if (node.init && (node.init.type === "Literal" || (node.init.type === "TemplateLiteral" && node.init.expressions.length === 0))) {
            var value = propertyName(node.init, constants);
            if ((declarations.get(node.id.name) || 0) === 1 && value !== null && !constants.has(node.id.name)) { constants.set(node.id.name, value); changed = true; }
          }
          if (node.init && node.init.type === "MemberExpression") {
            var base = objectAlias(node.init.object), method = memberProperty(node.init, constants);
            if ((declarations.get(node.id.name) || 0) === 1 && base && method && !methodAliases.has(node.id.name)) { methodAliases.set(node.id.name, base + "." + method); changed = true; }
          }
        } else if (node.id.type === "ObjectPattern") {
          var destructuredOwner = objectAlias(node.init);
          if (destructuredOwner) node.id.properties.forEach(function (property) {
            if (property.type !== "Property" || property.value.type !== "Identifier") return;
            var method = propertyName(property.key, constants) || (!property.computed && property.key.name);
            if ((declarations.get(property.value.name) || 0) === 1 && method && !methodAliases.has(property.value.name)) { methodAliases.set(property.value.name, destructuredOwner + "." + method); changed = true; }
          });
        }
      },
      AssignmentExpression: function (node) {
        if (node.operator === "=" && node.left.type === "Identifier" && (declarations.get(node.left.name) || 0) === 1 && aliasOf(node.right) && !windowAliases.has(node.left.name)) { windowAliases.add(node.left.name); changed = true; }
      }
    });
  }
  var violations = [];
  var functionRanges = [];
  walk.simple(ast, {
    FunctionDeclaration: function (node) { if (node.id) functionRanges.push({ start: node.start, end: node.end, name: node.id.name }); },
    FunctionExpression: function (node) { if (node.id) functionRanges.push({ start: node.start, end: node.end, name: node.id.name }); },
    VariableDeclarator: function (node) { if (node.id.type === "Identifier" && node.init && (node.init.type === "FunctionExpression" || node.init.type === "ArrowFunctionExpression")) functionRanges.push({ start: node.init.start, end: node.init.end, name: node.id.name }); }
  });
  function containingFunction(node) {
    var found = null;
    functionRanges.forEach(function (range) { if (range.start <= node.start && range.end >= node.end && (!found || range.end - range.start < found.end - found.start)) found = range; });
    return found && found.name || null;
  }
  function add(node, kind, name, message) {
    if (allowedName(name)) return;
    violations.push({ file: file, line: node.loc.start.line, functionName: containingFunction(node), kind: kind, name: name, message: message || (name === null ? "unclassified dynamic Window write" : "public Window write: " + name) });
  }
  function windowMember(node) { return node && node.type === "MemberExpression" && aliasOf(node.object); }
  function auditTarget(node, kind) {
    if (!node) return;
    if (windowMember(node)) { add(node, kind, memberProperty(node, constants)); return; }
    if (node.type === "ArrayPattern") { node.elements.forEach(function (entry) { auditTarget(entry, kind); }); return; }
    if (node.type === "ObjectPattern") { node.properties.forEach(function (property) { auditTarget(property.type === "RestElement" ? property.argument : property.value, kind); }); return; }
    if (node.type === "AssignmentPattern" || node.type === "RestElement") auditTarget(node.left || node.argument, kind);
  }
  function callMethod(callee) {
    if (callee.type === "Identifier") return methodAliases.get(callee.name) || null;
    if (callee.type !== "MemberExpression") return null;
    var owner = objectAlias(callee.object), method = memberProperty(callee, constants);
    return owner && method ? owner + "." + method : null;
  }
  walk.ancestor(ast, {
    AssignmentExpression: function (node) { auditTarget(node.left, "assignment"); },
    UpdateExpression: function (node) { auditTarget(node.argument, "update"); },
    UnaryExpression: function (node) { if (node.operator === "delete") auditTarget(node.argument, "delete"); },
    CallExpression: function (node, ancestors) {
      var method = callMethod(node.callee);
      if (!["Object.assign", "Object.defineProperty", "Object.defineProperties", "Reflect.set", "Reflect.defineProperty", "Reflect.deleteProperty"].includes(method)) return;
      if (!aliasOf(node.arguments[0])) return;
      if (method === "Object.assign") {
        node.arguments.slice(1).forEach(function (sourceNode) {
          if (!sourceNode || sourceNode.type !== "ObjectExpression") { add(node, method, null); return; }
          sourceNode.properties.forEach(function (property) {
            if (property.type === "SpreadElement") add(property, method, null);
            else add(property, method, propertyName(property.key, constants) || (!property.computed && property.key.name));
          });
        });
        return;
      }
      if (method === "Object.defineProperties") {
        var descriptors = node.arguments[1];
        if (!descriptors || descriptors.type !== "ObjectExpression") { add(node, method, null); return; }
        descriptors.properties.forEach(function (property) { add(property, method, propertyName(property.key, constants) || (!property.computed && property.key.name)); });
        return;
      }
      add(node, method, propertyName(node.arguments[1], constants));
    }
  });
  // Narrow reviewed dynamic-private owners. Their parameters are finite private/vendor names at
  // every call site; all other unresolved dynamic Window writes fail closed.
  var dynamicPrivateOwners = new Set(["captureLazyScriptGlobal", "setOfficeProgress", "installMonitorKillRegistryHooks", "exposePrivateFunction"]);
  violations = violations.filter(function (violation) {
    return !(violation.name === null && file === "loft-day.html" && dynamicPrivateOwners.has(violation.functionName));
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
  var expected = { "alias-baseline.js": "open", "assign.js": "rogueAssign", "computed.js": "rogueComputed",
    "define-properties.js": "rogueDefinedMany", "define-property.js": "rogueDefined", "delete.js": "fetch",
    "destructuring.js": "rogueDestructured", "dynamic.js": null, "reflect.js": "rogueReflected" };
  var fixtureFailures = [];
  fixtures.forEach(function (name) {
    var found = auditSource(fs.readFileSync(path.join(fixtureDir, name), "utf8"), name);
    var passed = name === "allowed.js" ? found.length === 0 : found.some(function (violation) { return violation.name === expected[name]; });
    if (!passed) fixtureFailures.push({ fixture: name, expected: expected[name], violations: found });
  });
  console.log("Loft static Window audit:");
  if (violations.length) violations.forEach(function (entry) { console.log("  ✗ " + entry.file + ":" + entry.line + " " + entry.kind + " " + (entry.name === null ? "<dynamic>" : entry.name)); });
  else console.log("  ✓ authored sources contain no public or unclassified dynamic Window writes");
  if (fixtureFailures.length) fixtureFailures.forEach(function (entry) { console.log("  ✗ hostile fixture classification: " + JSON.stringify(entry)); });
  else console.log("  ✓ hostile fixtures cover aliases, baseline replacement, computed/destructuring writes, Object meta-writes, Reflect, assign, and delete");
  console.log("  ✓ parser: Node-bundled Acorn " + acorn.version + " (zero network)");
  if (violations.length || fixtureFailures.length) process.exit(1);
  console.log("All static Window audit checks passed.");
}

if (require.main === module) main();
module.exports = { auditSource: auditSource, authoredSources: authoredSources };
