#!/usr/bin/env node
// JavaScript/Python Editor and browser-Turtle regression checks.
"use strict";

var fs = require("fs");
var path = require("path");
var child = require("child_process");
var lib = require("./lib");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");
var worker = fs.readFileSync(path.join(ROOT, "chat.js"), "utf8");
var failures = 0;

function check(ok, label, detail) {
  if (ok) console.log("  ✓ " + label);
  else {
    failures++;
    console.log("  ✗ " + label);
    if (detail) console.log("      " + String(detail).split("\n").join("\n      "));
  }
}

console.log("Python Editor:");

check(/id="monitor-ed-lang-js"[\s\S]*?id="monitor-ed-lang-py"/.test(html),
  "Editor exposes adjacent JavaScript and Python selectors");
check(/ED_STORE_KEYS\s*=\s*\{\s*js:\s*"deskScripts",\s*python:\s*"deskPythonScripts"\s*\}/.test(html),
  "JavaScript's legacy file store remains intact and Python has a separate durable store");
check(html.indexOf('return /\\.py$/i.test(name) ? "python" : /\\.js$/i.test(name) ? "js" : "";') >= 0,
  ".py and .js filenames infer their runtime");
check(/editor:\s*\{\s*language:\s*edLanguage/.test(html) &&
      /PYTHON_EDITOR_INSTRUCTIONS/.test(worker) &&
      /payload\.editor\.language === "python"/.test(worker),
  "Editor assistance carries language through to a Python-specific Worker prompt");
check(/window\.__runPythonEditor[\s\S]*?pyEditorQueue\.push\(job\)[\s\S]*?openPython\(\)/.test(html),
  "Python Run hands the complete buffer to the existing Python app");

var turtleMatch = /var PY_TURTLE_MODULE = `([\s\S]*?)`;\n  function installPythonTurtle/.exec(html);
check(!!turtleMatch, "a self-hosted browser Turtle compatibility module is embedded");
check(/<g id="monitor-py-turtle">[\s\S]*?<svg[\s\S]*?id="monitor-py-turtle-lines"/.test(html) &&
      /PY_TURTLE_NODE_LIMIT\s*=\s*6000/.test(html),
  "Turtle renders into a bounded native SVG surface");
check(/installPythonTurtle\(py\)/.test(html) &&
      /sys\.path\.insert\(0,p\)/.test(html),
  "the Turtle module is installed before user Python imports it");

if (turtleMatch) {
  var smoke = [
    "import sys, types",
    "src = sys.stdin.read()",
    "compile(src, 'turtle.py', 'exec')",
    "calls = []",
    "js = types.ModuleType('js')",
    "js.__loftTurtleCommand = lambda *args: calls.append(args)",
    "sys.modules['js'] = js",
    "ns = {}",
    "exec(src, ns)",
    "t = ns['Turtle']()",
    "t.speed('fast')",
    "[ns['forward'](20) or ns['right'](90) for _ in range(4)]",
    "assert t.speed() == 10",
    "assert len([c for c in calls if c[0] == 'line']) == 4",
  ].join("; ");
  var py = child.spawnSync("python3", ["-c", smoke], {
    input: turtleMatch[1],
    encoding: "utf8",
  });
  check(py.status === 0,
    "the embedded module compiles and its instance/module APIs reach the JS bridge",
    py.stderr);
}

var harness = [
  '<script>',
  '(async function(){',
  '  var out={};',
  '  localStorage.removeItem("deskScripts"); localStorage.removeItem("deskPythonScripts"); localStorage.removeItem("deskEditorDraft"); localStorage.removeItem("deskEditorLanguage");',
  '  var mon=document.getElementById("office-monitor"); mon.classList.add("screen-on","show-caps","show-editor");',
  '  var name=document.getElementById("monitor-ed-name"), code=document.getElementById("monitor-ed-code"), py=document.getElementById("monitor-ed-lang-py");',
  '  py.click(); code.value="print(\\\"turtle time\\\")"; code.dispatchEvent(new Event("input",{bubbles:true}));',
  '  await new Promise(function(r){setTimeout(r,180)});',
  '  out.draftLanguage=JSON.parse(localStorage.getItem("deskEditorDraft")||"{}").language;',
  '  name.value="irene.py"; name.dispatchEvent(new Event("input",{bubbles:true}));',
  '  await new Promise(function(r){setTimeout(r,360)});',
  '  out.pythonSaved=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"];',
  '  out.jsUntouched=!Object.prototype.hasOwnProperty.call(JSON.parse(localStorage.getItem("deskScripts")||"{}"),"irene.py");',
  '  var routed=null; window.__runPythonEditor=function(n,c){routed={name:n,code:c};return true}; document.getElementById("monitor-ed-run").click();',
  '  out.routed=routed; out.pythonActive=py.classList.contains("active");',
  '  out.pythonCompletion=window.__editorCommands().some(function(c){return c.name==="Turtle"});',
  '  out.loftRosterStable=window.__loftCommands().some(function(c){return c.name==="party"}) && !window.__loftCommands().some(function(c){return c.name==="Turtle"});',
  '  document.body.innerHTML="<pre id=\\"__report\\"></pre>"; document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e)})});',
  '<\/script>',
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true });
check(state && !state.error, "headless Editor interaction completed", state && state.error);
if (state && !state.error) {
  check(state.pythonSaved === 'print("turtle time")' && state.jsUntouched,
    "a named Python buffer autosaves without contaminating legacy JavaScript files", state);
  check(state.draftLanguage === "python",
    "the recoverable Editor draft retains its language", state.draftLanguage);
  check(state.routed && state.routed.name === "irene.py" && state.routed.code === 'print("turtle time")',
    "Run routes the exact Python name and buffer", state.routed);
  check(state.pythonActive && state.pythonCompletion && state.loftRosterStable,
    "selector styling and completion catalogs track Python without changing the Loft JS hook", state);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
