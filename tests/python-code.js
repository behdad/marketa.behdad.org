#!/usr/bin/env node
// JavaScript/Python Code and browser-Turtle regression checks.
"use strict";

var fs = require("fs");
var path = require("path");
var child = require("child_process");
var vm = require("vm");
var lib = require("./lib");

var ROOT = path.join(__dirname, "..");
var html = fs.readFileSync(path.join(ROOT, "rsvp.html"), "utf8");
var worker = fs.readFileSync(path.join(ROOT, "chat.js"), "utf8");
var manifestSource = fs.readFileSync(path.join(ROOT, "code-snippets", "manifest.js"), "utf8");
var manifestContext = { window: {} };
vm.runInNewContext(manifestSource, manifestContext);
var snippets = manifestContext.window.__loftCodeSnippets;
function snippetDescriptor(filename) { return snippets.find(function (entry) { return entry.filename === filename; }); }
function snippet(filename) { return fs.readFileSync(path.join(ROOT, snippetDescriptor(filename).path), "utf8"); }
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
      /captureLazyScriptGlobal\("loadPyodide"\)/.test(html) &&
      /pyodideLoader\(\{[\s\S]*?indexURL:\s*"pyodide\/"[\s\S]*?packageBaseUrl:\s*PYODIDE_PACKAGE_BASE_URL/.test(html),
  "the local runtime privately captures its loader and resolves unbundled official packages from the pinned Pyodide repository");
check(/function pyRunWithImports\(source\)[\s\S]*?loadPackagesFromImports\(source\)[\s\S]*?runPythonAsync\(source\)/.test(html) &&
      /function pyDrainCodeQueue\(\)[\s\S]*?__loftTurtleCommand\("screen_clear"\)[\s\S]*?pyRunWithImports\(job\.code\)/.test(html) &&
      /function pyRun\(cmd\)[\s\S]*?pyRunWithImports\(cmd\)/.test(html),
  "REPL commands and complete Python scripts load their official import dependencies before execution");
check(/function pyDrainCodeQueue\(\)[\s\S]*?__loftTurtleCommand\("screen_clear"\)[\s\S]*?pyRunWithImports\(job\.code\)/.test(html),
  "each full Python script run starts with a clean graphics surface");
check(/id="monitor-code-explain"[^>]*>explain<\/button>/.test(html) &&
      /id="monitor-code-ai-status"[^>]*>ready<\/span>/.test(html),
  "Code AI controls use explicit, compact labels");
var snippetFilenames = snippets.map(function (entry) { return entry.filename; });
check(Array.isArray(snippets) && snippets.length === 8 &&
      snippets.every(function (entry) { return entry && typeof entry.filename === "string" && /\.(?:js|py)$/.test(entry.filename) && typeof entry.path === "string" && /-(?:js|py)\.txt$/.test(entry.path) && fs.existsSync(path.join(ROOT, entry.path)); }) &&
      snippetFilenames.join("|") !== snippetFilenames.slice().sort().join("|"),
  "the manifest maps every canonical filename to one handler-safe source transport without relying on authored order");
check(/src="code-snippets\/manifest\.js\?v=[^"]+"/.test(html) &&
      (html.match(/src="code-snippets\/trailer\.js"/g) || []).length === 0 &&
      !/CODE_BUILTINS\.forEach\(codeFetchBuiltin\)/.test(html) &&
      !/CODE_STARTER|CODE_PY_STARTER|CODE_PY_HELLO|CODE_PY_LOFT_API|CODE_PY_SPACE_FILLER|CODE_PY_FRAUNCES|CODE_JS_FRAUNCES|deskCodeExamples|deskCodeHelloSync/.test(html),
  "Code keeps canonical files external and leaves the Trailer unloaded until activation");
var codeRunCurrentSource = (/function codeRunCurrent\(\)[\s\S]*?\/\/ Code assistance/.exec(html) || [""])[0];
check(/codeRunCode\(name, code/.test(codeRunCurrentSource) && !/trailer\.js|trailer/i.test(codeRunCurrentSource),
  "Code runs every JavaScript buffer through its general source runner without a Trailer filename branch");
var helloJs = snippet("hello.js"), helloPy = snippet("hello.py"), squarePy = snippet("square.py");
check(/loft\.party\.set\(true\)/.test(helloJs) && /await loft\.room\.go\("garden"\)/.test(helloJs) && /await loft\.caption\.show\("hello from the loft 👋"\)/.test(helloJs) &&
      /import loft/.test(helloPy) && /loft\.party\.set\(True\)/.test(helloPy) && /await loft\.room\.go\("garden"\)/.test(helloPy) &&
      /for _ in range\(4\):[\s\S]*?t\.forward\(60\)[\s\S]*?t\.right\(90\)/.test(squarePy),
  "the canonical JavaScript/Python hello pair and Turtle square remain authored samples");
var fillerPy = snippet("space-filler.py"), loftApiPy = snippet("loft-api.py");
check(/t\.goto\(-75,\s*-75\)/.test(fillerPy) && /fill\(4\)/.test(fillerPy) &&
      /import loft/.test(loftApiPy) && /loft\.game\.status\(\)/.test(loftApiPy) && /loft\.weather\.rain\.set\(None\)/.test(loftApiPy),
  "the canonical recursive Turtle and typed Loft API samples remain intact");
var loftTypePy = snippet("loft-type.py"), loftTypeJs = snippet("loft-type.js");
check(/import loft/.test(loftTypePy) && /SVGPathPen/.test(loftTypePy) && /import uharfbuzz as hb/.test(loftTypePy) &&
      /await loft\.fonts\.google\("Fraunces"\)/.test(loftTypePy) && /buffer\.add_str\("LoftType"\)/.test(loftTypePy) &&
      /loft\.presentation\.svg\.show\(svg\)/.test(loftTypePy) &&
      /const \{ hb, font \} = await loft\.typography\.harfbuzz\(\)/.test(loftTypeJs) && /buffer\.addText\("LoftType"\)/.test(loftTypeJs) &&
      /font\.glyphToPath\(glyph\.g\)/.test(loftTypeJs) && /loft\.presentation\.svg\.show\(svg\)/.test(loftTypeJs),
  "both canonical HarfBuzz + Fraunces package demos render LoftType from outlines");
check(/\["js", "python"\]\.forEach\(function \(language\)/.test(html) &&
      /codeLoad\(file\.name, file\.language\)/.test(html) &&
      /file\.language === codeLanguage/.test(html),
  "the sidebar lists both language stores and opening a file selects its stored runtime");
check(/\.code-item\.builtin\{font-style:italic\}/.test(html) &&
      /\.code-item\.builtin\.edited\{font-style:normal\}/.test(html) &&
      /\.code-item\.unsaved\{font-style:italic\}/.test(html) &&
      !/\.code-item\.(?:builtin|user-file|unsaved)\{[^}]*color:/.test(html) &&
      !/\.code-item\.(?:builtin|user-file)::before/.test(html) &&
      /it\.title = file\.edited \? "canonical file · locally edited" : "canonical file"/.test(html) &&
      /it\.title = "your saved file"/.test(html),
  "only unsaved and untouched canonical filenames are italic; exact tooltips distinguish ownership without icons or colors");
var codeLinesRule = (/\.code-lines\{([^}]+)\}/.exec(html) || ["", ""])[1];
check(/id="monitor-code-lines" class="code-lines">1<\/div><textarea[^>]*wrap="off"/.test(html) &&
      /display:grid/.test((/\.code-editor\{([^}]+)\}/.exec(html) || ["", ""])[1]) &&
      /pointer-events:none/.test(codeLinesRule) &&
      !/(?:position|transform|will-change)\s*:/.test(codeLinesRule) &&
      /function codeSyncLineNumbers\(\)/.test(html) &&
      /codeCode\.addEventListener\("scroll", function \(\) \{ codeSyncLineNumbers\(\)/.test(html),
  "the noninteractive static-grid gutter mirrors the native non-wrapping textarea without a WebKit-sensitive layer");
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

var turtleMatch = /var PY_TURTLE_MODULE = `([\s\S]*?)`;\n  function installPythonModules/.exec(html);
check(!!turtleMatch, "a self-hosted browser Turtle compatibility module is embedded");
check(/<g id="monitor-py-turtle">[\s\S]*?<svg[\s\S]*?id="monitor-py-turtle-lines"/.test(html) &&
      /PY_TURTLE_NODE_LIMIT\s*=\s*6000/.test(html),
  "Turtle renders into a bounded native SVG surface");
check(/<g id="monitor-console-svg">[\s\S]*?<svg[\s\S]*?id="monitor-console-svg-display"/.test(html) &&
      /presentationSvg\.show\s*=\s*function/.test(html) &&
      /function sanitizeMonitorSvg/.test(html),
  "the JavaScript Console has a native, sanitized SVG output surface");
check(/class", "py-turtle-cursor"/.test(html) &&
      /py-turtle-cursor-shell/.test(html),
  "Turtle drawings end with a turtle-shaped SVG cursor");
check(/installPythonModules\(py\)/.test(html) &&
      /loft\.py/.test(html) &&
      /py\.runPython\("import loft"\)/.test(html) &&
      /typed Loft API ready/.test(html) &&
      /def _clear_svg\(\):/.test(html) &&
      /_install_native\("presentation\.svg\.show", _show_svg\)/.test(html) &&
      /function pyDisplaySvg/.test(html) &&
      /sys\.path\.insert\(0,p\)/.test(html),
  "the API, Turtle and sanitized SVG modules are installed before user Python imports them");
check(/pyLoadState\s*=\s*"ready";[\s\S]*?pyPrint\(">>> import loft", "console-dim"\)[\s\S]*?typed Loft API ready/.test(html),
  "the completed Python boot transcript leaves the automatic import loft line visible");
check(/window\.__pyRuntimeState\s*=\s*function \(\) \{ return pyLoadState \|\| "stopped"; \}/.test(html) &&
      /id: "app\.python\.status"[\s\S]*?run: pythonAppState/.test(html),
  "the public Python status query derives readiness from the runtime owner's real boot state");
check(/typed Loft API ready as the imported `loft` module/.test(html) &&
      /typed Loft API ready as the preloaded `loft` global/.test(html),
  "empty Python and JavaScript Code buffers explain their respective Loft API boot modes");

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

var collisionHarness = [
  '<script>',
  '(async function(){',
  '  if (!location.search) {',
  '    localStorage.setItem("deskScripts",JSON.stringify({"loft-type.js":"window.migrated = true;","keep.js":"window.keep = true;"}));',
  '    localStorage.setItem("deskPythonScripts",JSON.stringify({"space-filler.py":"","square.py":"legacy square","keep.py":"print(\\"keep\\")"}));',
  '    localStorage.setItem("deskCodeBuiltinOverrides",JSON.stringify({"square.py":""}));',
  '    location.replace(location.href+"?canonical-collision=1"); return;',
  '  }',
  '  await new Promise(function(r){setTimeout(r,40)});',
  '  function own(o,k){return Object.prototype.hasOwnProperty.call(o,k);}',
  '  function items(label){return Array.from(document.querySelectorAll("#monitor-code-list .code-item")).filter(function(item){return item.textContent===label;});}',
  '  function builtin(label){return items(label).find(function(item){return item.classList.contains("builtin");});}',
  '  var code=document.getElementById("monitor-code-code"),del=document.getElementById("monitor-code-del");',
  '  var js=JSON.parse(localStorage.getItem("deskScripts")||"{}"),py=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}"),overrides=JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}");',
  '  var out={oneRow:items("loft-type.js").length===1&&items("space-filler.py").length===1&&items("square.py").length===1,storesClean:!own(js,"loft-type.js")&&!own(py,"space-filler.py")&&!own(py,"square.py"),unrelated:js["keep.js"]==="window.keep = true;"&&py["keep.py"]===\'print("keep")\',migrated:overrides["loft-type.js"]==="window.migrated = true;"&&own(overrides,"space-filler.py")&&overrides["space-filler.py"]==="",explicitEmpty:own(overrides,"square.py")&&overrides["square.py"]==="",styles:getComputedStyle(builtin("hello.js")).fontStyle==="italic"&&getComputedStyle(builtin("loft-type.js")).fontStyle==="normal"&&getComputedStyle(items("keep.js")[0]).fontStyle==="normal"&&getComputedStyle(items("unsaved")[0]).fontStyle==="italic"};',
  '  builtin("loft-type.js").click();out.migratedLoads=code.value==="window.migrated = true;";del.click();await new Promise(function(r){setTimeout(r,20)});out.resetLoadsCanonical=code.value===window.__codeSnippetResourceLoader("code-snippets/loft-type-js.txt")&&!own(JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}"),"loft-type.js");',
  '  builtin("space-filler.py").click();out.emptyLoads=code.value===""&&!del.disabled;del.click();await new Promise(function(r){setTimeout(r,20)});out.emptyReset=code.value===window.__codeSnippetResourceLoader("code-snippets/space-filler-py.txt");',
  '  builtin("square.py").click();out.explicitEmptyLoads=code.value===""&&!del.disabled;del.click();await new Promise(function(r){setTimeout(r,20)});var squareCanonical=window.__codeSnippetResourceLoader("code-snippets/square-py.txt");out.explicitReset=code.value===squareCanonical;out.pythonCanonicalLines=document.getElementById("monitor-code-lines").textContent.split("\\n").length===squareCanonical.split("\\n").length;',
  '  out.transportRequests=window.__codeSnippetResourceRequests.slice();out.transportCanonical=out.transportRequests.every(function(request){return /-(?:js|py)\\.txt$/.test(request);})&&out.transportRequests.includes("code-snippets/space-filler-py.txt")&&out.transportRequests.includes("code-snippets/square-py.txt");',
  '  js=JSON.parse(localStorage.getItem("deskScripts")||"{}");py=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}");out.afterReset=items("loft-type.js").length===1&&items("space-filler.py").length===1&&items("square.py").length===1&&js["keep.js"]==="window.keep = true;"&&py["keep.py"]===\'print("keep")\';',
  '  document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e)})});',
  '<\/script>',
].join("\n");

var collisionState = lib.runPageSync("rsvp.html", collisionHarness, 2400, { patchRaf: true });
check(collisionState && !collisionState.error && collisionState.oneRow && collisionState.storesClean && collisionState.unrelated && collisionState.styles &&
      collisionState.migrated && collisionState.explicitEmpty && collisionState.migratedLoads && collisionState.resetLoadsCanonical &&
      collisionState.emptyLoads && collisionState.emptyReset && collisionState.explicitEmptyLoads && collisionState.explicitReset && collisionState.pythonCanonicalLines && collisionState.transportCanonical && collisionState.afterReset,
  "same-name saved files collapse into one canonical row while Python resets fetch exact handler-safe transport bytes",
  collisionState && (collisionState.error || JSON.stringify(collisionState)));

var lineNumberHarness = [
  '<script>',
  '(async function(){try{',
  'localStorage.setItem("deskScripts",JSON.stringify({"many.js":["const first = 1;","const second = 2;","const third = 3;"].join("\\n")}));localStorage.setItem("deskPythonScripts",JSON.stringify({"many.py":["first = 1","second = 2","third = 3","fourth = 4"].join("\\n")}));',
  'var mon=document.getElementById("office-monitor");mon.classList.add("screen-on","show-caps");window.__loftControllers.edit("many.js");await new Promise(function(r){setTimeout(r,100)});',
  'var code=document.getElementById("monitor-code-code"),lines=document.getElementById("monitor-code-lines"),editor=code.closest(".code-editor"),name=document.getElementById("monitor-code-name"),out={errors:window.__errs.slice()};',
  'out.jsFile=name.value==="many.js"&&lines.textContent==="1\\n2\\n3";',
  'window.__loftControllers.edit("many.py");await new Promise(function(r){setTimeout(r,20)});out.pythonFile=name.value==="many.py"&&lines.textContent==="1\\n2\\n3\\n4"&&document.getElementById("monitor-code-lang-py").classList.contains("active");',
  'document.getElementById("monitor-code-lang-js").click();out.languageSwitch=lines.textContent==="1\\n2\\n3\\n4"&&document.getElementById("monitor-code-lang-js").classList.contains("active");',
  'var content=[];for(var i=1;i<=120;i++)content.push(i===60?"const veryLongLine = "+"x".repeat(240):"line "+i);code.value=content.join("\\n");code.setSelectionRange(17,39);code.dispatchEvent(new Event("input",{bubbles:true}));',
  'var beforeLeft=lines.getBoundingClientRect().left;code.scrollTop=83;code.scrollLeft=61;code.dispatchEvent(new Event("scroll"));var afterLeft=lines.getBoundingClientRect().left,style=getComputedStyle(code);',
  'out.edits=lines.textContent.split("\\n").length===120&&lines.textContent.endsWith("120");out.scroll=Math.abs(lines.scrollTop-code.scrollTop)<1&&lines.scrollLeft===0&&beforeLeft===afterLeft;out.noWrap=code.getAttribute("wrap")==="off"&&style.whiteSpace==="pre"&&code.scrollWidth>code.clientWidth&&code.scrollLeft>0;out.nativeSelection=code.selectionStart===17&&code.selectionEnd===39;out.width=code.clientWidth/editor.clientWidth>.88;out.gutter=getComputedStyle(lines).pointerEvents==="none"&&lines.tabIndex<0;',
  'window.__resetMonitorAppState("code");out.appReset=code.value===""&&lines.textContent==="1"&&lines.scrollTop===0;',
  'window.__loftControllers.edit("hello.js");await new Promise(function(r){setTimeout(r,30)});var canonicalCount=window.__codeSnippetResourceLoader("code-snippets/hello-js.txt").split("\\n").length;out.openCanonical=lines.textContent.split("\\n").length===canonicalCount;code.value="one line";code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});document.getElementById("monitor-code-del").click();out.canonicalReset=lines.textContent.split("\\n").length===canonicalCount;',
  'document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify(out);',
  '}catch(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e),errors:window.__errs});}})();',
  '<\/script>',
].join("\n");
var lineNumberState = lib.runPageSync("rsvp.html", lineNumberHarness, 3000, { patchRaf: true });
check(lineNumberState && !lineNumberState.error && lineNumberState.errors.length === 0 && lineNumberState.jsFile && lineNumberState.pythonFile &&
      lineNumberState.languageSwitch && lineNumberState.edits && lineNumberState.scroll && lineNumberState.noWrap && lineNumberState.nativeSelection &&
      lineNumberState.width && lineNumberState.gutter && lineNumberState.appReset && lineNumberState.openCanonical && lineNumberState.canonicalReset,
  "Code line numbers track JS/Python files, edits, language changes, scrolling, resets, and canonical opens without wrapping or stealing native selection",
  lineNumberState && (lineNumberState.error || JSON.stringify(lineNumberState)));

var trailerStopHarness = [
  '<script>(async function(){try{',
  'localStorage.removeItem("deskCodeBuiltinOverrides");var mon=document.getElementById("office-monitor");mon.classList.add("screen-on","show-caps","show-code");await new Promise(function(r){setTimeout(r,40)});',
  'var item=Array.from(document.querySelectorAll("#monitor-code-list .code-item")).find(function(node){return node.textContent==="trailer.js";});item.click();await new Promise(function(r){setTimeout(r,20)});document.getElementById("monitor-code-run").click();await new Promise(function(r){setTimeout(r,900)});var active=!!window.__cinematic,stopResult=window.__loftControllers.stop(),deadline=performance.now()+2200;while((window.__cinematic||window.loft.session.preview.status().value.active)&&performance.now()<deadline)await new Promise(function(r){setTimeout(r,40)});',
  'var out={errors:window.__errs,active:active,stop:/stopped/.test(stopResult),inactive:!window.__cinematic&&!window.loft.session.preview.status().value.active,status:document.getElementById("monitor-code-ai-status").textContent,last:window.__lastCodeError||""};document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify(out);',
  '}catch(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e),errors:window.__errs});}})();<\/script>'
].join("\n");
var trailerStopState = lib.runPageSync("rsvp.html", trailerStopHarness, 5500, { patchRaf: true, forceHybridPointer: true });
check(trailerStopState && !trailerStopState.error && trailerStopState.errors.length === 0 && trailerStopState.active && trailerStopState.stop && trailerStopState.inactive && /stopped/.test(trailerStopState.status) && !trailerStopState.last,
  "Code Stop cancels the canonical Trailer through the same ordinary script runner and restores its preview",
  trailerStopState && (trailerStopState.error || JSON.stringify(trailerStopState)));

var harness = [
  '<script>',
  '(async function(){',
  '  var out={};',
  '  localStorage.removeItem("deskScripts"); localStorage.removeItem("deskPythonScripts"); localStorage.removeItem("deskCodeDraft"); localStorage.removeItem("deskCodeLanguage"); localStorage.removeItem("deskCodeBuiltinOverrides");',
  '  var resourceCalls=[],resourceLoader=window.__codeSnippetResourceLoader;window.__codeSnippetResourceLoader=function(path){resourceCalls.push(path);return resourceLoader(path);};',
  '  var mon=document.getElementById("office-monitor"); mon.classList.add("screen-on","show-caps","show-code");',
  '  var name=document.getElementById("monitor-code-name"), code=document.getElementById("monitor-code-code"), py=document.getElementById("monitor-code-lang-py");',
  '  await new Promise(function(r){setTimeout(r,30)});out.noEagerTrailer=resourceCalls.indexOf("code-snippets/trailer-js.txt")<0;',
  '  function codeItem(label,kind){return Array.from(document.querySelectorAll("#monitor-code-list .code-item")).find(function(item){return item.textContent===label&&(!kind||item.classList.contains(kind));});}',
  '  var helloItem=codeItem("hello.js","builtin");helloItem.click();await new Promise(function(r){setTimeout(r,20)});out.builtinHello=code.value;out.builtinIdentity=name.value;code.value="";code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});var emptyOverrides=JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}");out.emptyOverride=Object.prototype.hasOwnProperty.call(emptyOverrides,"hello.js")&&emptyOverrides["hello.js"]==="";out.builtinSelectedAfterEdit=codeItem("hello.js","builtin").classList.contains("active")&&codeItem("hello.js","builtin").classList.contains("edited");document.getElementById("monitor-code-del").click();out.builtinReset=/loft\\.party\\.set\\(true\\)/.test(code.value)&&!Object.prototype.hasOwnProperty.call(JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}"),"hello.js");',
  '  codeItem("trailer.js","builtin").click();await new Promise(function(r){setTimeout(r,20)});out.trailerLoadedOnSelection=resourceCalls.filter(function(path){return path==="code-snippets/trailer-js.txt";}).length===1;out.trailer={code:code.value,name:name.value,editable:!code.readOnly&&name.readOnly,runEnabled:!document.getElementById("monitor-code-run").disabled,resetInitiallyDisabled:document.getElementById("monitor-code-del").disabled};code.value="window.__ordinaryTrailerBuffer=(window.__ordinaryTrailerBuffer||0)+1;";code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});out.trailerOverride=JSON.parse(localStorage.getItem("deskCodeBuiltinOverrides")||"{}")["trailer.js"];document.getElementById("monitor-code-run").click();await new Promise(function(r){setTimeout(r,80)});out.trailerOrdinaryRun=window.__ordinaryTrailerBuffer===1&&!window.__cinematic&&mon.classList.contains("show-console");window.__closeMonitorConsole();window.__openMonitorCode();await new Promise(function(r){setTimeout(r,20)});document.getElementById("monitor-code-del").click();out.trailerReset=code.value===resourceLoader("code-snippets/trailer-js.txt");',
  '  window.__loftControllers.edit("zebra.js");code.value="window.zebra=1";code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});window.__loftControllers.edit("Aardvark.js");code.value="window.aardvark=1";code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});var items=Array.from(document.querySelectorAll("#monitor-code-list .code-item")),labels=items.map(function(item){return item.textContent;}),rest=labels.slice(1),sorted=rest.slice().sort(function(a,b){var aa=a.toLowerCase(),bb=b.toLowerCase();return aa<bb?-1:aa>bb?1:a<b?-1:a>b?1:0;});out.sortedMerged=labels[0]==="unsaved"&&rest.join("|")===sorted.join("|")&&labels.includes("hello.js")&&labels.includes("trailer.js")&&labels.includes("Aardvark.js")&&labels.includes("zebra.js")&&!!codeItem("hello.js","builtin")&&!!codeItem("Aardvark.js","user-file");out.selectionAfterResort=codeItem("Aardvark.js","user-file").classList.contains("active");',
  '  window.__loftControllers.edit();',
  '  py.click(); code.value="print(\\\"turtle time\\\")"; code.dispatchEvent(new Event("input",{bubbles:true}));',
  '  await new Promise(function(r){setTimeout(r,180)});',
  '  out.draftLanguage=JSON.parse(localStorage.getItem("deskCodeDraft")||"{}").language;',
  '  name.value="irene.py"; name.dispatchEvent(new Event("input",{bubbles:true}));',
  '  await new Promise(function(r){setTimeout(r,360)});',
  '  out.pythonSaved=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"];',
  '  out.jsUntouched=!Object.prototype.hasOwnProperty.call(JSON.parse(localStorage.getItem("deskScripts")||"{}"),"irene.py");',
  '  var jsFiles=JSON.parse(localStorage.getItem("deskScripts")||"{}");jsFiles["status.js"]="window.loft.game.status();";localStorage.setItem("deskScripts",JSON.stringify(jsFiles));',
  '  var routed=null; window.__runPythonCode=function(n,c){routed={name:n,code:c};return true}; document.getElementById("monitor-code-run").click();',
  '  out.routed=routed; out.pythonActive=py.classList.contains("active");',
  '  out.pythonCompletion=window.__codeCommands().some(function(c){return c.name==="Turtle"});',
  '  out.loftRosterStable=window.__loftCommands().some(function(c){return c.name==="loft.party.set"}) && !window.__loftCommands().some(function(c){return c.name==="Turtle"});',
  '  document.getElementById("monitor-code-lang-js").click();',
  '  out.languageSwitchPreserves=name.value==="irene.py"&&code.value===\'print("turtle time")\'&&document.getElementById("monitor-code-lang-js").classList.contains("active")&&JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"]===\'print("turtle time")\'&&JSON.parse(localStorage.getItem("deskScripts")||"{}")["status.js"]==="window.loft.game.status();";',
  '  code.value=\'print("still irene")\';code.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});',
  '  out.languageSwitchStorage=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["irene.py"]===\'print("still irene")\'&&JSON.parse(localStorage.getItem("deskScripts")||"{}")["status.js"]==="window.loft.game.status();";',
  '  Array.from(document.querySelectorAll("#monitor-code-list .code-item")).filter(function(x){return x.textContent==="status.js"})[0].click();',
  '  var pyBefore=JSON.parse(localStorage.getItem("deskPythonScripts")||"{}");pyBefore["test.py"]="existing python";localStorage.setItem("deskPythonScripts",JSON.stringify(pyBefore));',
  '  name.value="test.py";name.dispatchEvent(new Event("input",{bubbles:true}));out.conflictWhileTyping=name.classList.contains("conflict");name.value="test.py.bak";name.dispatchEvent(new Event("input",{bubbles:true}));await new Promise(function(r){setTimeout(r,360)});',
  '  var jsBefore=JSON.parse(localStorage.getItem("deskScripts")||"{}");out.longerNameAllowed=!name.classList.contains("conflict")&&jsBefore["test.py.bak"]==="window.loft.game.status();"&&JSON.parse(localStorage.getItem("deskPythonScripts")||"{}")["test.py"]==="existing python";jsBefore["taken.js"]="do not overwrite";localStorage.setItem("deskScripts",JSON.stringify(jsBefore));name.value="taken.js";code.value="window.loft.game.status(); // edited";name.dispatchEvent(new Event("input",{bubbles:true}));name.focus();await new Promise(function(r){setTimeout(r,360)});name.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));name.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));out.conflictKeysInert=name.value==="taken.js"&&name.classList.contains("conflict")&&mon.classList.contains("show-code");name.dispatchEvent(new Event("blur"));',
  '  var jsAfter=JSON.parse(localStorage.getItem("deskScripts")||"{}");out.renameCollisionDetail={name:name.value,conflict:name.classList.contains("conflict"),taken:jsAfter["taken.js"],source:jsAfter["test.py.bak"]};out.renameCollision=out.conflictKeysInert&&name.value==="test.py.bak"&&!name.classList.contains("conflict")&&jsAfter["taken.js"]==="do not overwrite"&&jsAfter["test.py.bak"]==="window.loft.game.status(); // edited";',
  '  name.value="broken.js"; code.value="throw new Error(\\\"code boom\\\")";',
  '  document.getElementById("monitor-code-run").click(); await new Promise(function(r){setTimeout(r,80)});',
  '  out.jsConsole=mon.classList.contains("show-console"); out.jsError=document.getElementById("monitor-console-out").textContent; out.lastError=window.__lastCodeError;',
  '  out.jsGfxInitiallyHidden=!document.getElementById("monitor-console-view-toggle").classList.contains("has-graphics");',
  '  var jsShown=window.loft.presentation.svg.show(\'<svg viewBox="0 0 20 10" onload="bad()"><script>bad()<\\/script><path id="js-svg-probe" d="M0 0H20V10H0Z" onclick="bad()"/></svg>\');',
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
  '  window.__goToStage("office");await new Promise(function(r){setTimeout(r,100)});var runtimeStyle=document.createElement("style");runtimeStyle.textContent="#monitor-console,#monitor-python,#monitor-linux{transition:none!important}";document.head.appendChild(runtimeStyle);var runtimeClasses=["show-console","show-python","show-linux"],runtimeInputs=["monitor-console-in","monitor-py-in","monitor-linux-in"],runtimeFocus={},focusSink=document.createElement("button");document.body.appendChild(focusSink);for(var runtimeIndex=0;runtimeIndex<runtimeClasses.length;runtimeIndex++){mon.classList.remove.apply(mon.classList,runtimeClasses);mon.classList.add(runtimeClasses[runtimeIndex]);focusSink.focus();var runtimeInput=document.getElementById(runtimeInputs[runtimeIndex]),focusResult=window.__refocusMonitorRuntime();runtimeFocus[runtimeClasses[runtimeIndex]]={focused:document.activeElement===runtimeInput,result:focusResult,active:document.activeElement&&document.activeElement.id};}focusSink.remove();runtimeStyle.remove();out.runtimeFocus=runtimeFocus;',
  '  document.body.innerHTML="<pre id=\\"__report\\"></pre>"; document.getElementById("__report").textContent=JSON.stringify(out);',
  '})().catch(function(e){document.body.innerHTML="<pre id=\\"__report\\"></pre>";document.getElementById("__report").textContent=JSON.stringify({error:String(e&&e.stack||e)})});',
  '<\/script>',
].join("\n");

var state = lib.runPageSync("rsvp.html", harness, 5400, { patchRaf: true, forceHybridPointer: true });
check(state && !state.error, "headless Code interaction completed", state && state.error);
if (state && !state.error) {
  check(state.builtinHello === helloJs && state.builtinIdentity === "hello.js" && state.emptyOverride && state.builtinSelectedAfterEdit && state.builtinReset,
    "editable built-ins load exact canonical text, preserve empty overrides, stay selected, and reset by deleting the override", state);
  check(state.noEagerTrailer && state.trailerLoadedOnSelection && state.trailer && state.trailer.code === snippet("trailer.js") && state.trailer.name === "trailer.js" && state.trailer.editable && state.trailer.runEnabled && state.trailer.resetInitiallyDisabled && /ordinaryTrailerBuffer/.test(state.trailerOverride) && state.trailerOrdinaryRun && state.trailerReset,
    "Trailer stays unloaded until selected, then its exact editable buffer uses the ordinary JavaScript runner and reset lifecycle", state.trailer);
  check(state.sortedMerged && state.selectionAfterResort,
    "the merged canonical/user file list sorts deterministically at display time without losing selection", state);
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
  check(state.runtimeFocus && state.runtimeFocus["show-console"].focused && state.runtimeFocus["show-python"].focused && state.runtimeFocus["show-linux"].focused,
    "JavaScript, Python, and Linux restore keyboard ownership when the browser window regains focus", JSON.stringify(state.runtimeFocus));
}

if (failures) {
  console.log(failures + " check(s) failed.");
  process.exit(1);
}
console.log("All checks passed.");
