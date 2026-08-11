#!/usr/bin/env node
// Focused Code-sidebar Reset files context menu and persistence ownership.
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report" style="position:fixed;left:-9999px">pending</pre>',
  '<script>(function(){',
  'var PHASE="code-reset-files-phase",CODE_KEYS=["deskScripts","deskPythonScripts","deskCodeBuiltinOverrides","deskCodeUnsaved","deskCodeDraft","deskCodeLanguage"];',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function raw(keys){var out={};keys.forEach(function(key){out[key]=localStorage.getItem(key);});return out;}',
  'function ctxAt(el){var r=el.getBoundingClientRect(),e=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:r.left+Math.min(8,r.width/2),clientY:r.top+Math.min(8,r.height/2)});return !el.dispatchEvent(e);}',
  'function menu(){return document.querySelector(".mon-ctx:not(.scene-ctx)");}',
  'function resetItem(){var m=menu();return m&&m.querySelector(".ctx-reset-files");}',
  'function dismiss(){document.dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true,cancelable:true}));}',
  'function labels(){return Array.from(document.querySelectorAll("#monitor-code-list .code-item")).map(function(item){return item.textContent;});}',
  'function showCode(){var mon=document.getElementById("office-monitor");["show-console","show-python","show-linux","show-caps"].forEach(function(cls){mon.classList.remove(cls);});mon.classList.add("screen-on","show-code");window.__currentStageName="office";return mon;}',
  'async function run(){try{',
  ' var phase=sessionStorage.getItem(PHASE);',
  ' if(!phase){',
  '  localStorage.setItem("deskScripts",JSON.stringify({"mine.js":"window.mine=true;","loop.js":"await loft.util.sleep(10000);"}));',
  '  localStorage.setItem("deskPythonScripts",JSON.stringify({"mine.py":"print(42)"}));',
  '  localStorage.setItem("deskCodeBuiltinOverrides",JSON.stringify({"hello.js":"window.editedBuiltin=true;"}));',
  '  localStorage.setItem("deskCodeUnsaved",JSON.stringify({code:"unsaved python",language:"python"}));',
  '  localStorage.setItem("deskCodeDraft",JSON.stringify({name:"draft.py",code:"print(7)",language:"python"}));',
  '  localStorage.setItem("deskCodeLanguage","python");',
  '  localStorage.setItem("unrelatedGameState","keep exactly");localStorage.setItem("pythonRuntimeInstall","keep python");localStorage.setItem("linuxRuntimeDisk","keep linux");',
  '  sessionStorage.setItem(PHASE,"seeded");location.reload();return;',
  ' }',
  ' if(phase==="reloaded"){',
  '  await sleep(120);var previous=JSON.parse(sessionStorage.getItem("code-reset-files-report")||"{}");showCode();',
  '  previous.reloaded={code:raw(CODE_KEYS),unrelated:raw(["unrelatedGameState","pythonRuntimeInstall","linuxRuntimeDisk"]),labels:labels(),name:document.getElementById("monitor-code-name").value,source:document.getElementById("monitor-code-code").value,unsavedActive:!!document.querySelector("#monitor-code-list .code-item.unsaved.active"),edited:document.querySelectorAll("#monitor-code-list .code-item.builtin.edited").length};',
  '  previous.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(previous);return;',
  ' }',
  ' if(window.__goToStage)window.__goToStage("office");await sleep(160);var mon=showCode(),list=document.getElementById("monitor-code-list"),source=document.getElementById("monitor-code-code"),name=document.getElementById("monitor-code-name"),run=document.getElementById("monitor-code-run"),status=document.getElementById("monitor-code-ai-status"),panel=document.getElementById("monitor-code-ai-panel");',
  ' var hello=Array.from(list.querySelectorAll(".code-item.builtin")).find(function(item){return item.textContent==="hello.js";});hello.click();await sleep(30);',
  ' localStorage.setItem("deskCodeUnsaved",JSON.stringify({code:"unsaved python",language:"python"}));localStorage.setItem("deskCodeDraft",JSON.stringify({name:"draft.py",code:"print(7)",language:"python"}));localStorage.setItem("deskCodeLanguage","python");',
  ' window.__loftControllers.repeat("loop.js");window.__lastCodeErrors.js="js failure";window.__lastCodeErrors.python="python failure";window.__lastCodeError="js failure";status.textContent="script failed — fix can help";panel.classList.add("open");panel.textContent="pending review";',
  ' var before=raw(CODE_KEYS),beforeLabels=labels(),prompts=[],answers=[];window.confirm=function(text){prompts.push(text);return answers.shift()===true;};',
  ' var selectorPrevented=ctxAt(list),enLabel=resetItem()&&resetItem().textContent;answers.push(false);resetItem().click();await sleep(20);',
  ' var cancel={storage:raw(CODE_KEYS),labels:labels(),name:name.value,source:source.value,repeating:run.classList.contains("code-btn-stop"),errors:{js:window.__lastCodeErrors.js,python:window.__lastCodeErrors.python},panel:panel.classList.contains("open"),status:status.textContent};',
  ' window.__setLang("cs");ctxAt(list);var csLabel=resetItem()&&resetItem().textContent;answers.push(false);resetItem().click();var csPrompt=prompts[prompts.length-1];window.__setLang("en");',
  ' ctxAt(source);var editorHasReset=!!resetItem();dismiss();ctxAt(mon);var monitorHasReset=!!resetItem();dismiss();',
  ' mon.classList.remove("show-code");mon.classList.add("show-caps");var dock=document.getElementById("monitor-dock-code");ctxAt(dock);var dockHasReset=!!resetItem();dismiss();mon.classList.remove("show-caps");mon.classList.add("show-code");',
  ' var bodyEvent=new MouseEvent("contextmenu",{bubbles:true,cancelable:true,button:2,clientX:2,clientY:2}),outsideNative=document.body.dispatchEvent(bodyEvent);',
  ' source.value="pending built-in rewrite";source.dispatchEvent(new Event("input",{bubbles:true}));ctxAt(list);var confirmLabel=resetItem()&&resetItem().textContent;answers.push(true);resetItem().click();await sleep(360);',
  ' var nowLabels=labels(),canonical=Array.from(list.querySelectorAll(".code-item.builtin"));var immediate={code:raw(CODE_KEYS),unrelated:raw(["unrelatedGameState","pythonRuntimeInstall","linuxRuntimeDisk"]),labels:nowLabels,name:name.value,source:source.value,language:{js:document.getElementById("monitor-code-lang-js").classList.contains("active"),py:document.getElementById("monitor-code-lang-py").classList.contains("active")},unsavedActive:!!list.querySelector(".code-item.unsaved.active"),canonicalCount:canonical.length,edited:list.querySelectorAll(".code-item.builtin.edited").length,repeating:run.classList.contains("code-btn-stop"),errors:{js:window.__lastCodeErrors.js,python:window.__lastCodeErrors.python,last:window.__lastCodeError},panel:panel.classList.contains("open"),status:status.textContent,runtimes:{python:window.__pyRunning===pyMarker,linux:window.__lxRunning===linuxMarker}};',
  ' var report={errors:window.__errs,selectorPrevented:selectorPrevented,enLabel:enLabel,csLabel:csLabel,confirmLabel:confirmLabel,prompts:prompts,csPrompt:csPrompt,before:before,beforeLabels:beforeLabels,cancel:cancel,scope:{editor:editorHasReset,monitor:monitorHasReset,dock:dockHasReset,outsideNative:outsideNative},immediate:immediate};',
  ' sessionStorage.setItem("code-reset-files-report",JSON.stringify(report));sessionStorage.setItem(PHASE,"reloaded");location.reload();',
  '}catch(error){document.getElementById("__report").textContent=JSON.stringify({errors:window.__errs.concat(["harness: "+String(error&&error.stack||error)])});}}',
  'var pyMarker=function(){return true;},linuxMarker=function(){return true;};window.__pyRunning=pyMarker;window.__lxRunning=linuxMarker;',
  'window.addEventListener("load",function(){setTimeout(run,120);});',
  '})();</script>'
].join("\n");

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : ""));
  }
}
function allNull(row) {
  return row && Object.keys(row).length === 6 && Object.keys(row).every(function (key) { return row[key] === null; });
}
function unrelatedKept(row) {
  return row && row.unrelatedGameState === "keep exactly" && row.pythonRuntimeInstall === "keep python" && row.linuxRuntimeDisk === "keep linux";
}

console.log("loft-day.html Code Reset files:");
var report = lib.runPageSync("loft-day.html", HARNESS, 7000, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true
});
check(!!report, "harness produced a report", report);
if (!report) process.exit(1);
check(report.errors.length === 0, "no uncaught page errors", report.errors);
check(report.selectorPrevented && report.enLabel === "Reset files…" && report.csLabel === "Obnovit soubory…" && report.confirmLabel === "Reset files…",
  "only the Code sidebar opens the translated Reset files item and suppresses its native menu", report);
check(report.prompts[0] === "Reset all Code files and edits? This cannot be undone." &&
  report.csPrompt === "Obnovit všechny soubory a úpravy v aplikaci Kód? Tuto akci nelze vrátit zpět." && report.prompts.length === 3,
  "the action uses the native confirmation with matched English and Czech copy", report.prompts);
check(JSON.stringify(report.before) === JSON.stringify(report.cancel.storage) &&
  JSON.stringify(report.beforeLabels) === JSON.stringify(report.cancel.labels) && report.cancel.repeating &&
  report.cancel.name === "hello.js" && report.cancel.source === "window.editedBuiltin=true;" &&
  report.cancel.errors.js === "js failure" && report.cancel.errors.python === "python failure" && report.cancel.panel &&
  report.cancel.status === "script failed — fix can help",
  "Cancel leaves files, drafts, selection, active repeat, errors, and AI review untouched", report.cancel);
check(!report.scope.editor && !report.scope.monitor && !report.scope.dock && report.scope.outsideNative,
  "Reset files is absent from the editor, monitor-wide, dock, and outside-page context menus", report.scope);
check(allNull(report.immediate.code) && unrelatedKept(report.immediate.unrelated) && report.immediate.runtimes.python && report.immediate.runtimes.linux,
  "Confirm clears only Code persistence while preserving unrelated and runtime-owned state", report.immediate);
check(report.immediate.labels[0] === "unsaved" && report.immediate.labels.length === report.immediate.canonicalCount + 1 &&
  report.immediate.unsavedActive && report.immediate.edited === 0 && report.immediate.name === "" && report.immediate.source === "" &&
  report.immediate.language.js && !report.immediate.language.py,
  "Confirm restores canonical rows plus one blank active JavaScript unsaved buffer", report.immediate);
check(!report.immediate.repeating && !report.immediate.errors.js && !report.immediate.errors.python &&
  !report.immediate.errors.last && !report.immediate.panel && report.immediate.status === "ready",
  "Confirm stops Code execution and clears remembered run and review state", report.immediate);
check(report.reloaded && allNull(report.reloaded.code) && unrelatedKept(report.reloaded.unrelated) &&
  report.reloaded.labels[0] === "unsaved" && report.reloaded.labels.length > 1 && report.reloaded.unsavedActive &&
  report.reloaded.edited === 0 && report.reloaded.name === "" && report.reloaded.source === "",
  "the reset files/default sidebar state persists across reload", report.reloaded);

console.log("");
if (failures) {
  console.log(failures + " Code reset assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Code reset assertions passed.");
