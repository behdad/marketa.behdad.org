#!/usr/bin/env node
// `import loft` contract checks against the repository's pinned Pyodide runtime.
"use strict";

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "loft-day.html"), "utf8");
var match = /var PY_LOFT_MODULE = `([\s\S]*?)`;\n  var PY_TURTLE_MODULE/.exec(html);
var failures = 0;

function check(ok, label, detail) {
  if (ok) console.log("  ✓ " + label);
  else {
    failures++;
    console.log("  ✗ " + label);
    if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
  }
}

async function main() {
  console.log("Python Loft API:");
  check(!!match, "the embedded loft module is present");
  if (!match) return;

  var source = match[1];
  check(!/["'](?:game\.status|party\.set|rain\.set|room\.go|future\.status)["']/.test(source),
    "the Python module contains no hand-maintained capability roster");

  require(path.join(ROOT, "pyodide", "pyodide.js"));
  var py = await globalThis.loadPyodide({ indexURL: path.join(ROOT, "pyodide") + path.sep });
  check(py.version === "314.0.2", "checks run on pinned Pyodide 314.0.2", py.version);

  var calls = [];
  var manifest = [
    { id: "api.capabilities", kind: "query", description: "catalogue", args: {} },
    { id: "broken.run", kind: "action", description: "validated failure", args: {} },
    { id: "denied.status", kind: "query", description: "validated failure", args: {} },
    { id: "echo.values", kind: "query", description: "conversion probe", args: { items: { type: "object", required: true } } },
    { id: "game.status", kind: "query", description: "game status", args: {} },
    { id: "party.first-dance.status", kind: "query", description: "hyphen probe", args: {} },
    { id: "ordered.set", kind: "action", completion: "instant", description: "ordered arguments", args: { second: { type: "string", required: true }, first: { type: "string", required: true } }, argOrder: ["first", "second"] },
    { id: "garden.set", kind: "action", completion: "instant", description: "party toggle", aliases: ["party.set"], args: { on: { type: "boolean", required: true } }, argOrder: ["on"] },
    { id: "weather.rain.set", kind: "action", completion: "instant", description: "rain override", args: { on: { type: "boolean", required: true, nullable: true } }, argOrder: ["on"] },
    { id: "reject.run", kind: "action", description: "promise rejection", args: {} },
    { id: "room.go", kind: "action", completion: "finite", description: "room navigation", args: { room: { type: "string", required: true } }, argOrder: ["room"] }
  ];
  var api = {
    capabilities: function () { return manifest; },
    query: function (id, args) {
      if (id === "game.status") return { ok: true, value: { room: "kitchen", optional: null, rooms: ["kitchen", null] } };
      if (id === "echo.values") return { ok: true, value: args.items };
      if (id === "party.first-dance.status") return { ok: true, value: true };
      if (id === "future.status") return { ok: true, value: { ready: true } };
      if (id === "denied.status") return { ok: false, code: "NOT_AVAILABLE", message: "Not here yet." };
      if (id === "api.capabilities") return { ok: true, value: manifest };
      return { ok: false, code: "UNKNOWN_CAPABILITY", message: "Unknown query." };
    },
    perform: function (id, args, options) {
      calls.push({ id: id, args: args, source: options && options.source });
      if (id === "broken.run") return Promise.resolve({ ok: false, code: "NOPE", message: "Broken on purpose." });
      if (id === "reject.run") return Promise.reject(new TypeError("Rejected on purpose."));
      if (id === "weather.rain.set" && args.on !== null && typeof args.on !== "boolean") {
        return Promise.resolve({ ok: false, code: "INVALID_ARGUMENT", message: "Invalid on." });
      }
      return new Promise(function (resolve) {
        setTimeout(function () { resolve({ ok: true, value: { id: id, args: args, nullable: null } }); }, 5);
      });
    }
  };
  globalThis.window = {
    loft: { api: api },
    help: function (topic) { return arguments.length ? "JS HELP " + String(topic) : "JS HELP ROOT"; }
  };
  globalThis.__loftTurtleCommand = function () { return true; };
  globalThis.__loftBridgeCallCount = function () { return calls.length; };
  globalThis.__loftBridgeLastWasNull = function () { return calls.length > 0 && calls[calls.length - 1].args.on === null; };
  globalThis.__loftBridgeAddCapability = function () {
    manifest.push({ id: "future.status", kind: "query", description: "registered later", args: {} });
  };

  py.FS.mkdirTree("/home/pyodide/loft");
  py.FS.writeFile("/home/pyodide/loft/loft.py", source);
  py.runPython("import sys\np='/home/pyodide/loft'\nif p not in sys.path: sys.path.insert(0,p)");

  var python = [
    "import builtins",
    "import contextlib",
    "import importlib",
    "import io",
    "import js",
    "import loft",
    "",
    "original_help = builtins.help.__loft_original__",
    "first_loft_help = builtins.help",
    "loft = importlib.reload(loft)",
    "assert builtins.help is not first_loft_help",
    "assert builtins.help.__loft_original__ is original_help",
    "def rendered_help(*args):",
    "    output = io.StringIO()",
    "    with contextlib.redirect_stdout(output):",
    "        result = help(*args)",
    "    assert result is None",
    "    return output.getvalue().rstrip('\\n')",
    "assert rendered_help() == 'JS HELP ROOT'",
    "assert rendered_help(loft) == 'JS HELP ROOT'",
    "assert rendered_help(loft.weather) == 'JS HELP weather'",
    "assert rendered_help(loft.weather.rain) == 'JS HELP weather.rain'",
    "assert rendered_help(loft.weather.rain.set) == 'JS HELP weather.rain.set'",
    "assert 'Help on class str in module builtins' in rendered_help(str)",
    "",
    "status = loft.game.status()",
    "assert status == {'room': 'kitchen', 'optional': None, 'rooms': ['kitchen', None]}",
    "assert loft.echo.values({'nested': [True, None], 'plain': 3}) == {'nested': [True, None], 'plain': 3}",
    "assert loft.party.first_dance.status() is True",
    "assert 'party' in dir(loft) and 'set' in dir(loft.party)",
    "assert loft.party.set.description == 'party toggle'",
    "",
    "before = js.__loftBridgeCallCount()",
    "rain = loft.weather.rain.set(None)",
    "assert js.__loftBridgeCallCount() == before + 1",
    "assert js.__loftBridgeLastWasNull()",
    "assert 'started' in repr(rain)",
    "rain_result = await rain",
    "assert rain_result == {'id': 'weather.rain.set', 'args': {'on': None}, 'nullable': None}",
    "assert (await loft.party.set(True))['id'] == 'garden.set'",
    "assert (await loft.garden.set(False))['args'] == {'on': False}",
    "assert (await loft.ordered.set('one', 'two'))['args'] == {'first': 'one', 'second': 'two'}",
    "assert (await loft.room.go('garden'))['args'] == {'room': 'garden'}",
    "assert (await loft.room.go(room='office'))['args'] == {'room': 'office'}",
    "try:",
    "    await loft.weather.rain.set('auto')",
    "except loft.LoftError as error:",
    "    assert error.code == 'INVALID_ARGUMENT'",
    "else:",
    "    raise AssertionError('string auto reached the environment setter')",
    "",
    "try:",
    "    loft.room.go(place='garden')",
    "except TypeError as error:",
    "    assert 'unexpected keyword' in str(error)",
    "else:",
    "    raise AssertionError('invalid Python arguments were accepted')",
    "",
    "try:",
    "    loft.denied.status()",
    "except loft.LoftError as error:",
    "    assert error.code == 'NOT_AVAILABLE' and error.capability == 'denied.status'",
    "else:",
    "    raise AssertionError('failed query did not raise LoftError')",
    "",
    "for action, code in [(loft.broken.run, 'NOPE'), (loft.reject.run, 'JS_ERROR')]:",
    "    try:",
    "        await action()",
    "    except loft.LoftError as error:",
    "        assert error.code == code",
    "    else:",
    "        raise AssertionError('failed action did not raise LoftError')",
    "",
    "js.__loftBridgeAddCapability()",
    "assert loft.future.status() == {'ready': True}",
    "assert any(item['id'] == 'future.status' for item in loft.capabilities())",
  ].join("\n");

  try {
    await py.runPythonAsync(python);
    check(true, "dynamic namespaces, recursive Loft help, ordinary Python help, conversions, actions and errors work in pinned Pyodide");
  } catch (error) {
    check(false, "dynamic namespaces, recursive Loft help, ordinary Python help, conversions, actions and errors work in pinned Pyodide", error && error.message || error);
  }

  check(calls.some(function (call) { return call.id === "garden.set" && call.args.on === true && call.source === "python"; }),
    "actions use only the typed API and identify their Python source");
}

main().then(function () {
  if (failures) {
    console.error("\n" + failures + " Python Loft API check(s) failed.");
    process.exit(1);
  }
  console.log("\nPython Loft API checks passed.");
}, function (error) {
  console.error(error && error.stack || error);
  process.exit(1);
});
