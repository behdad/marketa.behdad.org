#!/usr/bin/env node
// JavaScript/Python Code and browser-Turtle regression checks.
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

console.log("Python Code:");

check(/id="monitor-code-lang-js"[\s\S]*?id="monitor-code-lang-py"/.test(html),
  "Code exposes adjacent JavaScript and Python selectors");
check(/CODE_STORE_KEYS\s*=\s*\{\s*js:\s*"deskScripts",\s*python:\s*"deskPythonScripts"\s*\}/.test(html),
  "JavaScript's legacy file store remains intact and Python has a separate durable store");
check(html.indexOf('return /\\.py$/i.test(name) ? "python" : /\\.js$/i.test(name) ? "js" : "";') >= 0,
  ".py and .js filenames infer their runtime");
check(/code:\s*\{\s*language:\s*codeLanguage/.test(html) &&
      /PYTHON_CODE_INSTRUCTIONS/.test(worker) &&
      /payload\.code\.language === "python"/.test(worker),
  "Code assistance carries language through to a Python-specific Worker prompt");
check(/window\.__runPythonCode[\s\S]*?pyCodeQueue\.push\(job\)[\s\S]*?openPython\(true\)/.test(html),
  "Python Run hands the complete buffer to the existing Python app");
check(/id="monitor-code-explain"[^>]*>explain<\/button>/.test(html) &&
      /id="monitor-code-ai-status"[^>]*>ready<\/span>/.test(html),
  "Code AI controls use explicit, compact labels");
check(/js\["hello\.js"\]\s*=\s*CODE_STARTER/.test(html) &&
      /py\["square\.py"\]\s*=\s*CODE_PY_STARTER/.test(html) &&
      /caption\(\\"hello from the loft/.test(html) &&
      /for _ in range\(4\):[\s\S]*?t\.forward\(60\)[\s\S]*?t\.right\(90\)/.test(html),
  "one-time editable hello.js and square.py examples are preloaded without overwriting user files");
check(/py\["space-filler\.py"\]\s*=\s*CODE_PY_SPACE_FILLER/.test(html) &&
      /CODE_SPACE_FILLER_KEY\s*=\s*"deskCodeSpaceFillerV1"/.test(html) &&
      /t\.goto\(-75,\s*-75\)/.test(html) &&
      /fill\(4\)/.test(html),
  "the centered space-filler turtle reaches existing players through its own one-time migration");
check(/py\["loft-type\.py"\]\s*=\s*CODE_PY_FRAUNCES_SVG/.test(html) &&
      /CODE_FRAUNCES_SVG_KEY\s*=\s*"deskCodeLoftTypeV2"/.test(html) &&
      /SVGPathPen/.test(html) &&
      /import uharfbuzz as hb/.test(html) &&
      /hb\.shape\(hb_font, buffer\)/.test(html) &&
      /hb_font\.get_font_extents\(\\"ltr\\"\)/.test(html) &&
      /await googlefonts\(\\"Fraunces\\"\)/.test(html) &&
      /buffer\.add_str\(\\"Loft Day\\"\)/.test(html),
  "the saved HarfBuzz + FontTools example renders Loft Day from Fraunces outlines");
check(/\["js", "python"\]\.forEach\(function \(language\)/.test(html) &&
      /codeLoad\(file\.name, file\.language\)/.test(html) &&
      /file\.language === codeLanguage/.test(html),
  "the sidebar lists both language stores and opening a file selects its stored runtime");
check(/error:\s*codeGetRunError\(codeLanguage\)/.test(html) &&
      /codeSetRunError\("python",\s*msg\)/.test(html) &&
      /codeSetRunError\("js",\s*msg\)/.test(html),
  "AI reviews receive only the active language's latest runtime error");
check(/CODE_UNSAVED_KEY\s*=\s*"deskCodeUnsaved"/.test(html) &&
      /file\.unsaved\)\s*codeLoadUnsaved\(\)/.test(html) &&
      /code-item\.unsaved/.test(html),
  "an unnamed buffer remains available as an italic unsaved sidebar item");
check(/pyPrint\(">>> import turtle  # browser graphics"/.test(html) &&
      /id="monitor-py-view-toggle" transform="translate\(363\.2,154\.8\)"/.test(html),
  "Python's ready banner names Turtle and the gfx control sits beside Close");
check(/pyReturnToCode[\s\S]*?paintPythonClose[\s\S]*?openPython\(true\)/.test(html) &&
      /consoleReturnToCode[\s\S]*?paintConsoleClose[\s\S]*?openConsole\(true\)/.test(html),
  "Code-launched Python and JavaScript consoles expose a Back path");

var turtleMatch = /var PY_TURTLE_MODULE = `([\s\S]*?)`;\n  function installPythonTurtle/.exec(html);
check(!!turtleMatch, "a self-hosted browser Turtle compatibility module is embedded");
check(/<g id="monitor-py-turtle">[\s\S]*?<svg[\s\S]*?id="monitor-py-turtle-lines"/.test(html) &&
      /PY_TURTLE_NODE_LIMIT\s*=\s*6000/.test(html),
  "Turtle renders into a bounded native SVG surface");
check(/class", "py-turtle-cursor"/.test(html) &&
      /py-turtle-cursor-shell/.test(html),
  "Turtle drawings end with a turtle-shaped SVG cursor");
check(/installPythonTurtle\(py\)/.test(html) &&
      /loftgfx\.py/.test(html) &&
      /function pyDisplaySvg/.test(html) &&
      /sys\.path\.insert\(0,p\)/.test(html),
  "the Turtle and sanitized SVG modules are installed before user Python imports them");

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
  '  localStorage.removeItem("deskScripts"); localStorage.removeItem("deskPythonScripts"); localStorage.removeItem("deskCodeDraft"); localStorage.removeItem("deskCodeLanguage");',
  '  var mon=document.getElementById("office-monitor"); mon.classList.add("screen-on","show-caps","show-code");',
  '  var name=document.getElementById("monitor-code-name"), code=document.getElementById("monitor-code-code"), py=document.getElementById("monitor-code-lang-py");',
  '  py.click(); code.value="print(\\\"turtle time\\\")"; code.dispatchEvent(new Event("input",{bubbles:true}));',
  '  await new Promise(function(r){setTimeout(r,180)});',
  '  out.draftLanguage=JSON.parse(localStorage.getItem("deskCodeDraft")||"{}").language;',
  '  name.value="irene.py"; name.dispatchEvent(new Event("input",{bubbles:true}));',
  '  await new Promise(function(r){setTimeout(r,360)});',
  '  out.pythonSaved=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"];',
  '  out.jsUntouched=!Object.prototype.hasOwnProperty.call(JSON.parse(localStorage.getItem("deskScripts")||"{}"),"irene.py");',
  '  var routed=null; window.__runPythonCode=function(n,c){routed={name:n,code:c};return true}; document.getElementById("monitor-code-run").click();',
  '  out.routed=routed; out.pythonActive=py.classList.contains("active");',
  '  out.pythonCompletion=window.__codeCommands().some(function(c){return c.name==="Turtle"});',
  '  out.loftRosterStable=window.__loftCommands().some(function(c){return c.name==="party"}) && !window.__loftCommands().some(function(c){return c.name==="Turtle"});',
  '  document.getElementById("monitor-code-lang-js").click(); name.value="broken.js"; code.value="throw new Error(\\\"code boom\\\")";',
  '  document.getElementById("monitor-code-run").click(); await new Promise(function(r){setTimeout(r,80)});',
  '  out.jsConsole=mon.classList.contains("show-console"); out.jsError=document.getElementById("monitor-console-out").textContent; out.lastError=window.__lastCodeError;',
  '  document.getElementById("monitor-console-close").dispatchEvent(new MouseEvent("click",{bubbles:true})); await new Promise(function(r){setTimeout(r,20)});',
  '  out.codeReturned=mon.classList.contains("show-code"); out.failedStatus=document.getElementById("monitor-code-ai-status").textContent;',
  '  mon.classList.remove("show-code","show-console"); mon.classList.add("here","show-caps","show-python");',
  '  document.getElementById("monitor-python").classList.add("turtle-view"); var gfx=document.getElementById("monitor-py-turtle"),gfxClicks=0;',
  '  mon.addEventListener("click",function(){gfxClicks++}); gfx.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); gfx.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));',
  '  out.gfxOwned=gfxClicks===0 && mon.classList.contains("here") && mon.classList.contains("show-python");',
  '  var shown=window.__loftTurtleCommand("svg",\'<svg viewBox="0 0 20 10" onload="bad()"><script>bad()<\\/script><path id="py-svg-probe" d="M0 0H20V10H0Z" onclick="bad()"/></svg>\');',
  '  var svgHost=document.getElementById("monitor-py-svg-display"),svgRoot=svgHost.querySelector("svg"),svgPath=svgHost.querySelector("#py-svg-probe");',
  '  out.svgDisplay=shown&&svgRoot&&svgRoot.getAttribute("viewBox")==="0 0 20 10"&&svgRoot.getAttribute("width")==="620"&&!svgRoot.hasAttribute("onload")&&!svgHost.querySelector("script")&&svgPath&&!svgPath.hasAttribute("onclick");',
  '  window.__loftTurtleCommand("screen_clear"); out.svgClears=!svgHost.firstElementChild;',
  '  document.body.innerHTML="<pre id=\\"__report\\"></pre>"; document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e)})});',
  '<\/script>',
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 1800, { patchRaf: true });
check(state && !state.error, "headless Code interaction completed", state && state.error);
if (state && !state.error) {
  check(state.pythonSaved === 'print("turtle time")' && state.jsUntouched,
    "a named Python buffer autosaves without contaminating legacy JavaScript files", state);
  check(state.draftLanguage === "python",
    "the recoverable Code draft retains its language", state.draftLanguage);
  check(state.routed && state.routed.name === "irene.py" && state.routed.code === 'print("turtle time")',
    "Run routes the exact Python name and buffer", state.routed);
  check(state.pythonActive && state.pythonCompletion && state.loftRosterStable,
    "selector styling and completion catalogs track Python without changing the Loft JS hook", state);
  check(state.jsConsole && /code boom/.test(state.jsError) && /code boom/.test(state.lastError),
    "a JavaScript Code exception opens the JS Console with the actual error", state);
  check(state.codeReturned && /failed/i.test(state.failedStatus) && !/finished/i.test(state.failedStatus),
    "Back returns to the Code and failure is not overwritten by a success status", state);
  check(state.gfxOwned,
    "clicking or double-clicking Turtle graphics stays inside Python instead of reaching the monitor repaint/swap handlers", state);
  check(state.svgDisplay && state.svgClears,
    "loftgfx SVG output is fitted, sanitized, and cleared on the native graphics surface", state);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
