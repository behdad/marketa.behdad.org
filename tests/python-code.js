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
check(/PYODIDE_PACKAGE_BASE_URL\s*=\s*"https:\/\/cdn\.jsdelivr\.net\/pyodide\/v314\.0\.2\/full\/"/.test(html) &&
      /loadPyodide\(\{[\s\S]*?indexURL:\s*"pyodide\/"[\s\S]*?packageBaseUrl:\s*PYODIDE_PACKAGE_BASE_URL/.test(html),
  "the local runtime resolves unbundled official packages from the pinned Pyodide repository");
check(/function pyRunWithImports\(source\)[\s\S]*?loadPackagesFromImports\(source\)[\s\S]*?runPythonAsync\(source\)/.test(html) &&
      /function pyDrainCodeQueue\(\)[\s\S]*?__loftTurtleCommand\("screen_clear"\)[\s\S]*?pyRunWithImports\(job\.code\)/.test(html) &&
      /function pyRun\(cmd\)[\s\S]*?pyRunWithImports\(cmd\)/.test(html),
  "REPL commands and complete Python scripts load their official import dependencies before execution");
check(/function pyDrainCodeQueue\(\)[\s\S]*?__loftTurtleCommand\("screen_clear"\)[\s\S]*?pyRunWithImports\(job\.code\)/.test(html),
  "each full Python script run starts with a clean graphics surface");
check(/id="monitor-code-explain"[^>]*>explain<\/button>/.test(html) &&
      /id="monitor-code-ai-status"[^>]*>ready<\/span>/.test(html),
  "Code AI controls use explicit, compact labels");
check(/js\["hello\.js"\]\s*=\s*CODE_STARTER/.test(html) &&
      /py\["square\.py"\]\s*=\s*CODE_PY_STARTER/.test(html) &&
      /loft\.caption\.show\(\\"hello from the loft/.test(html) &&
      /for _ in range\(4\):[\s\S]*?t\.forward\(60\)[\s\S]*?t\.right\(90\)/.test(html),
  "one-time editable hello.js and square.py examples are preloaded without overwriting user files");
check(/py\["space-filler\.py"\]\s*=\s*CODE_PY_SPACE_FILLER/.test(html) &&
      /CODE_SPACE_FILLER_KEY\s*=\s*"deskCodeSpaceFillerV1"/.test(html) &&
      /t\.goto\(-75,\s*-75\)/.test(html) &&
      /fill\(4\)/.test(html),
  "the centered space-filler turtle reaches existing players through its own one-time migration");
check(/py\["loft-type\.py"\]\s*=\s*CODE_PY_FRAUNCES_SVG/.test(html) &&
      /CODE_FRAUNCES_SVG_KEY\s*=\s*"deskCodeLoftTypeV3"/.test(html) &&
      /from loft import display_svg/.test(html) &&
      /SVGPathPen/.test(html) &&
      /import uharfbuzz as hb/.test(html) &&
      /hb\.shape\(hb_font, buffer\)/.test(html) &&
      /hb_font\.get_font_extents\(\\"ltr\\"\)/.test(html) &&
      /await googlefonts\(\\"Fraunces\\"\)/.test(html) &&
      /buffer\.add_str\(\\"LoftType\\"\)/.test(html),
  "the saved HarfBuzz + FontTools example renders LoftType from Fraunces outlines");
check(/js\["loft-type\.js"\]\s*=\s*CODE_JS_FRAUNCES_SVG/.test(html) &&
      /CODE_FRAUNCES_SVG_KEY\s*=\s*"deskCodeLoftTypeV3"/.test(html) &&
      /hasOwnProperty\.call\(js, "loft-type\.js"\)[\s\S]*?if \(!localStorage\.getItem\(CODE_FRAUNCES_SVG_KEY\)\)/.test(html) &&
      /const \{ hb, font \} = await harfbuzz\(\)/.test(html) &&
      /buffer\.addText\(\\"LoftType\\"\)/.test(html) &&
      /font\.glyphToPath\(glyph\.g\)/.test(html) &&
      /display_svg\(svg\)/.test(html),
  "the editable harfbuzzjs SVG example reaches existing profiles without a new migration key");
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
      /id="monitor-py-view-toggle" transform="translate\(71,29\.3\) scale\(0\.8\)"/.test(html) &&
      /id="monitor-console-view-toggle" transform="translate\(71,29\.3\) scale\(0\.8\)"/.test(html) &&
      /id="monitor-py-view-mark"/.test(html) &&
      /id="monitor-console-view-mark"/.test(html) &&
      /#monitor-console-view-toggle\{[^}]*opacity:0;pointer-events:none/.test(html) &&
      /#monitor-console-view-toggle\.has-graphics\{opacity:1;pointer-events:auto\}/.test(html) &&
      /#monitor-py-view-toggle\{[^}]*opacity:0;pointer-events:none/.test(html) &&
      /#monitor-py-view-toggle\.has-graphics\{opacity:1;pointer-events:auto\}/.test(html) &&
      /consoleReturnToCode && available \? "66" : "71"/.test(html) &&
      /pyReturnToCode && available \? "66" : "71"/.test(html),
  "graphics toggles appear only for output and sit between Back and Dismiss");
check(/pyReturnToCode[\s\S]*?paintPythonClose[\s\S]*?openPython\(true\)/.test(html) &&
      /consoleReturnToCode[\s\S]*?paintConsoleClose[\s\S]*?openConsole\(true\)/.test(html),
  "Code-launched Python and JavaScript consoles expose a Back path");

var turtleMatch = /var PY_TURTLE_MODULE = `([\s\S]*?)`;\n  function installPythonTurtle/.exec(html);
check(!!turtleMatch, "a self-hosted browser Turtle compatibility module is embedded");
check(/<g id="monitor-py-turtle">[\s\S]*?<svg[\s\S]*?id="monitor-py-turtle-lines"/.test(html) &&
      /PY_TURTLE_NODE_LIMIT\s*=\s*6000/.test(html),
  "Turtle renders into a bounded native SVG surface");
check(/<g id="monitor-console-svg">[\s\S]*?<svg[\s\S]*?id="monitor-console-svg-display"/.test(html) &&
      /window\.display_svg\s*=\s*function/.test(html) &&
      /function sanitizeMonitorSvg/.test(html),
  "the JavaScript Console has a native, sanitized SVG output surface");
check(/class", "py-turtle-cursor"/.test(html) &&
      /py-turtle-cursor-shell/.test(html),
  "Turtle drawings end with a turtle-shaped SVG cursor");
check(/installPythonTurtle\(py\)/.test(html) &&
      /loft\.py/.test(html) &&
      /def clear_canvas\(\):/.test(html) &&
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
  '  var jsFiles=JSON.parse(localStorage.getItem("deskScripts")||"{}");jsFiles["irene.js"]="window.irene = 1;";localStorage.setItem("deskScripts",JSON.stringify(jsFiles));',
  '  var routed=null; window.__runPythonCode=function(n,c){routed={name:n,code:c};return true}; document.getElementById("monitor-code-run").click();',
  '  out.routed=routed; out.pythonActive=py.classList.contains("active");',
  '  out.pythonCompletion=window.__codeCommands().some(function(c){return c.name==="Turtle"});',
  '  out.loftRosterStable=window.__loftCommands().some(function(c){return c.name==="party"}) && !window.__loftCommands().some(function(c){return c.name==="Turtle"});',
  '  document.getElementById("monitor-code-lang-js").click();',
  '  out.languageSwitchPreserves=name.value==="irene.py"&&code.value===\'print("turtle time")\'&&document.getElementById("monitor-code-lang-js").classList.contains("active")&&JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"]===\'print("turtle time")\'&&JSON.parse(localStorage.getItem("deskScripts")||"{}")["irene.js"]==="window.irene = 1;";',
  '  code.value=\'print("still irene")\';code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});',
  '  out.languageSwitchStorage=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"]===\'print("still irene")\'&&JSON.parse(localStorage.getItem("deskScripts")||"{}")["irene.js"]==="window.irene = 1;";',
  '  Array.from(document.querySelectorAll("#monitor-code-list .code-item")).filter(function(x){return x.textContent==="irene.js"})[0].click();',
  '  var pyBefore=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}");pyBefore["test.py"]="existing python";localStorage.setItem("deskPythonScripts",JSON.stringify(pyBefore));',
  '  name.value="test.py";name.dispatchEvent(new Event("input",{bubbles:true}));out.conflictWhileTyping=name.classList.contains("conflict");name.value="test.py.bak";name.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});',
  '  var jsBefore=JSON.parse(localStorage.getItem("deskScripts")||"{}");out.longerNameAllowed=!name.classList.contains("conflict")&&jsBefore["test.py.bak"]==="window.irene = 1;"&&JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["test.py"]==="existing python";jsBefore["taken.js"]="do not overwrite";localStorage.setItem("deskScripts",JSON.stringify(jsBefore));name.value="taken.js";code.value="window.irene = 2;";name.dispatchEvent(new Event("input",{bubbles:true}));name.focus();await new Promise(function(r){setTimeout(r,360)});name.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));name.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));out.conflictKeysInert=name.value==="taken.js"&&name.classList.contains("conflict")&&mon.classList.contains("show-code");name.dispatchEvent(new Event("blur"));',
  '  var jsAfter=JSON.parse(localStorage.getItem("deskScripts")||"{}");out.renameCollisionDetail={name:name.value,conflict:name.classList.contains("conflict"),taken:jsAfter["taken.js"],source:jsAfter["test.py.bak"]};out.renameCollision=out.conflictKeysInert&&name.value==="test.py.bak"&&!name.classList.contains("conflict")&&jsAfter["taken.js"]==="do not overwrite"&&jsAfter["test.py.bak"]==="window.irene = 2;";',
  '  name.value="broken.js"; code.value="throw new Error(\\\"code boom\\\")";',
  '  document.getElementById("monitor-code-run").click(); await new Promise(function(r){setTimeout(r,80)});',
  '  out.jsConsole=mon.classList.contains("show-console"); out.jsError=document.getElementById("monitor-console-out").textContent; out.lastError=window.__lastCodeError;',
  '  out.jsGfxInitiallyHidden=!document.getElementById("monitor-console-view-toggle").classList.contains("has-graphics");',
  '  var jsShown=window.display_svg(\'<svg viewBox="0 0 20 10" onload="bad()"><script>bad()<\\/script><path id="js-svg-probe" d="M0 0H20V10H0Z" onclick="bad()"/></svg>\');',
  '  var jsSvgHost=document.getElementById("monitor-console-svg-display"),jsSvgRoot=jsSvgHost.querySelector("svg"),jsSvgPath=jsSvgHost.querySelector("#js-svg-probe");',
  '  out.jsSvgDisplay=jsShown&&document.getElementById("monitor-console-view-toggle").classList.contains("has-graphics")&&document.getElementById("monitor-console").classList.contains("svg-view")&&jsSvgRoot&&jsSvgRoot.getAttribute("viewBox")==="0 0 20 10"&&jsSvgRoot.getAttribute("width")==="620"&&!jsSvgRoot.hasAttribute("onload")&&!jsSvgHost.querySelector("script")&&jsSvgPath&&!jsSvgPath.hasAttribute("onclick");',
  '  document.getElementById("monitor-console-view-toggle").dispatchEvent(new MouseEvent("click",{bubbles:true})); out.jsSvgToggle=!document.getElementById("monitor-console").classList.contains("svg-view")&&!!jsSvgHost.firstElementChild;',
  '  document.getElementById("monitor-console-close").dispatchEvent(new MouseEvent("click",{bubbles:true})); await new Promise(function(r){setTimeout(r,20)});',
  '  out.consoleDismissed=!mon.classList.contains("show-console")&&!mon.classList.contains("show-code");',
  '  window.__openMonitorCode();document.getElementById("monitor-code-run").click();await new Promise(function(r){setTimeout(r,80)});',
  '  document.getElementById("monitor-console-back").dispatchEvent(new MouseEvent("click",{bubbles:true})); await new Promise(function(r){setTimeout(r,20)});',
  '  out.codeReturned=mon.classList.contains("show-code"); out.failedStatus=document.getElementById("monitor-code-ai-status").textContent;',
  '  var aiBody=null;window.__monitorChatTurnstile=function(){return Promise.resolve("code-test-token");};window.fetch=function(_url,opts){aiBody=JSON.parse(opts.body);return Promise.resolve(new Response(JSON.stringify({reply:JSON.stringify({text:"reviewed",suggestion:"",replace:false,edits:[]})}),{status:200,headers:{"Content-Type":"application/json"}}));};',
  '  document.getElementById("monitor-code-explain").click();await new Promise(function(r){setTimeout(r,100)});',
  '  var api=aiBody&&aiBody.context&&aiBody.context.scripting_api,typed=api&&api.typed||[];out.codeAiApi={mode:aiBody&&aiBody.mode,language:aiBody&&aiBody.code&&aiBody.code.language,party:typed.find(function(x){return x.id==="garden.set"}),caption:typed.find(function(x){return x.id==="caption.show"}),runtime:api&&api.runtime,globals:api&&Object.prototype.hasOwnProperty.call(api,"globals"),capabilities:typed.length,commands:window.loft.api.capabilities().length};',
  '  mon.classList.remove("show-code","show-console"); mon.classList.add("here","show-caps","show-python");',
  '  out.pyGfxInitiallyHidden=!document.getElementById("monitor-py-view-toggle").classList.contains("has-graphics");',
  '  document.getElementById("monitor-python").classList.add("turtle-view"); var gfx=document.getElementById("monitor-py-turtle"),gfxClicks=0;',
  '  mon.addEventListener("click",function(){gfxClicks++}); gfx.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true})); gfx.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true}));',
  '  out.gfxOwned=gfxClicks===0 && mon.classList.contains("here") && mon.classList.contains("show-python");',
  '  var shown=window.__loftTurtleCommand("svg",\'<svg viewBox="0 0 20 10" onload="bad()"><script>bad()<\\/script><path id="py-svg-probe" d="M0 0H20V10H0Z" onclick="bad()"/></svg>\');',
  '  var svgHost=document.getElementById("monitor-py-svg-display"),svgRoot=svgHost.querySelector("svg"),svgPath=svgHost.querySelector("#py-svg-probe");',
  '  out.svgDisplay=shown&&document.getElementById("monitor-py-view-toggle").classList.contains("has-graphics")&&svgRoot&&svgRoot.getAttribute("viewBox")==="0 0 20 10"&&svgRoot.getAttribute("width")==="620"&&!svgRoot.hasAttribute("onload")&&!svgHost.querySelector("script")&&svgPath&&!svgPath.hasAttribute("onclick");',
  '  window.__loftTurtleCommand("screen_clear"); out.svgClears=!svgHost.firstElementChild&&!document.getElementById("monitor-py-view-toggle").classList.contains("has-graphics");',
  '  document.body.innerHTML="<pre id=\\"__report\\"></pre>"; document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e)})});',
  '<\/script>',
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 2400, { patchRaf: true });
check(state && !state.error, "headless Code interaction completed", state && state.error);
if (state && !state.error) {
  check(state.pythonSaved === 'print("turtle time")' && state.jsUntouched,
    "a named Python buffer autosaves without contaminating legacy JavaScript files", state);
  check(state.languageSwitchPreserves && state.languageSwitchStorage,
    "language pills change only the runtime without renaming, navigating, migrating, or overwriting files", state);
  check(state.conflictWhileTyping && state.longerNameAllowed && state.conflictKeysInert && state.renameCollision,
    "an exact collision warns while typing, ignores Enter/Escape, allows a longer unique name, and reverts only on blur", JSON.stringify(state));
  check(state.draftLanguage === "python",
    "the recoverable Code draft retains its language", state.draftLanguage);
  check(state.routed && state.routed.name === "irene.py" && state.routed.code === 'print("turtle time")',
    "Run routes the exact Python name and buffer", state.routed);
  check(state.pythonActive && state.pythonCompletion && state.loftRosterStable,
    "selector styling and completion catalogs track Python without changing the Loft JS hook", state);
  check(state.jsConsole && /code boom/.test(state.jsError) && /code boom/.test(state.lastError),
    "a JavaScript Code exception opens the JS Console with the actual error", state);
  check(state.jsGfxInitiallyHidden && state.jsSvgDisplay && state.jsSvgToggle,
    "JavaScript SVG output is fitted and sanitized, and its view toggle preserves the drawing", state);
  check(state.consoleDismissed && state.codeReturned && /failed/i.test(state.failedStatus) && !/finished/i.test(state.failedStatus),
    "Dismiss leaves Code closed while the separate Back returns to it without overwriting failure status", state);
  check(state.codeAiApi && state.codeAiApi.mode === "code_assist" && state.codeAiApi.language === "js" &&
      state.codeAiApi.party && state.codeAiApi.party.aliases.includes("party.set") &&
      state.codeAiApi.caption && state.codeAiApi.caption.argOrder.join(",") === "text" &&
      /top-level await/.test(state.codeAiApi.runtime) && !state.codeAiApi.globals &&
      state.codeAiApi.capabilities === state.codeAiApi.commands,
    "the JavaScript coder receives the compact typed manifest and async calling context", state.codeAiApi);
  check(state.gfxOwned,
    "clicking or double-clicking Turtle graphics stays inside Python instead of reaching the monitor repaint/swap handlers", state);
  check(state.pyGfxInitiallyHidden && state.svgDisplay && state.svgClears,
    "loft SVG output is fitted, sanitized, and cleared on the native graphics surface", state);
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
