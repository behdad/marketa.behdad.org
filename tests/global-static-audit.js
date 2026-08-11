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

function emptyValue() { return { origins: new Set(), strings: new Set(), callables: [], objects: [], arrays: [], unknown: false }; }
function unknownValue() { var value = emptyValue(); value.unknown = true; return value; }
function originValue(origin) { var value = emptyValue(); value.origins.add(origin); return value; }
function stringValue(text) { var value = emptyValue(); value.strings.add(text); return value; }
function mergeValues(values) {
  var merged = emptyValue();
  values.forEach(function (value) {
    if (!value) { merged.unknown = true; return; }
    value.origins.forEach(function (origin) { merged.origins.add(origin); });
    value.strings.forEach(function (text) { merged.strings.add(text); });
    value.callables.forEach(function (callable) { if (merged.callables.indexOf(callable) < 0) merged.callables.push(callable); });
    value.objects.forEach(function (object) { if (merged.objects.indexOf(object) < 0) merged.objects.push(object); });
    value.arrays.forEach(function (array) { if (merged.arrays.indexOf(array) < 0) merged.arrays.push(array); });
    if (value.unknown) merged.unknown = true;
  });
  return merged;
}

function lexicalModel(ast) {
  var nodeScopes = new WeakMap(), nodeParents = new WeakMap(), functionBindings = new WeakMap(), forcedStrictFunctions = new WeakSet(), globalDeclarations = [], memberAssignments = [], scopes = [], nextBindingId = 1;
  var programStrict = ast.body.some(function (node) { return node.type === "ExpressionStatement" && node.directive === "use strict"; });
  function makeScope(parent, type, thisWindow) { var scope = { parent: parent, type: type, bindings: new Map(), thisWindow: thisWindow === undefined ? !!(parent && parent.thisWindow) : thisWindow, strict: !!(parent && parent.strict), functionInfo: null }; scopes.push(scope); return scope; }
  var programScope = makeScope(null, "program");
  programScope.thisWindow = true;
  programScope.strict = programStrict;
  function nearestVarScope(scope) { while (scope.parent && scope.type !== "function" && scope.type !== "program") scope = scope.parent; return scope; }
  function ensure(scope, name) {
    if (!scope.bindings.has(name)) scope.bindings.set(name, { id: nextBindingId++, name: name, scope: scope, sources: [], memberSources: new Map(), functionNode: null, params: null, indirect: false });
    return scope.bindings.get(name);
  }
  function resolve(scope, name) { while (scope) { if (scope.bindings.has(name)) return scope.bindings.get(name); scope = scope.parent; } return null; }
  function markPattern(pattern, useScope, declarationScope, paramOwner, paramIndex) {
    if (!pattern) return;
    nodeScopes.set(pattern, useScope);
    if (pattern.type === "Identifier") {
      var found = ensure(declarationScope, pattern.name);
      if (paramOwner) { found.paramOwner = paramOwner; found.paramIndex = paramIndex; }
      return;
    }
    if (pattern.type === "RestElement") { markPattern(pattern.argument, useScope, declarationScope, paramOwner, paramIndex); return; }
    if (pattern.type === "AssignmentPattern") { markPattern(pattern.left, useScope, declarationScope, paramOwner, paramIndex); scan(pattern.right, useScope); return; }
    if (pattern.type === "ArrayPattern") { pattern.elements.forEach(function (entry) { markPattern(entry, useScope, declarationScope, paramOwner, paramIndex); }); return; }
    if (pattern.type === "ObjectPattern") pattern.properties.forEach(function (property) {
      nodeScopes.set(property, useScope);
      if (property.computed) scan(property.key, useScope);
      markPattern(property.type === "RestElement" ? property.argument : property.value, useScope, declarationScope, paramOwner, paramIndex);
    });
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
    nodeScopes.set(node, outerScope);
    var functionInfo = outerBinding || { name: "<anonymous>", sources: [], functionNode: node, indirect: false };
    var ownStrict = outerScope.strict || forcedStrictFunctions.has(node) || !!(node.body && node.body.type === "BlockStatement" && node.body.body.some(function (entry) { return entry.type === "ExpressionStatement" && entry.directive === "use strict"; }));
    var functionScope = makeScope(outerScope, "function", node.type === "ArrowFunctionExpression" ? outerScope.thisWindow : false), params = [];
    functionScope.strict = ownStrict;
    functionScope.functionInfo = functionInfo;
    if (node.type === "FunctionExpression" && node.id) { nodeScopes.set(node.id, functionScope); ensure(functionScope, node.id.name).functionNode = node; }
    node.params.forEach(function (param, index) {
      markPattern(param, functionScope, functionScope, node, index);
      if (param.type === "Identifier") params[index] = resolve(functionScope, param.name);
    });
    functionInfo.functionNode = node; functionInfo.params = params; functionInfo.paramPatterns = node.params;
    functionInfo.strict = ownStrict; functionInfo.arrow = node.type === "ArrowFunctionExpression"; functionInfo.thisSources = [];
    functionBindings.set(node, functionInfo);
    scan(node.body, functionScope);
  }
  function scan(node, scope) {
    if (!node) return;
    nodeScopes.set(node, scope);
    if (node.type === "Program") { node.body.forEach(function (child) { scan(child, scope); }); return; }
    if (node.type === "BlockStatement") { var block = makeScope(scope, "block"); node.body.forEach(function (child) { scan(child, block); }); return; }
    if (node.type === "FunctionDeclaration") {
      var functionBinding = node.id ? ensure(scope, node.id.name) : null;
      if (node.id) nodeScopes.set(node.id, scope);
      var reachesProgram = scope, crossesFunction = false;
      while (reachesProgram && reachesProgram !== programScope) { if (reachesProgram.type === "function") crossesFunction = true; reachesProgram = reachesProgram.parent; }
      if (node.id && (scope === programScope || (!programStrict && reachesProgram === programScope && !crossesFunction))) globalDeclarations.push({ node: node, name: node.id.name, kind: scope === programScope ? "function declaration" : "Annex-B block function" });
      scanFunction(node, scope, functionBinding);
      return;
    }
    if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") { scanFunction(node, scope, null); return; }
    if (node.type === "VariableDeclaration") {
      var declarationScope = node.kind === "var" ? nearestVarScope(scope) : scope;
      node.declarations.forEach(function (declaration) {
        nodeScopes.set(declaration, scope);
        markPattern(declaration.id, scope, declarationScope, null, null);
        if (declaration.init) scan(declaration.init, scope);
        if (declarationScope === programScope) collectPatternNames(declaration.id).forEach(function (name) { globalDeclarations.push({ node: declaration, name: name, kind: node.kind + " declaration" }); });
      });
      return;
    }
    if (node.type === "ClassDeclaration") {
      if (node.id) { nodeScopes.set(node.id, scope); ensure(scope, node.id.name); if (scope === programScope) globalDeclarations.push({ node: node, name: node.id.name, kind: "class declaration" }); }
      scanChildren(node, scope, { id: true });
      return;
    }
    if (node.type === "MethodDefinition") {
      if (node.computed) scan(node.key, scope);
      forcedStrictFunctions.add(node.value); scan(node.value, scope);
      return;
    }
    if (node.type === "CatchClause") { var catchScope = makeScope(scope, "block"); markPattern(node.param, catchScope, catchScope, null, null); scan(node.body, catchScope); return; }
    if (node.type === "ForStatement") {
      var forScope = makeScope(scope, "loop");
      scan(node.init, forScope); scan(node.test, forScope); scan(node.update, forScope); scan(node.body, forScope);
      return;
    }
    if (node.type === "ForInStatement" || node.type === "ForOfStatement") {
      var iterationScope = makeScope(scope, "loop");
      scan(node.left, iterationScope); scan(node.right, iterationScope); scan(node.body, iterationScope);
      return;
    }
    if (node.type === "SwitchStatement") {
      var switchScope = makeScope(scope, "switch");
      scan(node.discriminant, scope);
      node.cases.forEach(function (switchCase) { nodeScopes.set(switchCase, switchScope); scan(switchCase.test, switchScope); switchCase.consequent.forEach(function (entry) { scan(entry, switchScope); }); });
      return;
    }
    scanChildren(node, scope);
  }
  function collectPatternNames(pattern) {
    var names = [];
    (function collect(node) {
      if (!node) return;
      if (node.type === "Identifier") { names.push(node.name); return; }
      if (node.type === "RestElement") { collect(node.argument); return; }
      if (node.type === "AssignmentPattern") { collect(node.left); return; }
      if (node.type === "ArrayPattern") { node.elements.forEach(collect); return; }
      if (node.type === "ObjectPattern") node.properties.forEach(function (property) { collect(property.type === "RestElement" ? property.argument : property.value); });
    })(pattern);
    return names;
  }
  scan(ast, programScope);
  walk.fullAncestor(ast, function (node, _state, ancestors) {
    if (ancestors.length > 1) nodeParents.set(node, ancestors[ancestors.length - 2]);
  });

  function ref(node, scope) { return { node: node, scope: scope || nodeScopes.get(node), path: [] }; }
  function projected(source, part) { return { node: source.node, scope: source.scope, path: source.path.concat([part]) }; }
  function alternatives(sources) { return { alternatives: sources }; }
  function recordPattern(pattern, source, implicit) {
    if (!pattern) return;
    if (pattern.type === "Identifier") {
      var found = resolve(nodeScopes.get(pattern), pattern.name);
      if (found) found.sources.push(source);
      else if (implicit) implicit.push({ node: pattern, name: pattern.name, kind: implicit.kind });
      return;
    }
    if (pattern.type === "RestElement") { recordPattern(pattern.argument, source && (source.argumentItems || source.slice) ? source : { rest: source }, implicit); return; }
    if (pattern.type === "AssignmentPattern") { recordPattern(pattern.left, source && source.absent ? ref(pattern.right) : alternatives([source, ref(pattern.right)]), implicit); return; }
    if (pattern.type === "ArrayPattern") { pattern.elements.forEach(function (entry, index) {
      if (entry && entry.type === "RestElement") recordPattern(entry.argument, { slice: source, start: index }, implicit);
      else recordPattern(entry, projected(source, { type: "index", value: index }), implicit);
    }); return; }
    if (pattern.type === "ObjectPattern") pattern.properties.forEach(function (property) {
      if (property.type === "RestElement") recordPattern(property.argument, { rest: source }, implicit);
      else {
        var key = property.computed ? { type: "computed", node: property.key, scope: nodeScopes.get(property.key) } : { type: "key", value: property.key.name || property.key.value };
        recordPattern(property.value, projected(source, key), implicit);
      }
    });
  }
  var implicitWrites = [];
  walk.simple(ast, {
    VariableDeclarator: function (node) { if (node.init) recordPattern(node.id, ref(node.init), null); },
    AssignmentExpression: function (node) {
      var marker = implicitWrites; marker.kind = "assignment";
      recordPattern(node.left, node.operator === "=" ? ref(node.right) : { unknown: true }, marker);
      if (node.operator === "=" && node.left.type === "MemberExpression" && node.left.object.type === "Identifier") {
        var owner = resolve(nodeScopes.get(node.left.object), node.left.object.name), member = fixedMemberName(node.left);
        if (owner && member !== null) {
          if (!owner.memberSources.has(member)) owner.memberSources.set(member, []);
          owner.memberSources.get(member).push(ref(node.right));
        }
      }
      if (node.operator === "=" && node.left.type === "MemberExpression" && fixedMemberName(node.left) !== null) memberAssignments.push({ node: node, owner: node.left.object, name: fixedMemberName(node.left), source: ref(node.right) });
    },
    UpdateExpression: function (node) { var marker = implicitWrites; marker.kind = "update"; recordPattern(node.argument, { unknown: true }, marker); },
    ForOfStatement: function (node) {
      var marker = implicitWrites; marker.kind = "for-of";
      var target = node.left.type === "VariableDeclaration" ? node.left.declarations[0].id : node.left;
      recordPattern(target, { iterable: ref(node.right), kind: "values" }, marker);
    },
    ForInStatement: function (node) {
      var marker = implicitWrites; marker.kind = "for-in";
      var target = node.left.type === "VariableDeclaration" ? node.left.declarations[0].id : node.left;
      recordPattern(target, { iterable: ref(node.right), kind: "keys" }, marker);
    }
  });
  function arrayItems(node, seen) {
    if (!node) return null;
    if (node.type === "ArrayExpression") {
      var items = [];
      for (var i = 0; i < node.elements.length; i++) {
        var entry = node.elements[i];
        if (!entry) { items.push({ unknown: true }); continue; }
        if (entry.type === "SpreadElement") { var spread = arrayItems(entry.argument, seen); if (!spread) return null; items = items.concat(spread); }
        else items.push(ref(entry));
      }
      return items;
    }
    if (node.type === "Identifier") {
      var found = resolve(nodeScopes.get(node), node.name);
      if (!found || (seen = seen || new Set()).has(found) || !found.sources.length) return null;
      seen.add(found);
      var combined = [], valid = true;
      found.sources.forEach(function (sourceRef) {
        if (!sourceRef.node || (sourceRef.path && sourceRef.path.length)) { valid = false; return; }
        var values = arrayItems(sourceRef.node, seen); if (!values) valid = false; else combined = combined.concat(values);
      });
      seen.delete(found);
      return valid ? combined : null;
    }
    return null;
  }
  function expandedArguments(args) {
    var expanded = [];
    args.forEach(function (argument) {
      if (argument.type !== "SpreadElement") expanded.push(ref(argument));
      else { var spread = arrayItems(argument.argument, new Set()); expanded = expanded.concat(spread || [{ hazard: true }]); }
    });
    return expanded;
  }
  function fixedStrings(node, seen) {
    if (!node) return null;
    if (node.type === "Literal" && (typeof node.value === "string" || typeof node.value === "number")) return new Set([String(node.value)]);
    if (node.type === "TemplateLiteral") {
      var templateValues = new Set([node.quasis[0].value.cooked]);
      for (var templateIndex = 0; templateIndex < node.expressions.length; templateIndex++) {
        var expressionValues = fixedStrings(node.expressions[templateIndex], seen), nextTemplateValues = new Set();
        if (!expressionValues) return null;
        templateValues.forEach(function (left) { expressionValues.forEach(function (right) { nextTemplateValues.add(left + right + node.quasis[templateIndex + 1].value.cooked); }); });
        templateValues = nextTemplateValues;
      }
      return templateValues;
    }
    if (node.type === "BinaryExpression" && node.operator === "+") {
      var leftValues = fixedStrings(node.left, seen), rightValues = fixedStrings(node.right, seen), binaryValues = new Set();
      if (!leftValues || !rightValues) return null;
      leftValues.forEach(function (left) { rightValues.forEach(function (right) { binaryValues.add(left + right); }); });
      return binaryValues;
    }
    if (node.type === "ConditionalExpression" || node.type === "LogicalExpression") {
      var firstValues = fixedStrings(node.type === "ConditionalExpression" ? node.consequent : node.left, seen);
      var secondValues = fixedStrings(node.type === "ConditionalExpression" ? node.alternate : node.right, seen);
      if (!firstValues || !secondValues) return null;
      return new Set(Array.from(firstValues).concat(Array.from(secondValues)));
    }
    if (node.type === "SequenceExpression" && node.expressions.length) return fixedStrings(node.expressions[node.expressions.length - 1], seen);
    if (node.type === "AssignmentExpression") return fixedStrings(node.right, seen);
    if (node.type === "Identifier") {
      var found = resolve(nodeScopes.get(node), node.name);
      if (!found || (seen = seen || new Set()).has(found) || !found.sources.length) return null;
      seen.add(found);
      var values = found.sources.map(function (sourceRef) { return sourceRef.node && !(sourceRef.path && sourceRef.path.length) ? fixedStrings(sourceRef.node, seen) : null; });
      seen.delete(found);
      if (!values.length || values.some(function (value) { return value === null; })) return null;
      return new Set([].concat.apply([], values.map(function (value) { return Array.from(value); })));
    }
    return null;
  }
  function fixedString(node, seen) {
    var values = fixedStrings(node, seen);
    return values && values.size === 1 ? Array.from(values)[0] : null;
  }
  function fixedMemberName(node) {
    if (!node || node.type !== "MemberExpression") return null;
    if (!node.computed && node.property.type === "Identifier") return node.property.name;
    if (node.computed) return fixedString(node.property, new Set());
    return null;
  }
  function pathPartName(part) {
    if (part.type === "key" || part.type === "index") return String(part.value);
    if (part.type === "computed") return fixedString(part.node, new Set());
    return null;
  }
  function ownerKeyReference(sourceRef, seen) {
    if (sourceRef && sourceRef.alternatives) {
      var alternativeKeys = sourceRef.alternatives.map(function (alternative) { return ownerKeyReference(alternative, seen); });
      return alternativeKeys.length && alternativeKeys[0] !== null && alternativeKeys.every(function (key) { return key === alternativeKeys[0]; }) ? alternativeKeys[0] : null;
    }
    var key = sourceRef && sourceRef.node ? ownerKey(sourceRef.node, seen) : null;
    if (key === null) return null;
    for (var index = 0; index < (sourceRef.path || []).length; index++) {
      var name = pathPartName(sourceRef.path[index]);
      if (name === null) return null;
      key += "." + name;
    }
    return key;
  }
  function ownerKey(node, seen) {
    if (!node) return null;
    if (node.type === "Identifier") {
      var found = resolve(nodeScopes.get(node), node.name);
      if (found) {
        seen = seen || new Set();
        if (!seen.has(found) && found.sources.length) {
          seen.add(found);
          var sourceKeys = found.sources.map(function (sourceRef) { return ownerKeyReference(sourceRef, seen); });
          seen.delete(found);
          if (sourceKeys.length && sourceKeys[0] !== null && sourceKeys.every(function (key) { return key === sourceKeys[0]; })) return sourceKeys[0];
        }
        return "binding:" + found.id;
      }
      if (node.name === "window" || node.name === "globalThis" || node.name === "self" || node.name === "top" || node.name === "parent" || node.name === "frames") return "window";
      if (node.name === "loft") return "loft";
      if (node.name === "document") return "document";
      if (node.name === "setTimeout" || node.name === "setInterval" || node.name === "addEventListener") return "window." + node.name;
      if (node.name === "Promise") return "promise-constructor";
      return "global:" + node.name;
    }
    if (node.type === "MemberExpression") {
      var base = ownerKey(node.object, seen), name = fixedMemberName(node);
      if (base === null || name === null) return null;
      if (base === "window" && (name === "window" || name === "globalThis" || name === "self" || name === "top" || name === "parent" || name === "frames")) return "window";
      if (base === "window" && name === "loft") return "loft";
      if (base === "window" && name === "document") return "document";
      if (base === "document" && name === "defaultView") return "window";
      return base + "." + name;
    }
    if (node.type === "CallExpression") {
      var calledKey = ownerKey(node.callee, seen);
      if (calledKey && /^promise(?:-constructor\.(?:resolve|reject|all|allSettled|any|race)|\.(?:then|catch|finally))$/.test(calledKey)) return "promise";
      if (calledKey && /\.(?:bind)$/.test(calledKey)) return calledKey.slice(0, -5);
      return null;
    }
    if (node.type === "AssignmentExpression") return ownerKey(node.right, seen);
    if (node.type === "SequenceExpression" && node.expressions.length) return ownerKey(node.expressions[node.expressions.length - 1], seen);
    return null;
  }
  function possibleOwnerKeysReference(sourceRef, seen) {
    if (sourceRef && sourceRef.alternatives) {
      var alternativeKeys = new Set();
      sourceRef.alternatives.forEach(function (alternative) { possibleOwnerKeysReference(alternative, seen).forEach(function (key) { alternativeKeys.add(key); }); });
      return alternativeKeys;
    }
    var keys = sourceRef && sourceRef.node ? possibleOwnerKeys(sourceRef.node, seen) : new Set();
    (sourceRef && sourceRef.path || []).forEach(function (part) {
      var name = pathPartName(part), projectedKeys = new Set();
      if (name !== null) keys.forEach(function (key) { projectedKeys.add(key + "." + name); });
      keys = projectedKeys;
    });
    return keys;
  }
  function possibleOwnerKeys(node, seen) {
    if (!node) return new Set();
    if (node.type === "Identifier") {
      var found = resolve(nodeScopes.get(node), node.name);
      if (found) {
        seen = seen || new Set();
        if (seen.has(found)) return new Set();
        seen.add(found);
        var sourceKeys = new Set();
        found.sources.forEach(function (sourceRef) { possibleOwnerKeysReference(sourceRef, seen).forEach(function (key) { sourceKeys.add(key); }); });
        seen.delete(found);
        if (sourceKeys.size) return sourceKeys;
      }
      var identifierKey = ownerKey(node); return identifierKey === null ? new Set() : new Set([identifierKey]);
    }
    if (node.type === "ConditionalExpression" || node.type === "LogicalExpression") {
      var branchKeys = possibleOwnerKeys(node.type === "ConditionalExpression" ? node.consequent : node.left, seen);
      possibleOwnerKeys(node.type === "ConditionalExpression" ? node.alternate : node.right, seen).forEach(function (key) { branchKeys.add(key); });
      return branchKeys;
    }
    if (node.type === "MemberExpression") {
      var memberName = fixedMemberName(node), memberKeys = new Set();
      if (memberName === null) return memberKeys;
      possibleOwnerKeys(node.object, seen).forEach(function (key) { memberKeys.add(key + "." + memberName); });
      return memberKeys;
    }
    if (node.type === "CallExpression") {
      var callKeys = possibleOwnerKeys(node.callee, seen), resultKeys = new Set();
      callKeys.forEach(function (key) {
        if (/^promise(?:-constructor\.(?:resolve|reject|all|allSettled|any|race)|\.(?:then|catch|finally))$/.test(key)) resultKeys.add("promise");
        else if (/\.bind$/.test(key)) resultKeys.add(key.slice(0, -5));
      });
      return resultKeys;
    }
    if (node.type === "AssignmentExpression") return possibleOwnerKeys(node.right, seen);
    if (node.type === "SequenceExpression" && node.expressions.length) return possibleOwnerKeys(node.expressions[node.expressions.length - 1], seen);
    var key = ownerKey(node, seen); return key === null ? new Set() : new Set([key]);
  }
  function propertyName(property) {
    if (!property || property.type !== "Property") return null;
    if (!property.computed) return String(property.key.name === undefined ? property.key.value : property.key.name);
    if (property.computed) return fixedString(property.key, new Set());
    return null;
  }
  function executionRoot(node) {
    while (node) {
      if (node.type === "Program" || node.type === "FunctionDeclaration" || node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") return node;
      node = nodeParents.get(node);
    }
    return null;
  }
  function staticTruth(node) {
    if (!node) return null;
    if (node.type === "Literal") return !!node.value;
    if (node.type === "UnaryExpression" && node.operator === "!") { var argumentTruth = staticTruth(node.argument); return argumentTruth === null ? null : !argumentTruth; }
    if (node.type === "SequenceExpression" && node.expressions.length) return staticTruth(node.expressions[node.expressions.length - 1]);
    return null;
  }
  function definiteBefore(assignment, readNode) {
    if (!readNode || assignment.start >= readNode.start || executionRoot(assignment) !== executionRoot(readNode)) return false;
    var node = assignment, root = executionRoot(assignment);
    while (node && node !== root) {
      var parent = nodeParents.get(node);
      if (!parent) return false;
      if (parent.type === "IfStatement") {
        var truth = staticTruth(parent.test);
        if ((node === parent.consequent && truth !== true) || (node === parent.alternate && truth !== false) || (node !== parent.consequent && node !== parent.alternate)) return false;
      } else if (parent.type === "ConditionalExpression" || parent.type === "LogicalExpression" || parent.type === "SwitchCase" || parent.type === "SwitchStatement" || parent.type === "TryStatement" || parent.type === "CatchClause" || parent.type === "ForStatement" || parent.type === "ForInStatement" || parent.type === "ForOfStatement" || parent.type === "WhileStatement" || parent.type === "DoWhileStatement") return false;
      node = parent;
    }
    return node === root;
  }
  function possiblyExecutes(assignment) {
    var node = assignment, root = executionRoot(assignment);
    while (node && node !== root) {
      var parent = nodeParents.get(node);
      if (!parent) return true;
      if (parent.type === "IfStatement") {
        var truth = staticTruth(parent.test);
        if ((node === parent.consequent && truth === false) || (node === parent.alternate && truth === true)) return false;
      }
      node = parent;
    }
    return true;
  }
  function memberSourceNodes(memberNode, seen, readNode) {
    var name = fixedMemberName(memberNode), sources = [];
    if (name === null) return sources;
    var wantedOwner = ownerKey(memberNode.object);
    var memberToken = "member:" + String(wantedOwner) + ":" + name;
    if (seen.has(memberToken)) return sources;
    seen.add(memberToken);
    var assignments = wantedOwner === null ? [] : memberAssignments.filter(function (assignment) {
      return assignment.name === name && ownerKey(assignment.owner) === wantedOwner && possiblyExecutes(assignment.node) && (!readNode || assignment.node.start < readNode.start);
    }).sort(function (a, b) { return a.node.start - b.node.start; });
    var lastDefinite = null;
    assignments.forEach(function (assignment) { if (definiteBefore(assignment.node, readNode)) lastDefinite = assignment; });
    function fromContainer(container) {
      if (!container) return;
      if (container.type === "ObjectExpression") container.properties.forEach(function (property) {
        if (propertyName(property) === name) sources.push(property.value);
      });
      else if (container.type === "ArrayExpression" && /^(?:0|[1-9]\d*)$/.test(name)) {
        var entry = container.elements[Number(name)]; if (entry) sources.push(entry.type === "SpreadElement" ? entry.argument : entry);
      } else if (container.type === "Identifier") {
        var owner = resolve(nodeScopes.get(container), container.name);
        if (!owner || seen.has(owner)) return;
        seen.add(owner);
        owner.sources.forEach(function (sourceRef) { if (sourceRef.node && !(sourceRef.path && sourceRef.path.length)) fromContainer(sourceRef.node); });
        seen.delete(owner);
      } else if (container.type === "MemberExpression") memberSourceNodes(container, seen, readNode).forEach(fromContainer);
      else if (container.type === "ConditionalExpression" || container.type === "LogicalExpression") {
        fromContainer(container.type === "ConditionalExpression" ? container.consequent : container.left);
        fromContainer(container.type === "ConditionalExpression" ? container.alternate : container.right);
      } else if (container.type === "SequenceExpression") fromContainer(container.expressions[container.expressions.length - 1]);
      else if (container.type === "AssignmentExpression") fromContainer(container.right);
    }
    if (!lastDefinite) fromContainer(memberNode.object);
    assignments.forEach(function (assignment) {
      if (!lastDefinite || assignment.node.start >= lastDefinite.node.start) sources.push(assignment.source.node);
    });
    return sources;
  }
  function functionDescriptorsAtPath(node, path, seen, readNode) {
    if (!path.length) return functionDescriptors(node, seen, readNode);
    if (!node) return [];
    var part = path[0], name = pathPartName(part), rest = path.slice(1), targets = [];
    if (name === null) return targets;
    function append(sourceNode) {
      functionDescriptorsAtPath(sourceNode, rest, seen, readNode).forEach(function (target) { targets.push(target); });
    }
    if (node.type === "Identifier") {
      var found = resolve(nodeScopes.get(node), node.name);
      if (!found || seen.has(found)) return targets;
      seen.add(found);
      found.sources.forEach(function (sourceRef) { functionDescriptorsFromReference({ node: sourceRef.node, scope: sourceRef.scope, path: (sourceRef.path || []).concat(path) }, seen, readNode).forEach(function (target) { targets.push(target); }); });
      seen.delete(found);
    } else if (node.type === "ObjectExpression") {
      node.properties.forEach(function (property) { if (propertyName(property) === name) append(property.value); });
    } else if (node.type === "ArrayExpression" && /^(?:0|[1-9]\d*)$/.test(name)) {
      var entry = node.elements[Number(name)]; if (entry) append(entry.type === "SpreadElement" ? entry.argument : entry);
    } else if (node.type === "MemberExpression") {
      memberSourceNodes(node, seen, readNode).forEach(function (sourceNode) { functionDescriptorsAtPath(sourceNode, path, seen, readNode).forEach(function (target) { targets.push(target); }); });
    } else if (node.type === "ConditionalExpression" || node.type === "LogicalExpression") {
      functionDescriptorsAtPath(node.type === "ConditionalExpression" ? node.consequent : node.left, path, seen, readNode).forEach(function (target) { targets.push(target); });
      functionDescriptorsAtPath(node.type === "ConditionalExpression" ? node.alternate : node.right, path, seen, readNode).forEach(function (target) { targets.push(target); });
    } else if (node.type === "SequenceExpression" && node.expressions.length) {
      functionDescriptorsAtPath(node.expressions[node.expressions.length - 1], path, seen, readNode).forEach(function (target) { targets.push(target); });
    } else if (node.type === "AssignmentExpression") {
      functionDescriptorsAtPath(node.right, path, seen, readNode).forEach(function (target) { targets.push(target); });
    }
    return targets;
  }
  function functionDescriptorsFromReference(sourceRef, seen, readNode) {
    if (sourceRef && sourceRef.alternatives) {
      var alternativeTargets = [];
      sourceRef.alternatives.forEach(function (alternative) { functionDescriptorsFromReference(alternative, seen, readNode).forEach(function (target) { alternativeTargets.push(target); }); });
      return alternativeTargets;
    }
    if (!sourceRef || !sourceRef.node) return [];
    return functionDescriptorsAtPath(sourceRef.node, sourceRef.path || [], seen, readNode);
  }
  function functionDescriptors(node, seen, readNode) {
    if (!node) return [];
    if (node.type === "FunctionExpression" || node.type === "ArrowFunctionExpression") return [{ target: functionBindings.get(node), boundArgs: [], boundThis: null }];
    if (node.type === "ChainExpression") return functionDescriptors(node.expression, seen, readNode);
    if (node.type === "ConditionalExpression" || node.type === "LogicalExpression") return functionDescriptors(node.type === "ConditionalExpression" ? node.consequent : node.left, seen, readNode).concat(functionDescriptors(node.type === "ConditionalExpression" ? node.alternate : node.right, seen, readNode));
    if (node.type === "SequenceExpression") return functionDescriptors(node.expressions[node.expressions.length - 1], seen, readNode);
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && fixedMemberName(node.callee) === "bind") {
      return functionDescriptors(node.callee.object, seen, readNode).map(function (descriptor) {
        return { target: descriptor.target, boundThis: descriptor.boundThis || (node.arguments[0] ? ref(node.arguments[0]) : { safe: true }), boundArgs: descriptor.boundArgs.concat(expandedArguments(node.arguments.slice(1))) };
      });
    }
    if (node.type === "MemberExpression") {
      var targets = [];
      memberSourceNodes(node, seen, readNode).forEach(function (sourceNode) { functionDescriptors(sourceNode, seen, readNode).forEach(function (target) { targets.push(target); }); });
      return targets;
    }
    if (node.type !== "Identifier") return [];
    var found = resolve(nodeScopes.get(node), node.name);
    if (!found || (seen = seen || new Set()).has(found)) return [];
    if (found.functionNode) return [{ target: functionBindings.get(found.functionNode), boundArgs: [], boundThis: null }];
    seen.add(found);
    var targets = [];
    found.sources.forEach(function (sourceRef) { functionDescriptorsFromReference(sourceRef, seen, readNode).forEach(function (target) { if (target && targets.indexOf(target) < 0) targets.push(target); }); });
    seen.delete(found);
    return targets;
  }
  function functionTargets(node, seen, readNode) { return functionDescriptors(node, seen, readNode).map(function (descriptor) { return descriptor.target; }); }
  function functionTargetsReference(sourceRef, seen, readNode) { return functionDescriptorsFromReference(sourceRef, seen, readNode).map(function (descriptor) { return descriptor.target; }); }
  function iterationName(callee) { return fixedMemberName(callee); }
  var iterationMethods = new Set(["forEach", "map", "filter", "some", "every", "find", "findIndex", "flatMap", "reduce", "reduceRight"]);
  function effectiveThisSource(target, source) {
    if (target.strict) return source;
    if (!source || source.safe || (source.node && ((source.node.type === "Literal" && source.node.value === null) || (source.node.type === "Identifier" && source.node.name === "undefined" && !resolve(nodeScopes.get(source.node), "undefined"))))) return { window: true };
    return source;
  }
  function hostInvocation(node) {
    var keys = possibleOwnerKeys(node.callee, new Set()), args = expandedArguments(node.arguments), suffix = fixedMemberName(node.callee);
    if (node.callee.type === "MemberExpression" && (suffix === "call" || suffix === "apply")) {
      keys = possibleOwnerKeys(node.callee.object, new Set());
      args = suffix === "call" ? expandedArguments(node.arguments.slice(1)) : (node.arguments[1] && arrayItems(node.arguments[1], new Set()) || []);
    }
    if (keys.has("window.setTimeout") || keys.has("window.setInterval")) return { callback: args[0], thisSource: { window: true }, substituteThis: false };
    if (keys.has("window.addEventListener")) return { callback: args[1], thisSource: { window: true }, substituteThis: false };
    if (keys.has("promise.then")) return { callbacks: [args[0], args[1]], thisSource: { safe: true }, substituteThis: true };
    if (keys.has("promise.catch") || keys.has("promise.finally")) return { callbacks: [args[0]], thisSource: { safe: true }, substituteThis: true };
    return null;
  }
  walk.simple(ast, {
    CallExpression: function (node) {
      var callee = node.callee, suffix = fixedMemberName(callee), descriptors, args, explicitThis = null, memberThis = null;
      if (callee.type === "MemberExpression" && (suffix === "call" || suffix === "apply")) {
        descriptors = functionDescriptors(callee.object, new Set(), node);
        explicitThis = node.arguments[0] ? ref(node.arguments[0]) : { safe: true };
        args = suffix === "apply" ? (node.arguments[1] && arrayItems(node.arguments[1], new Set()) || [{ hazard: true }]) : expandedArguments(node.arguments.slice(1));
      } else {
        descriptors = functionDescriptors(callee, new Set(), node);
        args = expandedArguments(node.arguments);
        if (callee.type === "MemberExpression") memberThis = ref(callee.object);
      }
      descriptors.forEach(function (descriptor) {
        var target = descriptor.target, callArgs = descriptor.boundArgs.concat(args), thisSource = effectiveThisSource(target, descriptor.boundThis || explicitThis || memberThis || (target.strict ? { safe: true } : { window: true }));
        target.paramPatterns.forEach(function (pattern, index) {
          if (pattern.type === "RestElement") recordPattern(pattern, { argumentItems: callArgs.slice(index) }, null);
          else recordPattern(pattern, callArgs[index] || { absent: true }, null);
        });
        if (!target.arrow) target.thisSources.push(thisSource);
      });
      var method = iterationName(node.callee), items = method && iterationMethods.has(method) ? arrayItems(node.callee.object, new Set()) : null;
      if (items && node.arguments[0]) functionTargets(node.arguments[0], new Set(), node).forEach(function (target) {
        target.paramPatterns.forEach(function (pattern, index) {
          if (!pattern) return;
          if (method === "reduce" || method === "reduceRight") {
            var reductionSources = items.slice();
            if (node.arguments[1]) reductionSources.push(ref(node.arguments[1]));
            if (index < 2) recordPattern(pattern, { alternatives: reductionSources }, null);
            else if (index === 3) recordPattern(pattern, ref(node.callee.object), null);
          } else if (index === 0) recordPattern(pattern, { alternatives: items }, null);
          else if (index === 2) recordPattern(pattern, ref(node.callee.object), null);
        });
        if (!target.arrow) {
          var callbackThis = method === "reduce" || method === "reduceRight" || !node.arguments[1] ? { safe: true } : ref(node.arguments[1]);
          target.thisSources.push(effectiveThisSource(target, callbackThis));
        }
      });
      var hostCall = hostInvocation(node);
      if (!hostCall && callee.type === "MemberExpression" && fixedMemberName(callee) === "addEventListener") {
        hostCall = { callbacks: [node.arguments[1] && ref(node.arguments[1])], thisSource: ref(callee.object), substituteThis: false };
      }
      if (hostCall) (hostCall.callbacks || [hostCall.callback]).forEach(function (callback) {
        if (callback) functionTargetsReference(callback, new Set(), node).forEach(function (target) {
          if (!target.arrow) target.thisSources.push(hostCall.substituteThis ? effectiveThisSource(target, hostCall.thisSource) : hostCall.thisSource);
        });
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
      if (parent.type === "AssignmentExpression" && parent.right === node) return;
      if (parent.type === "VariableDeclarator" && parent.init === node) return;
      if (parent.type === "CallExpression" && parent.arguments.indexOf(node) >= 0 && iterationMethods.has(iterationName(parent.callee))) return;
      found.indirect = true;
    }
  });
  return { nodeScopes: nodeScopes, resolve: resolve, functionBindings: functionBindings, globalDeclarations: globalDeclarations, implicitWrites: implicitWrites };
}

function auditSource(source, file) {
  var ast;
  try { ast = acorn.parse(source, { ecmaVersion: "latest", sourceType: "script", locations: true, allowHashBang: true }); }
  catch (error) { return [{ file: file, line: error.loc && error.loc.line || 0, kind: "parse", name: null, message: error.message }]; }
  var model = lexicalModel(ast), nodeScopes = model.nodeScopes, resolve = model.resolve;
  var vendorNames = new Set(["turnstile", "loadPyodide", "V86"]);
  var metaMethods = new Set(["Object.assign", "Object.defineProperty", "Object.defineProperties", "Object.setPrototypeOf",
    "Object.getPrototypeOf", "Reflect.set", "Reflect.defineProperty", "Reflect.deleteProperty", "Reflect.setPrototypeOf",
    "Reflect.getPrototypeOf", "Reflect.apply"]);
  var evaluatingBindings = new Set();
  function bindingOf(node) { return node && node.type === "Identifier" ? resolve(nodeScopes.get(node), node.name) : null; }
  function globalIdentifier(node, name) { return node && node.type === "Identifier" && node.name === name && !bindingOf(node); }
  function evalReference(reference) {
    if (!reference || reference.unknown) return unknownValue();
    if (reference.safe) return emptyValue();
    if (reference.window) return originValue("window");
    if (reference.hazard) return originValue("hazard");
    if (reference.argumentItems) { var argumentArray = emptyValue(); argumentArray.arrays.push({ items: reference.argumentItems }); return argumentArray; }
    if (reference.slice) {
      var sliced = emptyValue(), sourceArray = evalReference(reference.slice);
      sourceArray.arrays.forEach(function (arrayRef) { sliced.arrays.push({ items: itemsOfArrayRef(arrayRef).slice(reference.start) }); });
      if (!sliced.arrays.length || sourceArray.unknown) sliced.unknown = true;
      return sliced;
    }
    if (reference.rest) {
      var restBase = evalReference(reference.rest);
      if (restBase.origins.has("object") || restBase.origins.has("reflect") || restBase.origins.has("meta-hazard")) return originValue("meta-hazard");
      return unknownValue();
    }
    if (reference.alternatives) return mergeValues(reference.alternatives.map(evalReference));
    if (reference.iterable) {
      var iterable = evalReference(reference.iterable), parts = [];
      if (reference.kind === "values") iterable.arrays.forEach(function (arrayRef) { arrayRef.node.elements.forEach(function (entry) { if (entry) parts.push(evalExpr(entry, arrayRef.scope)); }); });
      else iterable.objects.forEach(function (objectRef) { objectRef.node.properties.forEach(function (property) { if (property.type === "Property" && !property.computed) parts.push(stringValue(property.key.name || property.key.value)); else parts.push(unknownValue()); }); });
      if (!parts.length || iterable.unknown) parts.push(unknownValue());
      return mergeValues(parts);
    }
    return projectValue(reference.node, reference.scope, reference.path || []);
  }
  function projectValue(node, scope, parts) {
    if (!parts.length) return evalExpr(node, scope);
    var part = parts[0], rest = parts.slice(1), results = [];
    if (node && node.type === "Identifier") {
      var found = resolve(scope || nodeScopes.get(node), node.name);
      if (found && found.sources.length && !evaluatingBindings.has(found)) {
        evaluatingBindings.add(found);
        found.sources.forEach(function (sourceRef) { results.push(projectReference(sourceRef, parts)); });
        evaluatingBindings.delete(found);
        return mergeValues(results);
      }
    }
    if (node && node.type === "ObjectExpression" && part.type !== "index") {
      var wanted = part.type === "key" ? new Set([part.value]) : finiteStrings(evalExpr(part.node, part.scope));
      node.properties.forEach(function (property) {
        if (property.type !== "Property") { results.push(unknownValue()); return; }
        var keys = property.computed ? finiteStrings(evalExpr(property.key, nodeScopes.get(property.key))) : new Set([property.key.name || property.key.value]);
        if (!wanted || !keys || Array.from(keys).some(function (key) { return wanted.has(key); })) results.push(projectValue(property.value, nodeScopes.get(property.value), rest));
      });
      return results.length ? mergeValues(results) : unknownValue();
    }
    if (node && node.type === "ArrayExpression" && part.type === "index") {
      return node.elements[part.value] ? projectValue(node.elements[part.value], nodeScopes.get(node.elements[part.value]), rest) : unknownValue();
    }
    var base = evalExpr(node, scope), names = part.type === "key" ? new Set([part.value]) : part.type === "index" ? new Set([String(part.value)]) : finiteStrings(evalExpr(part.node, part.scope));
    return rest.length ? unknownValue() : memberValue(base, names);
  }
  function projectReference(reference, parts) {
    if (!reference || reference.unknown) return unknownValue();
    if (reference.alternatives) return mergeValues(reference.alternatives.map(function (alternative) { return projectReference(alternative, parts); }));
    if (reference.argumentItems || reference.slice || reference.rest || reference.iterable) {
      var projectedValue = evalReference(reference);
      for (var i = 0; i < parts.length; i++) {
        var part = parts[i], names = part.type === "key" ? new Set([part.value]) : part.type === "index" ? new Set([String(part.value)]) : finiteStrings(evalExpr(part.node, part.scope));
        projectedValue = memberValue(projectedValue, names);
      }
      return projectedValue;
    }
    return projectValue(reference.node, reference.scope, (reference.path || []).concat(parts));
  }
  function evalBinding(found) {
    if (!found || evaluatingBindings.has(found) || !found.sources.length) return unknownValue();
    evaluatingBindings.add(found);
    var value = mergeValues(found.sources.map(evalReference));
    evaluatingBindings.delete(found);
    return value;
  }
  function memberNames(node) {
    if (!node.computed) return new Set([node.property.name]);
    if (node.property.type === "Literal" && (typeof node.property.value === "string" || typeof node.property.value === "number")) return new Set([String(node.property.value)]);
    return finiteStrings(evalExpr(node.property, nodeScopes.get(node.property)));
  }
  function finiteStrings(value) { return value && !value.unknown && !value.origins.size && !value.callables.length && !value.objects.length && !value.arrays.length ? value.strings : null; }
  function callableValue(method, bound) { var value = emptyValue(); value.callables.push({ method: method, bound: bound || [] }); return value; }
  function memberValue(base, names) {
    var results = [];
    if (!names) {
      if (base.origins.has("window") || base.origins.has("prototype") || base.origins.has("window-constructor")) results.push(originValue("hazard"));
      if (base.origins.has("loft")) results.push(originValue("loft"));
      if (base.origins.has("private")) results.push(originValue("private"));
      base.objects.forEach(function (objectRef) {
        objectRef.node.properties.forEach(function (property) {
          if (property.type === "Property") results.push(evalExpr(property.value, nodeScopes.get(property.value)));
          else results.push(unknownValue());
        });
      });
      if (base.arrays.length) results.push(unknownValue());
      if (base.unknown || (!results.length && !base.callables.length && !base.arrays.length)) results.push(unknownValue());
      return mergeValues(results);
    }
    names.forEach(function (name) {
      if (base.origins.has("window")) {
        if (name === "loft") results.push(originValue("loft"));
        else if (name === "__proto__") results.push(originValue("prototype"));
        else if (name === "constructor") results.push(originValue("window-constructor"));
        else if (name === "window" || name === "self" || name === "globalThis" || name === "top" || name === "parent" || name === "frames") results.push(originValue("window"));
        else if (name === "document") results.push(originValue("document"));
        else if (name.indexOf("__") === 0) results.push(originValue("private"));
        else results.push(unknownValue());
      }
      if (base.origins.has("document")) results.push(name === "defaultView" ? originValue("window") : unknownValue());
      if (base.origins.has("window-constructor")) results.push(name === "prototype" ? originValue("prototype") : unknownValue());
      if (base.origins.has("function-constructor")) results.push(name === "prototype" ? originValue("function-prototype") : unknownValue());
      if (base.origins.has("function-prototype")) {
        if (name === "call" || name === "apply") results.push(callableValue("Function." + name));
        else results.push(unknownValue());
      }
      if (base.origins.has("object-constructor")) results.push(name === "prototype" ? originValue("prototype") : unknownValue());
      if (base.origins.has("prototype")) results.push(originValue("prototype"));
      if (base.origins.has("loft")) results.push(name === "__proto__" ? originValue("prototype") : name === "constructor" ? originValue("object-constructor") : originValue("loft"));
      if (base.origins.has("private")) results.push(name === "__proto__" ? originValue("prototype") : name === "constructor" ? originValue("object-constructor") : originValue("private"));
      if (base.origins.has("object")) {
        if (name === "prototype") results.push(originValue("prototype"));
        else if (metaMethods.has("Object." + name)) results.push(callableValue("Object." + name));
      }
      if (base.origins.has("object-instance")) results.push(name === "__proto__" ? originValue("prototype") : name === "constructor" ? originValue("object-constructor") : unknownValue());
      if (base.origins.has("reflect") && metaMethods.has("Reflect." + name)) results.push(callableValue("Reflect." + name));
      if (base.origins.has("hazard")) results.push(originValue("hazard"));
      if (base.origins.has("meta-hazard")) results.push(originValue("meta-hazard"));
      if (base.unknown) results.push(unknownValue());
      base.objects.forEach(function (objectRef) {
        objectRef.node.properties.forEach(function (property) {
          if (property.type !== "Property") { results.push(unknownValue()); return; }
          var keys = property.computed ? finiteStrings(evalExpr(property.key, nodeScopes.get(property.key))) : new Set([property.key.name || property.key.value]);
          if (!keys || keys.has(name)) results.push(evalExpr(property.value, nodeScopes.get(property.value)));
        });
      });
      if (/^(?:0|[1-9]\d*)$/.test(String(name))) base.arrays.forEach(function (arrayRef) {
        var item = itemsOfArrayRef(arrayRef)[Number(name)];
        results.push(item ? evalReference(item) : unknownValue());
      });
    });
    return results.length ? mergeValues(results) : unknownValue();
  }
  function arrayReferences(node, scope) {
    var value = evalExpr(node, scope), references = [];
    value.arrays.forEach(function (arrayRef) { references = references.concat(itemsOfArrayRef(arrayRef)); });
    return value.arrays.length && !value.unknown ? references : null;
  }
  function arrayReferenceValues(reference) {
    var value = evalReference(reference), references = [];
    value.arrays.forEach(function (arrayRef) { references = references.concat(itemsOfArrayRef(arrayRef)); });
    return value.arrays.length && !value.unknown ? references : null;
  }
  function itemsOfArrayRef(arrayRef) {
    if (arrayRef.items) return arrayRef.items;
    var items = [];
    arrayRef.node.elements.forEach(function (entry) {
      if (!entry) items.push({ unknown: true });
      else if (entry.type === "SpreadElement") items = items.concat(arrayReferenceValues({ node: entry.argument, scope: nodeScopes.get(entry.argument), path: [] }) || [{ unknown: true }]);
      else items.push({ node: entry, scope: nodeScopes.get(entry), path: [] });
    });
    return items;
  }
  function expandedMetaArguments(args) {
    var refs = [];
    args.forEach(function (argument) {
      if (argument.type !== "SpreadElement") refs.push({ node: argument, scope: nodeScopes.get(argument), path: [] });
      else refs = refs.concat(arrayReferenceValues({ node: argument.argument, scope: nodeScopes.get(argument.argument), path: [] }) || [{ hazard: true }]);
    });
    return refs;
  }
  function invokeCallable(callable, args) {
    var combined = callable.bound.concat(args);
    if (callable.uncurry === "call") return { method: callable.method, args: callable.targetBound.concat(combined.slice(1)) };
    if (callable.uncurry === "apply") {
      var applied = combined[1] && arrayReferenceValues(combined[1]);
      return { method: callable.method, args: applied ? callable.targetBound.concat(applied) : null };
    }
    return { method: callable.method, args: combined };
  }
  function invokeWithThis(callable, thisRef, args) {
    var calls = [];
    if (callable.method === "Function.call" || callable.method === "Function.apply") {
      var target = thisRef && evalReference(thisRef);
      if (!target) return calls;
      target.callables.forEach(function (targetCallable) {
        if (callable.method === "Function.call") calls.push(invokeCallable(targetCallable, args.slice(1)));
        else {
          var applied = args[1] && arrayReferenceValues(args[1]);
          calls.push(applied ? invokeCallable(targetCallable, applied) : { method: targetCallable.method, args: null });
        }
      });
      return calls;
    }
    calls.push(invokeCallable(callable, args));
    return calls;
  }
  function normalizeInvocation(call, depth) {
    if (!call || call.method !== "Reflect.apply") return call ? [call] : [];
    if (depth > 12 || !call.args || !call.args[0]) return [];
    var target = evalReference(call.args[0]), reflected = call.args[2] && arrayReferenceValues(call.args[2]), normalized = [];
    target.callables.forEach(function (targetCallable) {
      var invoked = reflected ? invokeWithThis(targetCallable, call.args[1] || { safe: true }, reflected) : [{ method: targetCallable.method, args: null }];
      invoked.forEach(function (nextCall) { normalized = normalized.concat(normalizeInvocation(nextCall, depth + 1)); });
    });
    if (!target.callables.length && (target.origins.has("meta-hazard") || target.unknown)) normalized.push({ method: "<unknown-meta>", args: reflected });
    return normalized;
  }
  function normalizeInvocations(calls) {
    var normalized = [];
    calls.forEach(function (call) { normalized = normalized.concat(normalizeInvocation(call, 0)); });
    return normalized;
  }
  function invocationList(node) {
    if (!node || node.type !== "CallExpression") return [];
    if (node.callee.type === "MemberExpression") {
      var suffixes = memberNames(node.callee);
      if (suffixes && suffixes.size === 1) {
        var suffix = Array.from(suffixes)[0], base = evalExpr(node.callee.object, nodeScopes.get(node.callee.object));
        if (suffix === "call" && base.callables.length) {
          var callRefs = expandedMetaArguments(node.arguments), called = callRefs.slice(1), callThis = callRefs[0] || { safe: true }, calledList = [];
          base.callables.forEach(function (callable) { calledList = calledList.concat(invokeWithThis(callable, callThis, called)); });
          return normalizeInvocations(calledList);
        }
        if (suffix === "apply") {
          var applied = node.arguments[1] && arrayReferences(node.arguments[1], nodeScopes.get(node.arguments[1]));
          if (base.callables.length) {
            var applyThis = node.arguments[0] ? { node: node.arguments[0], scope: nodeScopes.get(node.arguments[0]), path: [] } : { safe: true }, appliedList = [];
            base.callables.forEach(function (callable) {
              if (!applied) appliedList.push({ method: callable.method, args: null });
              else appliedList = appliedList.concat(invokeWithThis(callable, applyThis, applied));
            });
            return normalizeInvocations(appliedList);
          }
        }
      }
    }
    var callee = evalExpr(node.callee, nodeScopes.get(node.callee));
    var directArgs = expandedMetaArguments(node.arguments);
    var calls = [];
    callee.callables.forEach(function (callable) { calls.push(invokeCallable(callable, directArgs)); });
    if (callee.origins.has("meta-hazard")) calls.push({ method: "<unknown-meta>", args: directArgs });
    return normalizeInvocations(calls);
  }
  function evalExpr(node, scope) {
    if (!node) return unknownValue();
    scope = scope || nodeScopes.get(node);
    if (node.type === "Literal") return typeof node.value === "string" ? stringValue(node.value) : emptyValue();
    if (node.type === "TemplateLiteral") {
      if (!node.expressions.length) return stringValue(node.quasis[0].value.cooked);
      var pieces = [stringValue(node.quasis[0].value.cooked)];
      node.expressions.forEach(function (expression, index) { pieces.push(evalExpr(expression)); pieces.push(stringValue(node.quasis[index + 1].value.cooked)); });
      var current = new Set([""]), unknown = false;
      pieces.forEach(function (piece) { var strings = finiteStrings(piece); if (!strings) { unknown = true; return; } var next = new Set(); current.forEach(function (a) { strings.forEach(function (b) { next.add(a + b); }); }); current = next; });
      var templated = emptyValue(); templated.strings = current; templated.unknown = unknown; return templated;
    }
    if (node.type === "Identifier") {
      var found = resolve(scope, node.name);
      if (found) return evalBinding(found);
      if (node.name === "window" || node.name === "globalThis" || node.name === "self" || node.name === "top" || node.name === "parent" || node.name === "frames") return originValue("window");
      if (node.name === "loft") return originValue("loft");
      if (node.name === "document") return originValue("document");
      if (node.name === "Window") return originValue("window-constructor");
      if (node.name === "Function") return originValue("function-constructor");
      if (node.name === "Object") return originValue("object");
      if (node.name === "Reflect") return originValue("reflect");
      return unknownValue();
    }
    if (node.type === "ThisExpression") {
      var thisScope = scope;
      while (thisScope && thisScope.type !== "program") {
        if (thisScope.type === "function" && thisScope.functionInfo && !thisScope.functionInfo.arrow) {
          return thisScope.functionInfo.thisSources.length ? mergeValues(thisScope.functionInfo.thisSources.map(evalReference)) : unknownValue();
        }
        thisScope = thisScope.parent;
      }
      return originValue("window");
    }
    if (node.type === "ConditionalExpression") return mergeValues([evalExpr(node.consequent), evalExpr(node.alternate)]);
    if (node.type === "LogicalExpression") return mergeValues([evalExpr(node.left), evalExpr(node.right)]);
    if (node.type === "SequenceExpression") return evalExpr(node.expressions[node.expressions.length - 1]);
    if (node.type === "AssignmentExpression") return evalExpr(node.right);
    if (node.type === "BinaryExpression" && node.operator === "+") {
      var left = evalExpr(node.left), right = evalExpr(node.right), leftStrings = finiteStrings(left), rightStrings = finiteStrings(right), value = emptyValue();
      if (leftStrings && rightStrings) leftStrings.forEach(function (a) { rightStrings.forEach(function (b) { value.strings.add(a + b); }); });
      else if (leftStrings && Array.from(leftStrings).every(function (text) { return text.indexOf("__") === 0; })) value.strings.add("__*");
      else value.unknown = true;
      return value;
    }
    if (node.type === "ObjectExpression") { var objectValue = originValue("object-instance"); objectValue.objects.push({ node: node, scope: scope }); return objectValue; }
    if (node.type === "ArrayExpression") { var arrayValue = emptyValue(); arrayValue.arrays.push({ node: node, scope: scope }); return arrayValue; }
    if (node.type === "MemberExpression") return memberValue(evalExpr(node.object), memberNames(node));
    if (node.type === "CallExpression") {
      if (node.callee.type === "MemberExpression") {
        var suffixes = memberNames(node.callee);
        if (suffixes && suffixes.size === 1 && suffixes.has("bind")) {
          var base = evalExpr(node.callee.object), boundValue = emptyValue(), bindArgs = expandedMetaArguments(node.arguments), bound = bindArgs.slice(1);
          base.callables.forEach(function (callable) {
            if (callable.method === "Function.call" || callable.method === "Function.apply") {
              var target = bindArgs[0] && evalReference(bindArgs[0]);
              target.callables.forEach(function (targetCallable) { boundValue.callables.push({ method: targetCallable.method, bound: bound, targetBound: targetCallable.bound, uncurry: callable.method === "Function.call" ? "call" : "apply" }); });
            } else boundValue.callables.push({ method: callable.method, bound: callable.bound.concat(bound) });
          });
          if (!boundValue.callables.length) boundValue.unknown = true;
          return boundValue;
        }
      }
      var calls = invocationList(node), results = [];
      calls.forEach(function (call) {
        if ((call.method === "Object.getPrototypeOf" || call.method === "Reflect.getPrototypeOf") && call.args && call.args[0]) {
          var target = evalReference(call.args[0]);
          if (["window", "prototype", "hazard", "loft", "private", "object-instance"].some(function (origin) { return target.origins.has(origin); })) results.push(originValue("prototype"));
          else results.push(unknownValue());
        } else results.push(unknownValue());
      });
      return results.length ? mergeValues(results) : unknownValue();
    }
    return unknownValue();
  }
  function allowedName(name) { return name === "loft" || vendorNames.has(name) || (typeof name === "string" && name.indexOf("__") === 0 && name !== "__proto__"); }
  var violations = [];
  function add(node, kind, name, message, force) {
    if (!force && allowedName(name)) return;
    violations.push({ file: file, line: node.loc.start.line, kind: kind, name: name, message: message || (name === null ? "unclassified hazardous Window write" : "public Window write: " + name) });
  }
  function auditTarget(node, kind) {
    if (!node) return;
    if (node.type === "VariableDeclaration") { node.declarations.forEach(function (declaration) { auditTarget(declaration.id, kind); }); return; }
    if (node.type === "MemberExpression") {
      var base = evalExpr(node.object), names = memberNames(node);
      if (base.origins.has("prototype")) { if (!names) add(node, kind, null, "dynamic inherited Window surface write", true); else names.forEach(function (name) { add(node, kind, name, "inherited Window surface write", true); }); }
      if (base.origins.has("window")) { if (!names) add(node, kind, null); else names.forEach(function (name) { add(node, kind, name); }); }
      if (base.origins.has("hazard")) {
        if (!names) add(node, kind, null, "unresolved value may be Window or its prototype", true);
        else names.forEach(function (name) { add(node, kind, name, "unresolved value may be Window or its prototype", true); });
      }
      return;
    }
    if (node.type === "Identifier") {
      if (!resolve(nodeScopes.get(node), node.name)) add(node, kind, node.name);
      return;
    }
    if (node.type === "ArrayPattern") { node.elements.forEach(function (entry) { auditTarget(entry, kind); }); return; }
    if (node.type === "ObjectPattern") { node.properties.forEach(function (property) { auditTarget(property.type === "RestElement" ? property.argument : property.value, kind); }); return; }
    if (node.type === "AssignmentPattern" || node.type === "RestElement") auditTarget(node.left || node.argument, kind);
  }
  function objectKeys(reference) {
    var value = evalReference(reference), names = new Set(), valid = value.objects.length > 0 && !value.unknown;
    value.objects.forEach(function (objectRef) { objectRef.node.properties.forEach(function (property) {
      if (property.type !== "Property") { valid = false; return; }
      var keys = property.computed ? finiteStrings(evalExpr(property.key, nodeScopes.get(property.key))) : new Set([property.key.name || property.key.value]);
      if (!keys) valid = false; else keys.forEach(function (key) { names.add(key); });
    }); });
    return valid ? names : null;
  }
  function auditMeta(node, call) {
    var writes = new Set(["<unknown-meta>", "Object.assign", "Object.defineProperty", "Object.defineProperties", "Object.setPrototypeOf", "Reflect.set", "Reflect.defineProperty", "Reflect.deleteProperty", "Reflect.setPrototypeOf"]);
    if (!writes.has(call.method)) return;
    if (!call.args || !call.args[0]) { add(node, call.method, null); return; }
    var target = evalReference(call.args[0]), hazardous = target.origins.has("window") || target.origins.has("prototype") || target.origins.has("hazard");
    if (!hazardous) return;
    var inherited = target.origins.has("prototype") || target.origins.has("hazard");
    function report(name) { add(node, call.method, name, inherited ? "inherited or unresolved Window surface write" : null, inherited); }
    if (call.method === "<unknown-meta>") { report(null); return; }
    if (call.method === "Object.setPrototypeOf" || call.method === "Reflect.setPrototypeOf") { report("[[Prototype]]"); return; }
    if (call.method === "Object.assign") {
      call.args.slice(1).forEach(function (sourceRef) { var keys = objectKeys(sourceRef); if (!keys) report(null); else keys.forEach(report); });
      return;
    }
    if (call.method === "Object.defineProperties") { var descriptorKeys = call.args[1] && objectKeys(call.args[1]); if (!descriptorKeys) report(null); else descriptorKeys.forEach(report); return; }
    var names = call.args[1] && finiteStrings(evalReference(call.args[1]));
    if (!names) report(null); else names.forEach(report);
  }
  model.globalDeclarations.forEach(function (declaration) {
    if (declaration.name.indexOf("__") !== 0) add(declaration.node, declaration.kind, declaration.name, "bare Program-scope binding", true);
  });
  model.implicitWrites.forEach(function (write) { add(write.node, write.kind, write.name); });
  walk.simple(ast, {
    AssignmentExpression: function (node) { auditTarget(node.left, "assignment"); },
    UpdateExpression: function (node) { auditTarget(node.argument, "update"); },
    UnaryExpression: function (node) { if (node.operator === "delete") auditTarget(node.argument, "delete"); },
    ForInStatement: function (node) { auditTarget(node.left, "for-in"); },
    ForOfStatement: function (node) { auditTarget(node.left, "for-of"); },
    CallExpression: function (node) { invocationList(node).forEach(function (call) { auditMeta(node, call); }); }
  });
  return violations;
}

function authoredSources(root) {
  var html = fs.readFileSync(path.join(root, "loft-day.html"), "utf8"), files = [];
  var scriptRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi, match, inline = 0;
  while ((match = scriptRe.exec(html))) {
    var src = match[1].match(/\bsrc=["']([^"']+)["']/i);
    if (src) { var relative = src[1].split(/[?#]/)[0]; if (!/^[a-z]+:/i.test(relative)) files.push({ name: relative, source: fs.readFileSync(path.join(root, relative), "utf8") }); }
    else files.push({ name: "loft-day.html#inline-" + (++inline), source: match[2] });
  }
  return files;
}

function main() {
  var root = path.join(__dirname, ".."), violations = [];
  authoredSources(root).forEach(function (file) { violations = violations.concat(auditSource(file.source, file.name.replace(/#inline-\d+$/, "") === "loft-day.html" ? "loft-day.html" : file.name)); });
  var fixtureDir = path.join(__dirname, "fixtures", "global-audit");
  var manifest = JSON.parse(fs.readFileSync(path.join(fixtureDir, "manifest.json"), "utf8"));
  var failures = [];
  Object.keys(manifest).sort().forEach(function (name) {
    var found = auditSource(fs.readFileSync(path.join(fixtureDir, name), "utf8"), name), expected = manifest[name];
    var passed = expected === "allowed" ? found.length === 0 : found.some(function (violation) { return violation.name === expected || (expected === null && violation.name === null); });
    if (!passed) failures.push({ fixture: name, expected: expected, violations: found });
  });
  console.log("Loft static Window audit:");
  if (violations.length) violations.forEach(function (entry) { console.log("  ✗ " + entry.file + ":" + entry.line + " " + entry.kind + " " + (entry.name === null ? "<dynamic>" : entry.name)); });
  else console.log("  ✓ authored sources contain no public or unclassified dynamic Window writes");
  if (failures.length) failures.forEach(function (entry) { console.log("  ✗ hostile fixture classification: " + JSON.stringify(entry)); });
  else console.log("  ✓ abstract-value fixture matrix covers lexical, prototype, meta-callable, declaration, pattern-mutation, and safe-subtree flows");
  console.log("  ✓ parser: Node-bundled Acorn " + acorn.version + " (zero network)");
  if (violations.length || failures.length) process.exit(1);
  console.log("All static Window audit checks passed.");
}

if (require.main === module) main();
module.exports = { auditSource: auditSource, authoredSources: authoredSources };
