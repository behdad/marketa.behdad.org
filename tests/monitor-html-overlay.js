#!/usr/bin/env node
"use strict";

var lib = require("./lib");

var HARNESS = [
  '<pre id="__report">pending</pre>',
  '<script>(function(){',
  'function sleep(ms){return new Promise(function(resolve){setTimeout(resolve,ms);});}',
  'function rect(el){var r=el.getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height,right:r.right,bottom:r.bottom};}',
  'function delta(a,b){return Math.max(Math.abs(a.left-b.left),Math.abs(a.top-b.top),Math.abs(a.right-b.right),Math.abs(a.bottom-b.bottom));}',
  'var report={errors:[],apps:{}};',
  'window.addEventListener("load",function(){setTimeout(function(){run().catch(function(error){window.__errs.push("harness: "+String(error&&error.stack||error));}).then(function(){report.errors=window.__errs;document.getElementById("__report").textContent=JSON.stringify(report);});},320);});',
  'async function run(){',
  ' window.__goToStage("office");await sleep(80);',
  ' var monitor=document.getElementById("office-monitor"),tower=document.getElementById("office-pc-desk-trio"),host=document.getElementById("monitor-html-overlay"),controls=document.getElementById("monitor-html-overlay-controls"),box=document.getElementById("monitor-zoom-box");',
  ' if(tower)tower.classList.add("on");monitor.classList.add("here","screen-on","show-caps");window.__monitorZoomIn();await sleep(80);',
  ' var initial=window.__monitorHtmlOverlayState();report.policy={policy:initial.policy,denied:initial.denied,supported:initial.supported,credits:initial.supported.indexOf("monitor-credits-layer")};',
  ' var dockGrid=document.querySelector("#monitor-html-overlay .dock-grid"),dockCode=document.getElementById("monitor-dock-code"),dockRect=rect(dockGrid),dockCodeRect=rect(dockCode),dockStyle=getComputedStyle(dockGrid),dockCodeStyle=getComputedStyle(dockCode),dockCenterInViewport=dockCodeRect.left<innerWidth&&dockCodeRect.right>0&&dockCodeRect.top<innerHeight&&dockCodeRect.bottom>0,dockHits=dockCenterInViewport?document.elementsFromPoint(dockCodeRect.left+dockCodeRect.width/2,dockCodeRect.top+dockCodeRect.height/2):[];report.desktop={gridRect:dockRect,cellRect:dockCodeRect,gridDisplay:dockStyle.display,gridVisibility:dockStyle.visibility,gridOpacity:dockStyle.opacity,cellDisplay:dockCodeStyle.display,cellVisibility:dockCodeStyle.visibility,hit:dockCenterInViewport?dockHits.some(function(el){return el===dockCode||dockCode.contains(el);}):dockCodeStyle.pointerEvents!=="none",launches:{}};',
  ' var dockLaunches=[["code","show-code","monitor-code-wrap"],["console","show-console","monitor-console-wrap"],["mail","show-mail","monitor-mail-wrap"],["chrome","show-browser","monitor-browser-wrap"]];for(var di=0;di<dockLaunches.length;di++){var ds=dockLaunches[di],cell=document.getElementById("monitor-dock-"+ds[0]),cr=rect(cell),cx=cr.left+cr.width/2,cy=cr.top+cr.height/2,onscreen=cx>=0&&cx<innerWidth&&cy>=0&&cy<innerHeight,target=onscreen?document.elementFromPoint(cx,cy):cell;target.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:di+1,pointerType:"mouse",button:0,buttons:1,clientX:cx,clientY:cy}));var afterDown=window.__monitorZoomed();target.dispatchEvent(new PointerEvent("pointerup",{bubbles:true,cancelable:true,pointerId:di+1,pointerType:"mouse",button:0,clientX:cx,clientY:cy}));target.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true,button:0,clientX:cx,clientY:cy}));await sleep(ds[0]==="chrome"?950:55);report.desktop.launches[ds[0]]={hit:target===cell||cell.contains(target),onscreen:onscreen,afterDown:afterDown,zoomed:window.__monitorZoomed(),open:monitor.classList.contains(ds[1]),root:window.__monitorHtmlOverlayState().roots.indexOf(ds[2])!==-1};window.__closeTopMonitorApp(false);await sleep(55);report.desktop.launches[ds[0]].closed=monitor.classList.contains("show-caps")&&!monitor.classList.contains(ds[1])&&window.__monitorZoomed()&&window.__monitorHtmlOverlayState().roots.indexOf("dock-grid")!==-1;}',
  ' report.surfaces={};var stateCases=[',
  ' ["desktop",["show-caps"],["dock-grid"]],',
  ' ["console",["show-console"],["monitor-console-wrap"]],["code",["show-code"],["monitor-code-wrap"]],["mail",["show-mail"],["monitor-mail-wrap"]],',
  ' ["classics-chooser",["show-mines"],["monitor-classics-wrap"],"chooser"],["classics-mines",["show-mines"],["monitor-mines-wrap"],"mines"],["classics-solitaire",["show-mines"],["monitor-solitaire-wrap"],"solitaire"],',
  ' ["pacman",["show-pacman"],["monitor-pacman-wrap"]],["prince",["show-prince"],["prince-monitor-wrap"]],["video",["show-video"],["monitor-video-wrap"]],',
  ' ["tattoo",["show-tattoo"],["monitor-tattoo-wrap"]],["life",["show-life"],["monitor-life-wrap"]],["calendar",["show-calendar"],["monitor-cal-body"]],',
  ' ["clock",["show-clock"],["monitor-clock-wrap"]],["chat",["show-chat"],["monitor-chat-wrap"]],["python",["show-python"],["monitor-py-wrap"]],["linux",["show-linux"],["monitor-linux-wrap"]],',
  ' ["snake",["show-snake"],["monitor-snake-wrap"]],["shoot",["show-doom"],["monitor-doom-wrap"]],["browser",["show-browser"],["monitor-browser-wrap"]],',
  ' ["fatality",["death-doom"],[]],["bsod",["death-linux"],["bsod-wrap"]],["photobooth",["photobooth"],["monitor-pb-videowrap"]],["photobooth-picker",["photobooth","picking"],["monitor-pb-videowrap","monitor-pb-picker-grid"]]',
  ' ];',
  ' function setSurface(spec){Array.from(monitor.classList).forEach(function(c){if(/^(show-|death-|photobooth$|picking$|pb-)/.test(c))monitor.classList.remove(c);});var classics=document.getElementById("monitor-mines");if(spec[3]&&classics)classics.setAttribute("data-view",spec[3]);spec[1].forEach(function(c){monitor.classList.add(c);});}',
  ' for(var sc=0;sc<stateCases.length;sc++){var stateSpec=stateCases[sc];setSurface(stateSpec);await sleep(25);var surfaceState=window.__monitorHtmlOverlayState();report.surfaces[stateSpec[0]]=surfaceState.roots.slice().sort();if(stateSpec[0]==="video"){var videoWrap=document.getElementById("monitor-video-wrap"),videoScale=surfaceState.geometry.scale,choice=videoWrap.querySelector(".vid-choice");report.videoControls={scale:videoScale,chooserPhysical:surfaceState.geometry.physicalMedia,choiceWidth:rect(choice).width/videoScale,chooserFont:parseFloat(getComputedStyle(videoWrap.querySelector(".vid-chooser-title")).fontSize)};window.__selectMonitorVideoTrack("downtown");await sleep(25);videoWrap.classList.remove("absent");surfaceState=window.__monitorHtmlOverlayState();report.videoControls.playerPhysical=surfaceState.geometry.physicalMedia;report.videoControls.ctrlHeight=rect(videoWrap.querySelector(".vid-ctrl")).height;report.videoControls.playFont=parseFloat(getComputedStyle(videoWrap.querySelector(".vid-play")).fontSize);report.videoControls.muteWidth=rect(videoWrap.querySelector(".vid-ctrl-mute svg")).width;}}',
  ' setSurface(["desktop",["show-caps"]]);await sleep(25);',
  ' var specs=[ ["code","monitor-code-wrap"], ["console","monitor-console-wrap"], ["python","monitor-py-wrap"], ["linux","monitor-linux-wrap"], ["mail","monitor-mail-wrap"], ["chat","monitor-chat-wrap"], ["chrome","monitor-browser-wrap"] ];',
  ' for(var i=0;i<specs.length;i++){var spec=specs[i],result=window.__openMonitorApp(spec[0]);await sleep(spec[0]==="chrome"?900:45);var state=window.__monitorHtmlOverlayState(),root=document.getElementById(spec[1]),layer=root&&root.closest(".monitor-html-layer");report.apps[spec[0]]={result:result,active:state.active,roots:state.roots.slice(),parent:root&&root.parentNode&&root.parentNode.className,ownerInControls:state.owners.length===1&&document.getElementById(state.owners[0]).parentNode===controls,aligned:delta(rect(host),rect(box)),fills:layer?delta(rect(layer),rect(box)):999,rootSame:root===document.getElementById(spec[1])};}',
  ' setSurface(["code",["show-code"]]);await sleep(45);var codeRoot=document.getElementById("monitor-code-wrap");report.codeUi=[".code-side",".code-list",".code-main",".code-top",".code-editor",".code-ai-tools"].map(function(selector){var el=codeRoot.querySelector(selector),r=rect(el),s=getComputedStyle(el);return {selector:selector,width:r.width,height:r.height,display:s.display,visibility:s.visibility,opacity:s.opacity};});',
  ' report.focus={code:{}};for(var fi=0;fi<3;fi++){var fieldId=["monitor-code-ask","monitor-code-name","monitor-code-code"][fi],field=document.getElementById(fieldId),beforeField=rect(field);field.focus();var afterField=rect(field),fieldStyle=getComputedStyle(field);report.focus.code[fieldId]={shift:delta(beforeField,afterField),outlineWidth:fieldStyle.outlineWidth,outlineStyle:fieldStyle.outlineStyle,outlineColor:fieldStyle.outlineColor,borderColor:fieldStyle.borderTopColor};}report.focus.code.editorBorder=getComputedStyle(codeRoot.querySelector(".code-editor")).borderTopColor;',
  ' setSurface(["mail",["show-mail"]]);await sleep(45);var mailScale=window.__monitorHtmlOverlayState().geometry.scale;function mailPill(el){var outer=rect(el),label=el.querySelector(".btn-vc"),inner=rect(label),style=getComputedStyle(el),labelStyle=getComputedStyle(label),cx=outer.left+outer.width/2,cy=outer.top+outer.height/2,onscreen=cx>=0&&cx<innerWidth&&cy>=0&&cy<innerHeight,hits=onscreen?document.elementsFromPoint(cx,cy):[];return {height:outer.height/mailScale,labelHeight:inner.height/mailScale,centerError:Math.abs((outer.top+outer.bottom-inner.top-inner.bottom)/2),align:style.alignItems,justify:style.justifyContent,lineHeight:style.lineHeight,labelAlign:labelStyle.alignItems,labelMargin:labelStyle.marginTop,hit:onscreen?hits.some(function(node){return node===el||el.contains(node);}):style.pointerEvents!=="none"};}report.mailPills={compose:mailPill(document.querySelector(".mail-compose-btn"))};document.querySelectorAll(".mail-row")[1].dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);var reply=document.querySelector(".mail-reply-btn");report.mailPills.reply=mailPill(reply);reply.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));await sleep(30);report.mailPills.send=mailPill(document.querySelector(".mail-send-btn"));report.mailPills.cancel=mailPill(document.querySelector(".mail-cancel-btn"));',
  ' report.terminals={};report.focus.terminals={};document.documentElement.classList.add("is-webkit");for(var ti=0;ti<3;ti++){var terminal=["console","python","linux"][ti],outId=terminal==="console"?"monitor-console-out":terminal==="python"?"monitor-py-out":"monitor-linux-out",inputId=terminal==="console"?"monitor-console-in":terminal==="python"?"monitor-py-in":"monitor-linux-in";setSurface([terminal,["show-"+terminal]]);await sleep(35);var termInput=document.getElementById(inputId),termBefore=rect(termInput);termInput.focus();var termAfter=rect(termInput),termStyle=getComputedStyle(termInput);report.focus.terminals[terminal]={shift:delta(termBefore,termAfter),outlineWidth:termStyle.outlineWidth,outlineStyle:termStyle.outlineStyle};var out=document.getElementById(outId);out.replaceChildren();function addTerminalLine(text){var line=document.createElement("div");line.textContent=text;out.appendChild(line);out.scrollTop=out.scrollHeight;return line;}var firstLine=addTerminalLine("initial"),outRect=rect(out),firstRect=rect(firstLine),outStyle=getComputedStyle(out),lastLine;for(var li=0;li<24;li++)lastLine=addTerminalLine("line-"+li);report.terminals[terminal]={initialTopGap:firstRect.top-outRect.top,initialBottomGap:outRect.bottom-firstRect.bottom,display:outStyle.display,overflow:outStyle.overflowY,overlay:!!out.closest("#monitor-html-overlay"),scrollTop:out.scrollTop,maxScroll:out.scrollHeight-out.clientHeight,lastBottomGap:rect(out).bottom-rect(lastLine).bottom};}document.documentElement.classList.remove("is-webkit");setSurface(["desktop",["show-caps"]]);await sleep(35);',
  ' window.__openMonitorApp("console");await sleep(45);var input=document.getElementById("monitor-console-in"),sameInput=input;input.value="retained-state";input.focus();input.setSelectionRange(4,8);var monitorClicks=0;monitor.addEventListener("click",function(){monitorClicks++;});input.dispatchEvent(new MouseEvent("click",{bubbles:true,cancelable:true}));report.clickThrough=monitorClicks;',
  ' window.__openDropTerm();await sleep(85);var dropInput=document.getElementById("dropterm-in");report.dropAfterZoom={open:window.__dropTermOpen(),focused:document.activeElement===dropInput,zoomed:window.__monitorZoomed()};input.focus();input.dispatchEvent(new KeyboardEvent("keydown",{key:"x",code:"KeyX",bubbles:true,cancelable:true}));await sleep(15);report.dropAfterZoom.routed=dropInput.value==="x"&&input.value==="retained-state";window.__closeDropTerm();window.__monitorZoomOut();dropInput.value="";window.__openDropTerm();await sleep(85);window.__monitorZoomIn();await sleep(85);input.focus();input.dispatchEvent(new KeyboardEvent("keydown",{key:"y",code:"KeyY",bubbles:true,cancelable:true}));report.dropBeforeZoom={open:window.__dropTermOpen(),routed:dropInput.value==="y"&&input.value==="retained-state",zoomed:window.__monitorZoomed()};window.__closeDropTerm();input.focus();',
  ' var caret=document.querySelector("#monitor-console-wrap .console-caret");report.caretWidth=caret&&caret.getBoundingClientRect().width;var beforeIdle=window.__monitorHtmlOverlayState().metrics.geometryReads;await sleep(180);var afterIdle=window.__monitorHtmlOverlayState().metrics.geometryReads;report.idleGeometryReads=afterIdle-beforeIdle;var focusedBeforeZoom=document.activeElement===input;',
  ' window.__monitorZoomOut();await sleep(30);var parked=window.__monitorHtmlOverlayState(),parkedParent=input.closest("foreignObject");window.__monitorZoomIn();await sleep(55);var restored=window.__monitorHtmlOverlayState();report.retention={same:sameInput===document.getElementById("monitor-console-in"),value:input.value,selection:[input.selectionStart,input.selectionEnd],focusedBefore:focusedBeforeZoom,focused:document.activeElement===input,parked:!parked.active&&!!parkedParent,restored:restored.active&&restored.roots.length===1};',
  ' window.__toggleMonitorContentFullscreen();await sleep(180);var fullState=window.__monitorHtmlOverlayState();report.fullscreen={active:window.__monitorContentFullscreen(),aligned:delta(rect(host),rect(box)),geometry:fullState.geometry};window.__toggleMonitorContentFullscreen();await sleep(180);report.afterFullscreen={aligned:delta(rect(host),rect(box)),active:window.__monitorHtmlOverlayState().active};',
  ' document.getElementById("monitor-bezel-close").dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,cancelable:true,pointerId:91,pointerType:"mouse",button:0}));await sleep(35);report.bezelClose={zoomed:window.__monitorZoomed(),active:window.__monitorHtmlOverlayState().active,rootHome:!!document.getElementById("monitor-console-wrap").closest("foreignObject")};window.__monitorZoomIn();await sleep(45);',
  ' window.__goToStage("garden");await sleep(40);report.roomPan={active:window.__monitorHtmlOverlayState().active,ownerHome:!!document.getElementById("monitor-console").closest("#office-monitor-screen-content")};',
  '}',
  '})();</script>'
].join("\n");

function run(label, chromeFlags) {
  var result = lib.runPageSync("rsvp.html", HARNESS, 5000, { patchRaf: true, chromeFlags: chromeFlags });
  var failures = 0;
  function check(condition, message, detail) {
    if (condition) console.log("  ✓ " + message);
    else { failures++; console.log("  ✗ " + message + (detail ? "   [" + JSON.stringify(detail) + "]" : "")); }
  }
  console.log(label + ":");
  if (!result) { console.log("  ✗ harness produced no report"); return 1; }
  check(result.errors.length === 0, "no uncaught page errors", result.errors);
  check(result.policy.policy === "overlay-by-default" && result.policy.denied.length === 0,
    "foreignObject HTML uses an overlay-by-default policy with an explicit empty denylist", result.policy);
  check(result.policy.credits === -1, "native SVG Credits stays outside the HTML inventory", result.policy);
  check(result.desktop.gridRect.width > 0 && result.desktop.gridRect.height > 0 &&
      result.desktop.cellRect.width > 0 && result.desktop.cellRect.height > 0 &&
      result.desktop.gridDisplay !== "none" && result.desktop.gridVisibility === "visible" &&
      result.desktop.gridOpacity !== "0" && result.desktop.cellDisplay !== "none" &&
      result.desktop.cellVisibility === "visible",
    "zoomed desktop dock and app icons are visibly laid out", result.desktop);
  check(result.desktop.hit, "zoomed desktop app icons own their hit area", result.desktop);
  Object.keys(result.desktop.launches).forEach(function (id) {
    var launch = result.desktop.launches[id];
    check(launch.hit && launch.afterDown && launch.zoomed && launch.open && launch.root && launch.closed,
      id + " launches from a real pointer sequence without dropping monitor zoom", launch);
  });
  var expectedSurfaces={desktop:["dock-grid"],console:["monitor-console-wrap"],code:["monitor-code-wrap"],mail:["monitor-mail-wrap"],"classics-chooser":["monitor-classics-wrap"],"classics-mines":["monitor-mines-wrap"],"classics-solitaire":["monitor-solitaire-wrap"],pacman:["monitor-pacman-wrap"],prince:["prince-monitor-wrap"],video:["monitor-video-wrap"],tattoo:["monitor-tattoo-wrap"],life:["monitor-life-wrap"],calendar:["monitor-cal-body"],clock:["monitor-clock-wrap"],chat:["monitor-chat-wrap"],python:["monitor-py-wrap"],linux:["monitor-linux-wrap"],snake:["monitor-snake-wrap"],shoot:["monitor-doom-wrap"],browser:["monitor-browser-wrap"],fatality:[],bsod:["bsod-wrap"],photobooth:["monitor-pb-videowrap"],"photobooth-picker":["monitor-pb-picker-grid","monitor-pb-videowrap"]};
  Object.keys(expectedSurfaces).forEach(function (name) {
    check(JSON.stringify(result.surfaces[name]) === JSON.stringify(expectedSurfaces[name]),
      name + " follows the default overlay policy", result.surfaces[name]);
  });
  var video = result.videoControls;
  check(video && video.scale > 1 && !video.chooserPhysical && video.playerPhysical &&
      video.choiceWidth > 30 && Math.abs(video.chooserFont - 3.2) <= 0.1 &&
      Math.abs(video.ctrlHeight / video.scale - 6) <= 0.1 &&
      Math.abs(video.playFont / video.scale - 13) <= 0.1 &&
      Math.abs(video.muteWidth / video.scale - 3.4) <= 0.1,
    "Video chooser uses logical scaling while physical player media retains authored control scale", video);
  Object.keys(result.apps).forEach(function (id) {
    var app = result.apps[id];
    check(app.active && app.roots.length === 1 && app.ownerInControls && app.rootSame,
      (id === "chrome" ? "browser" : id) + " mounts exactly its live HTML root with its SVG controls", app);
    check(app.aligned <= 0.75 && app.fills <= 0.75,
      (id === "chrome" ? "browser" : id) + " is flush with all four native screen edges", app);
  });
  check(result.codeUi.every(function (part) { return part.width > 1 && part.height > 1 && part.display !== "none" && part.visibility === "visible" && part.opacity !== "0"; }),
    "Code promotes its full sidebar, toolbar, editor and AI controls", result.codeUi);
  check(Object.keys(result.focus.code).filter(function (id) { return id !== "editorBorder"; }).every(function (id) {
      var field = result.focus.code[id]; return field.shift <= 0.1 && field.outlineStyle === "none";
    }) && result.focus.code["monitor-code-ask"].borderColor === "rgb(84, 116, 91)" &&
      result.focus.code["monitor-code-name"].borderColor === "rgb(84, 116, 91)" &&
      result.focus.code.editorBorder === "rgb(84, 116, 91)",
    "Code focus uses a slim green in-place border with no burgundy ring or layout shift", result.focus.code);
  check(Object.keys(result.focus.terminals).every(function (id) {
      return result.focus.terminals[id].shift <= 0.1 && result.focus.terminals[id].outlineStyle === "none";
    }), "terminal inputs retain their ring-free, shift-free focus treatment", result.focus.terminals);
  check(Object.keys(result.mailPills).every(function (id) {
      var pill = result.mailPills[id], expected = id === "send" || id === "cancel" ? 5 : 4.4;
      return Math.abs(pill.height - expected) <= 0.1 && Math.abs(pill.labelHeight - expected) <= 0.1 &&
        pill.centerError <= 0.1 && pill.align === "center" && pill.justify === "center" &&
        pill.labelAlign === "center" && parseFloat(pill.labelMargin) === 0 && pill.hit;
    }), "Mail Compose/Reply/Send/Cancel labels center without changing their authored hit boxes", result.mailPills);
  Object.keys(result.terminals).forEach(function (id) {
    var terminal = result.terminals[id];
    check(terminal.overlay && terminal.display === "block" && terminal.overflow === "auto" &&
        terminal.initialTopGap < terminal.initialBottomGap,
      id + " starts underfilled output at the top in the WebKit overlay cascade", terminal);
    check(terminal.maxScroll > 0 && Math.abs(terminal.scrollTop - terminal.maxScroll) <= 1,
      id + " pins appended overflow to the newest line", terminal);
  });
  check(result.clickThrough === 0, "promoted app input does not click through to the monitor", result.clickThrough);
  check(result.dropAfterZoom.open && result.dropAfterZoom.routed && result.dropAfterZoom.zoomed,
    "dropdown opened over a zoomed monitor routes displaced app keystrokes", result.dropAfterZoom);
  check(result.dropBeforeZoom.open && result.dropBeforeZoom.routed && result.dropBeforeZoom.zoomed,
    "monitor zoomed after the dropdown opens cannot reclaim its keystrokes", result.dropBeforeZoom);
  check(result.caretWidth >= 0.8 && result.caretWidth <= 1.2, "Console caret stays one physical pixel wide", result.caretWidth);
  check(result.idleGeometryReads === 0, "idle overlay performs no geometry polling", result.idleGeometryReads);
  check(result.retention.same && result.retention.value === "retained-state" &&
      result.retention.selection[0] === 4 && result.retention.selection[1] === 8 &&
      result.retention.focused === result.retention.focusedBefore && result.retention.parked && result.retention.restored,
    "zoom-out/in preserves the exact node, value, selection, focus state and foreignObject home", result.retention);
  check(result.fullscreen.active && result.fullscreen.aligned <= 0.75,
    "content fullscreen refits the overlay to the native screen", result.fullscreen);
  check(result.afterFullscreen.active && result.afterFullscreen.aligned <= 0.75,
    "leaving content fullscreen restores exact alignment", result.afterFullscreen);
  check(!result.bezelClose.zoomed && !result.bezelClose.active && result.bezelClose.rootHome,
    "the bezel close still intentionally unzooms and restores the HTML home", result.bezelClose);
  check(!result.roomPan.active && result.roomPan.ownerHome,
    "room navigation parks HTML and SVG controls before the pan", result.roomPan);
  console.log("");
  return failures;
}

var failures = 0;
failures += run("monitor HTML overlay — desktop", "--window-size=1100,900");
failures += run("monitor HTML overlay — 390px mobile", "--window-size=390,300");
if (failures) { console.log(failures + " check(s) failed."); process.exit(1); }
console.log("All monitor HTML overlay checks passed.");
