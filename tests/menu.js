#!/usr/bin/env node
// Focused test for the monitor running-app registry, contextual Kill menus,
// runtime teardown helpers and the DOOM fullscreen button. Uses the same one-shot headless-Chrome runner as play.js
// (--dump-dom, no long-lived process, so it runs in-sandbox).
//
// Two menus by design (kept split to avoid a double menu on the console apps):
//   • .console-ctx — python/linux/console fold Kill into their existing copy/paste menu.
//   • .mon-ctx — every other real app (mail, chat, weather, classics, music, video, …) plus shoot
//     (a game iframe, no copy/paste) gets this standalone menu. Desktop Kill is available only
//     after launch and reuses the app's in-app themed hook.
// Context menus stay local: app-level Restart and whole-loft Start over are intentionally absent,
// and empty shells stay suppressed.
// Kill on a self-hosted runtime (doom/python/linux) is DISABLED until the runtime is
// actually running — the running predicates (__doomRunning/__pyRunning/__lxRunning) are
// window-exposed so this harness can flip them (it can't boot the real WASM runtimes,
// which need real network + wasm that --virtual-time-budget can't drive). Full runtime
// RE-INIT completing is out of scope here — that's a live check.
"use strict";
var lib = require("./lib");

var HARNESS = [
  "<pre id=\"__report\" style=\"position:fixed;left:-9999px\">pending</pre>",
  "<script>",
  "(function () {",
  "  function sleep(ms){return new Promise(function(r){setTimeout(r,ms);});}",
  "  var report = { errors: [], steps: {} };",
  "  function S(k,v){ report.steps[k]=v; }",
  "  function ctxAt(el){ var r=el.getBoundingClientRect(); var e=new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:r.left+Math.min(20,r.width/2),clientY:r.top+Math.min(20,r.height/2)}); return !el.dispatchEvent(e); }",
  "  function ccMenu(){ return document.querySelector('.console-ctx.show'); }",           // python/linux/console menu
  "  function ccVisible(sel){ var m=ccMenu(); if(!m) return false; var b=m.querySelector(sel); return !!b && b.style.display!=='none'; }",
  "  function ccText(sel){ var m=ccMenu(); var b=m&&m.querySelector(sel); return b?b.textContent:''; }",
  "  function ccKillDisabled(){ var m=ccMenu(); var b=m&&m.querySelector('.cc-kill'); return !!(b&&b.disabled); }",
  "  function ccReset(){ var m=ccMenu(); return m&&m.querySelector('.cc-loft-reset'); }",
  "  function monMenu(){ return document.querySelector('.mon-ctx:not(.scene-ctx)'); }",     // doom + every non-console app menu
  "  function monItems(){ var m=monMenu(); return m?[].map.call(m.querySelectorAll('button span:last-child'),function(s){return s.textContent;}):[]; }",
  "  function monKill(){ var m=monMenu(); return m?m.querySelector('button.ctx-kill'):null; }",
  "  function monRestart(){ var m=monMenu(); return m?m.querySelector('button.ctx-restart'):null; }",
  "  function monReset(){ var m=monMenu(); return m?m.querySelector('button.ctx-loft-reset'):null; }",
  "  function monKillDisabled(){ var b=monKill(); return !!(b&&b.disabled); }",
  "  function mon(){ return document.getElementById('office-monitor'); }",
  "  function reg(id){ return !!(window.__monitorAppRunning&&window.__monitorAppRunning(id)); }",
  "  function dot(id){ var c=document.getElementById('monitor-dock-'+id); return !!(c&&c.classList.contains('is-running')); }",
  "  var APP_CLASSES=['show-caps','show-nowplaying','show-mail','show-mines','show-weather','show-chat','show-calendar','show-clock','show-video','show-tattoo','show-life','show-code','show-browser','show-family','photobooth','show-python','show-linux','show-snake','show-console','show-doom','show-help'];",
  "  function showApp(cls){ var m=mon(); APP_CLASSES.forEach(function(c){m.classList.remove(c);}); m.classList.add('screen-on'); if(cls) m.classList.add(cls); window.__currentStageName='office'; }",
  "  async function run(){",
  "    if (window.__goToStage) window.__goToStage('office');",
  "    await sleep(200);",
  // ---- DESKTOP: no menu ----
  "    showApp('show-caps');",
  "    S('desktop_ctx_prevented', ctxAt(mon()));",     // should be false — native menu kept
  "    S('desktop_no_mon_menu', !monMenu());",
  "    S('desktop_no_cc_menu', !ccMenu());",
  "    var emptyMenu=document.createElement('div');emptyMenu.className='mon-ctx';document.body.appendChild(emptyMenu);S('empty_menu_suppressed',!emptyMenu.querySelector('button')&&getComputedStyle(emptyMenu).display==='none');emptyMenu.remove();",
  // The Loft OS dropdown is mouse-modal: the first outside click dismisses it without
  // activating the desktop app underneath.
  "    var sysBrand=document.getElementById('monitor-system-brand'), coveredMail=document.getElementById('monitor-dock-mail');",
  "    if(sysBrand) sysBrand.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));",
  "    S('system_menu_opened', !!(window.__monitorSystemMenuOpen&&window.__monitorSystemMenuOpen()));",
  "    if(coveredMail) coveredMail.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));",
  "    S('system_menu_outside_dismissed', !(window.__monitorSystemMenuOpen&&window.__monitorSystemMenuOpen()));",
  "    S('system_menu_outside_blocked_app', !mon().classList.contains('show-mail'));",
  // ---- NON-RUNTIME APPS (mon-ctx): Kill only, enabled, no Restart ----
  "    var nonRt=['show-mail','show-chat','show-weather','show-mines','show-nowplaying','show-help'];",
  "    var nonRtOk=true, nonRtDetail={};",
  "    for (var i=0;i<nonRt.length;i++){ var c=nonRt[i]; showApp(c); var prevented=ctxAt(mon()); var items=monItems(); var kill=monKill(); var ok = prevented===true && !!monMenu() && items.length===1 && /kill/i.test(items[0]||'') && !monRestart() && !monReset() && !!kill && kill.disabled===false; nonRtDetail[c]={prevented:prevented,items:items,hasRestart:!!monRestart(),hasStartOver:!!monReset(),killDisabled:kill?kill.disabled:'no-kill'}; if(!ok) nonRtOk=false; }",
  "    S('nonruntime_kill_only_enabled', nonRtOk); S('nonruntime_detail', nonRtDetail);",
  // A stationary Android hold on an EQ band must open the same Reset EQ + Kill menu as right-click.
  "    showApp('show-nowplaying'); var eqHits=document.querySelectorAll('#monitor-manual-eq .meq-band rect[fill=transparent]'),eqHit=eqHits[0],eqHold=eqHits[1],eqr=eqHit&&eqHit.getBoundingClientRect(),eqhr=eqHold&&eqHold.getBoundingClientRect();",
  "    if(eqHit&&eqr&&eqHold&&eqhr){eqHit.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:701,pointerType:'touch',isPrimary:true,button:0,buttons:1,clientX:eqr.left+eqr.width/2,clientY:eqr.top+1}));eqHit.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,cancelable:true,pointerId:701,pointerType:'touch',isPrimary:true,button:0,clientX:eqr.left+eqr.width/2,clientY:eqr.top+1}));eqHold.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,pointerId:702,pointerType:'touch',isPrimary:true,button:0,buttons:1,clientX:eqhr.left+eqhr.width/2,clientY:eqhr.top+eqhr.height/2}));await sleep(440);eqHold.dispatchEvent(new PointerEvent('pointercancel',{bubbles:true,cancelable:true,pointerId:702,pointerType:'touch',isPrimary:true,button:0,clientX:eqhr.left+eqhr.width/2,clientY:eqhr.top+eqhr.height/2}));var eqItems=monItems(),eqMenu=monMenu(),eqReset=eqMenu&&eqMenu.querySelector('.ctx-reset-eq');S('eq_touch_context',{items:eqItems,reset:!!eqReset,resetEnabled:!!eqReset&&!eqReset.disabled,kill:!!monKill()});if(eqReset)eqReset.click();S('eq_touch_reset',JSON.parse(localStorage.getItem('songEqBands')||'[]').every(function(v){return v===0;}));}",
  // System Information adds Copy ahead of its normal Kill and copies the complete visible report.
  "    showApp('show-system'); if(window.__openMonitorSystemInfo) window.__openMonitorSystemInfo(); window.__systemCopied='';",
  "    try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:function(text){window.__systemCopied=text;return Promise.resolve();}}});}catch(e){}",
  "    ctxAt(mon()); var systemItems=monItems(); var systemCopy=monMenu()&&monMenu().querySelector('.ctx-copy'); S('system_context_items',systemItems); if(systemCopy) systemCopy.click(); await sleep(20);",
  "    S('system_copy_report',/System Information/.test(window.__systemCopied)&&/Browser:/.test(window.__systemCopied)&&/Graphics:/.test(window.__systemCopied)&&/Performance:/.test(window.__systemCopied)&&/Hardware:/.test(window.__systemCopied)&&/Input:/.test(window.__systemCopied));",
  "    S('system_copy_omits_recommendation',!/Best in latest desktop Chrome/.test(window.__systemCopied)); if(window.__closeMonitorSystemInfo) window.__closeMonitorSystemInfo();",
  // Help's standard Kill is a two-beat gag: its question mark falls before the app closes.
  "    showApp('show-help'); if(window.__openMonitorHelp) window.__openMonitorHelp(); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(300);",
  "    S('help_kill_started', document.getElementById('monitor-help-layer').classList.contains('killing'));",
  "    S('help_kill_first_caption', document.getElementById('hunt-caption').textContent==='You’ve been freed. You’re on your own.');",
  "    await sleep(1700); S('help_kill_second_caption', document.getElementById('hunt-caption').textContent==='Do you have a clue what happens now?');",
  "    await sleep(1800); S('help_kill_closed', !mon().classList.contains('show-help') && !document.getElementById('monitor-help-layer').classList.contains('killing'));",
  // Exercise the physical black bezel itself, not merely synthetic coordinates inside the
  // monitor's bounding box: scaled SVG layouts can route those through different targets.
  "    showApp('show-mail'); if(window.__toggleMonitorZoom && !window.__monitorZoomed()) window.__toggleMonitorZoom(); await sleep(20); var bezel=document.getElementById('office-monitor-bezel'), glass=document.getElementById('office-monitor-bg'), br=bezel&&bezel.getBoundingClientRect(), gr=glass&&glass.getBoundingClientRect(); var rx=br&&gr?br.left+Math.max(1,(gr.left-br.left)/2):0, ry=br?(br.top+br.bottom)/2:0; if(bezel) bezel.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,cancelable:true,button:2,buttons:2,clientX:rx,clientY:ry})); S('rim_right_pointer_kept_zoom', !!(window.__monitorZoomed&&window.__monitorZoomed())); var rimEvt=(br&&gr)?new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:rx,clientY:ry}):null; S('rim_context_prevented', rimEvt?!bezel.dispatchEvent(rimEvt):false); S('rim_menu_present', !!monMenu()); escMenu(); if(window.__monitorZoomed&&window.__monitorZoomed()) window.__toggleMonitorZoom(); await sleep(20);",
  "    var chair=document.getElementById('office-chair'),cr=chair&&chair.getBoundingClientRect(),outsideEvt=chair&&cr?new MouseEvent('contextmenu',{bubbles:true,cancelable:true,button:2,clientX:cr.left+cr.width/2,clientY:cr.top+cr.height/2}):null;S('outside_monitor_native',outsideEvt?chair.dispatchEvent(outsideEvt):false);S('outside_monitor_no_kill',!monMenu());",
  // Mail Kill folds three envelopes into paper airplanes, collides them, then leaves an empty tray.
  "    if(window.__MAILS) window.__MAILS.forEach(function(m){m.read=true;}); showApp('show-mail'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(50); var mailFlight=document.getElementById('monitor-mail-farewell-flight'); S('mail_kill_started', mon().classList.contains('death-mail') && mon().classList.contains('show-mail')); S('mail_kill_hid_menu', !monMenu()); S('mail_kill_registry_cleared', !reg('mail') && !dot('mail')); S('mail_kill_envelopes', !!mailFlight && Number(mailFlight.getAttribute('data-envelopes'))===3); await sleep(700); S('mail_kill_launched', !!mailFlight && Number(mailFlight.getAttribute('data-airborne'))>=2 && Number(mailFlight.getAttribute('data-envelopes'))>=1); S('mail_kill_caption', document.getElementById('hunt-caption').textContent==='You’ve got no mail.'); await sleep(800); S('mail_kill_collision', !!mailFlight && mailFlight.getAttribute('data-collided')==='1' && Number(mailFlight.getAttribute('data-airborne'))===3); await sleep(750); S('mail_kill_empty_tray', !!mailFlight && Number(mailFlight.getAttribute('data-airborne'))===0 && Number(mailFlight.getAttribute('data-fallen'))===3); await sleep(300); S('mail_kill_teardown', !mon().classList.contains('show-mail') && !mon().classList.contains('death-mail') && (!window.__MAILS || window.__MAILS.every(function(m){return !m.read;})));",
  // Chat Kill freezes a pending request, types Charlie's interrupted thought, collapses the
  // rendered conversation into context tokens, clears it, then resets and closes.
  "    showApp('show-chat'); document.documentElement.lang='en'; if(window.__refreshChatText) window.__refreshChatText();",
  "    window.__monitorChatTurnstile=function(){return Promise.resolve('menu-test-token');}; window.__monitorChatTransport=function(){return new Promise(function(){});}; window.__chatKillPendingSettled=false;",
  "    if(window.__monitorChatAsk) window.__monitorChatAsk('keep this pending').catch(function(){window.__chatKillPendingSettled=true;}); await sleep(30);",
  "    ctxAt(mon()); if(monKill()) monKill().click(); await sleep(40); var chatKill=window.__monitorChatKillState?window.__monitorChatKillState():{};",
  "    S('chat_kill_started', mon().classList.contains('death-chat')); S('chat_kill_still_open', mon().classList.contains('show-chat')); S('chat_kill_typing_stage', chatKill.stage==='typing' && chatKill.thought.length>0 && 'I think, therefore I…'.indexOf(chatKill.thought)===0); S('chat_kill_cancelled_pending', chatKill.pending===false && chatKill.queued===0 && window.__chatKillPendingSettled===true);",
  "    await sleep(820); chatKill=window.__monitorChatKillState(); S('chat_kill_stopped_thought', chatKill.stage==='stopped' && chatKill.thought==='I think, therefore I…');",
  "    await sleep(460); chatKill=window.__monitorChatKillState(); S('chat_kill_tokens', chatKill.stage==='collapse' && chatKill.tokens>0);",
  "    await sleep(660); chatKill=window.__monitorChatKillState(); S('chat_kill_context_cleared', chatKill.stage==='cleared' && chatKill.system==='[context cleared]' && chatKill.systemVisible===true); S('chat_kill_caption', document.getElementById('hunt-caption').textContent==='Charlie has left the chat.');",
  "    await sleep(520); chatKill=window.__monitorChatKillState(); var chatInput=document.getElementById('monitor-chat-input'); S('chat_kill_teardown', chatKill.active===false && chatKill.stage==='' && !mon().classList.contains('show-chat') && !mon().classList.contains('death-chat') && window.__monitorChatHistory().length===0 && chatInput.value==='' && chatInput.disabled===false);",
  // Call Kill cancels the pending connect, drops the signal bars strongest-first, cuts the
  // waveform to a flat line, then silently tears down the call.
  "    showApp('show-family'); document.documentElement.lang='en'; if(window.__placeMonitorCall) window.__placeMonitorCall('tehran'); await sleep(20);",
  "    ctxAt(mon()); if(monKill()) monKill().click(); await sleep(40); var callKill=window.__monitorCallKillState?window.__monitorCallKillState():{};",
  "    S('call_kill_started', mon().classList.contains('death-call') && mon().classList.contains('show-family') && callKill.active===true && callKill.bars===4 && callKill.wave>0.9);",
  "    await sleep(520); callKill=window.__monitorCallKillState(); S('call_kill_signal_dropping', callKill.stage==='signal' && callKill.bars>0 && callKill.bars<4);",
  "    await sleep(650); callKill=window.__monitorCallKillState(); S('call_kill_wave_cut', callKill.stage==='flatline' && callKill.bars===0 && callKill.wave<0.05 && callKill.flat>0.95); S('call_kill_caption', document.getElementById('hunt-caption').textContent==='It’s not you. It’s the connection.');",
  "    await sleep(1100); callKill=window.__monitorCallKillState(); S('call_kill_teardown', callKill.active===false && callKill.call===false && !mon().classList.contains('show-family') && !mon().classList.contains('death-call'));",
  // Calendar Kill tears pages away at shortening intervals until only its backing remains.
  "    showApp('show-calendar'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(50); var calPages=document.getElementById('monitor-calendar-farewell-pages'); S('calendar_kill_started', mon().classList.contains('death-calendar') && mon().classList.contains('show-calendar')); S('calendar_kill_full_pad', !!calPages && Number(calPages.getAttribute('data-pages'))===12); await sleep(1450); S('calendar_kill_accelerating', !!calPages && Number(calPages.getAttribute('data-pages'))<8 && Number(calPages.getAttribute('data-pages'))>1); await sleep(1000); S('calendar_kill_bare', !!calPages && Number(calPages.getAttribute('data-pages'))===0); await sleep(180); S('calendar_kill_closed', !mon().classList.contains('show-calendar') && !mon().classList.contains('death-calendar'));",
  // Music Kill scratches, slows the real media element, sends the notes off their staff,
  // then pauses/rewinds playback and flattens the retained app state.
  "    showApp('show-nowplaying'); var killSong=document.getElementById('guitar-song-audio'); window.__musicTestPaused=false;",
  "    if(killSong){ try{Object.defineProperty(killSong,'paused',{configurable:true,get:function(){return window.__musicTestPaused;}});}catch(e){} killSong.pause=function(){window.__musicTestPaused=true;killSong.dispatchEvent(new Event('pause'));}; killSong.currentTime=12; killSong.playbackRate=1; killSong.dispatchEvent(new Event('play')); }",
  "    ctxAt(mon()); if(monKill()) monKill().click(); await sleep(40); var musicKill=window.__monitorMusicKillState?window.__monitorMusicKillState():{};",
  "    S('music_kill_started', mon().classList.contains('death-music') && mon().classList.contains('show-nowplaying') && musicKill.active===true && musicKill.stage==='scratch' && musicKill.scratch===true && musicKill.playing===true);",
  "    await sleep(520); musicKill=window.__monitorMusicKillState(); S('music_kill_slowed', musicKill.stage==='slowing' && musicKill.rate<0.95 && musicKill.rate>0.18 && musicKill.playing===true);",
  "    await sleep(620); musicKill=window.__monitorMusicKillState(); S('music_kill_notes_falling', musicKill.stage==='falling' && musicKill.moving>2 && musicKill.visible>0);",
  "    await sleep(400); musicKill=window.__monitorMusicKillState(); S('music_kill_silence', musicKill.stage==='silence' && musicKill.silenced===true && musicKill.playing===false); S('music_kill_caption', document.getElementById('hunt-caption').textContent==='The rest is silence.');",
  "    await sleep(900); musicKill=window.__monitorMusicKillState(); S('music_kill_teardown', musicKill.active===false && !mon().classList.contains('show-nowplaying') && !mon().classList.contains('death-music') && !!killSong && killSong.currentTime===0 && killSong.playbackRate===1 && window.__phoneMusicId()===null);",
  // browser Kill is the one non-runtime app that flashes: Chrome's ~2.2s 'Aw, Snap!' crash (death-browser),
  // THEN closes. Menu shows only an enabled Kill (no Restart); the flash starts immediately, show-browser
  // stays up during it, and is torn down only after. Mirrors the doom kill shape (flash-then-close).
  // Code gets its own QBasic → DOS send-off. The app stays open under the overlay until the
  // sequence ends, then its unnamed live buffer/draft are cleared while saved files remain.
  "    showApp('show-code'); var codeTa=document.getElementById('monitor-code-code'); var codeName=document.getElementById('monitor-code-name'); if(codeTa) codeTa.value='unsaved work'; if(codeName) codeName.value=''; localStorage.setItem('deskCodeUnsaved',JSON.stringify({code:'unsaved work',language:'js'})); localStorage.setItem('deskCodeDraft',JSON.stringify({code:'unsaved work',language:'js'}));",
  "    codeTa.focus(); codeTa.setSelectionRange(0,7); S('code_edit_context_prevented',ctxAt(codeTa)); S('code_edit_context_items',monItems()); var selectAll=monMenu()&&monMenu().querySelector('.ctx-select-all'); if(selectAll) selectAll.click(); S('code_edit_select_all',codeTa.selectionStart===0&&codeTa.selectionEnd===codeTa.value.length);",
  "    ctxAt(mon()); if(monKill()) monKill().click(); await sleep(40); S('code_kill_flash_started', mon().classList.contains('death-code')); S('code_kill_still_open_during_flash', mon().classList.contains('show-code')); await sleep(1800); var dos=document.getElementById('monitor-qbasic-dos'); S('code_kill_reached_dos', !!dos && Number(dos.getAttribute('opacity'))>0); await sleep(700); S('code_kill_closed_app', !mon().classList.contains('show-code')); S('code_kill_flash_ended', !mon().classList.contains('death-code')); S('code_kill_cleared_live_buffer', !!codeTa && codeTa.value==='' && localStorage.getItem('deskCodeUnsaved')===null && localStorage.getItem('deskCodeDraft')===null);",
  // Life Kill evolves a real five-cell B3/S23 glider before the app closes.
  "    showApp('show-life'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(50); S('life_kill_flash_started', mon().classList.contains('death-life')); S('life_kill_still_open_during_flash', mon().classList.contains('show-life')); await sleep(1000); var glider=document.getElementById('monitor-life-farewell-glider'); S('life_kill_glider_alive', !!glider && glider.querySelectorAll('rect').length===5 && Number(glider.getAttribute('data-generation'))>0); await sleep(1700); S('life_kill_closed_app', !mon().classList.contains('show-life')); S('life_kill_flash_ended', !mon().classList.contains('death-life'));",
  // Tattoo Kill writes NO REGRETS before resetting the studio.
  "    showApp('show-tattoo'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(50); S('tattoo_kill_flash_started', mon().classList.contains('death-tattoo')); S('tattoo_kill_still_open_during_flash', mon().classList.contains('show-tattoo')); await sleep(900); var ink=document.getElementById('monitor-tattoo-ink-reveal'); S('tattoo_kill_is_inking', !!ink && Number(ink.getAttribute('width'))>20); await sleep(1600); S('tattoo_kill_closed_app', !mon().classList.contains('show-tattoo')); S('tattoo_kill_flash_ended', !mon().classList.contains('death-tattoo'));",
  // Killing Video from its chooser gives Behdad's camera the shot: roll, flash, cut.
  "    showApp('show-video'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(50); S('video_kill_flash_started', mon().classList.contains('death-video')); S('video_kill_still_open_during_flash', mon().classList.contains('show-video')); var videoKill=window.__monitorVideoKillState(); S('video_kill_starts_framing', videoKill.track==='chooser'&&videoKill.stage==='framing'); await sleep(850); videoKill=window.__monitorVideoKillState(); S('video_kill_camera_rolls', videoKill.stage==='rolling'); await sleep(1450); videoKill=window.__monitorVideoKillState(); S('video_kill_camera_shoots_back', videoKill.stage==='flash'&&videoKill.frames===8&&videoKill.flashOpacity>0); await sleep(1200); S('video_kill_closed_app', !mon().classList.contains('show-video')); S('video_kill_flash_ended', !mon().classList.contains('death-video'));",
  // Mines Kill drives the live board through reveal → chain → X-eyes/blinking holdout →
  // final pop, freezes its timer throughout, then closes with a completely fresh board.
  "    showApp('show-mines'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(40); var minesWrap=document.getElementById('monitor-mines-wrap'), minesTimerEl=minesWrap&&minesWrap.querySelector('.mines-side .mines-lcd:last-child'); var minesFrozenAt=minesTimerEl&&minesTimerEl.textContent; S('mines_kill_flash_started', mon().classList.contains('death-mines')); S('mines_kill_still_open_during_flash', mon().classList.contains('show-mines')); S('mines_kill_timer_frozen', minesWrap&&minesWrap.getAttribute('data-kill-timer')==='frozen');",
  "    await sleep(650); var mineCells=minesWrap?[].slice.call(minesWrap.querySelectorAll('.mines-cell')):[]; S('mines_kill_revealed_all', mineCells.length===112&&mineCells.every(function(c){return c.classList.contains('kill-reveal');})); S('mines_kill_caption', document.getElementById('hunt-caption').textContent.trim());",
  "    await sleep(950); var chainCount=minesWrap?minesWrap.querySelectorAll('.mines-cell.kill-detonated').length:0; S('mines_kill_chain_visible', chainCount>0&&chainCount<17&&minesWrap.getAttribute('data-kill-stage')==='chain');",
  "    await sleep(500); var minesFace=minesWrap&&minesWrap.querySelector('.mines-face'); S('mines_kill_xeyes', !!minesFace&&minesFace.textContent==='😵'); S('mines_kill_last_blinks', minesWrap&&minesWrap.getAttribute('data-kill-stage')==='blink'&&minesWrap.querySelectorAll('.mines-cell.kill-last').length===1); S('mines_kill_timer_stayed_frozen', !!minesTimerEl&&minesTimerEl.textContent===minesFrozenAt);",
  "    await sleep(850); S('mines_kill_final_pop', minesWrap&&minesWrap.getAttribute('data-kill-stage')==='final'&&minesWrap.querySelectorAll('.mines-cell.kill-detonated').length===17&&minesWrap.querySelectorAll('.mines-cell.kill-last').length===0);",
  "    await sleep(450); var freshMineCells=minesWrap?[].slice.call(minesWrap.querySelectorAll('.mines-cell')):[]; S('mines_kill_closed_app', !mon().classList.contains('show-mines')); S('mines_kill_flash_ended', !mon().classList.contains('death-mines')); S('mines_kill_reset_board', freshMineCells.length===112&&freshMineCells.every(function(c){return !c.classList.contains('open')&&!c.classList.contains('kill-reveal')&&!c.classList.contains('kill-detonated')&&!c.classList.contains('kill-last');})&&minesFace&&minesFace.textContent==='↻'&&!minesWrap.hasAttribute('data-kill-stage'));",
  // Photobooth Kill stops the booth and develops four empty-chair frames; its final
  // frame closes the curtain before the retained capture/effect state is reset.
  "    showApp('photobooth'); mon().classList.add('picking'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(60); var pbFarewell=document.getElementById('monitor-pb-farewell-strip'), pbFrames=pbFarewell?[].slice.call(pbFarewell.querySelectorAll('[data-pb-frame]')):[], pbCurtain=document.getElementById('monitor-pb-farewell-curtain'), pbLeft=document.getElementById('monitor-pb-farewell-curtain-left'); S('photobooth_kill_flash_started', mon().classList.contains('death-photobooth')); S('photobooth_kill_still_open', mon().classList.contains('photobooth')); S('photobooth_kill_cancelled_picker', !mon().classList.contains('picking'));",
  "    await sleep(700); var pbShown=pbFrames.filter(function(f){return Number(f.getAttribute('opacity'))>.5;}).length; S('photobooth_kill_strip_developing', pbFrames.length===4&&pbShown>1&&pbShown<4&&pbCurtain.getAttribute('data-stage')==='developing'); S('photobooth_kill_caption', document.getElementById('hunt-caption').textContent.trim());",
  "    await sleep(1150); S('photobooth_kill_curtain_closing', pbCurtain.getAttribute('data-stage')==='closing'&&Number(pbLeft.getAttribute('width'))>0&&Number(pbLeft.getAttribute('width'))<13);",
  "    await sleep(570); S('photobooth_kill_curtain_closed', pbCurtain.getAttribute('data-stage')==='closed'&&Number(pbLeft.getAttribute('width'))===13&&pbFrames.every(function(f){return Number(f.getAttribute('opacity'))===1;}));",
  "    await sleep(300); S('photobooth_kill_closed_app', !mon().classList.contains('photobooth')); S('photobooth_kill_flash_ended', !mon().classList.contains('death-photobooth')); S('photobooth_kill_reset_visual', !pbCurtain.hasAttribute('data-stage')&&Number(pbLeft.getAttribute('width'))===0&&pbFrames.every(function(f){return Number(f.getAttribute('opacity'))===0;}));",
  // Weather Kill churns every forecast condition twice, then an oversized final bolt
  // flashes and leaves a crack through the app before its normal close path runs.
  "    showApp('show-weather'); ctxAt(mon()); if(monKill()) monKill().click(); await sleep(50); var weatherFarewell=document.getElementById('monitor-weather-farewell'), weatherCrack=document.getElementById('monitor-weather-kill-crack'); S('weather_kill_flash_started', mon().classList.contains('death-weather')); S('weather_kill_still_open', mon().classList.contains('show-weather'));",
  "    await sleep(1050); var weatherSeen=(weatherFarewell.getAttribute('data-seen')||'').split(','); S('weather_kill_cycled_all', weatherFarewell.getAttribute('data-stage')==='cycling'&&['sun','rain','snow','storm'].every(function(k){return weatherSeen.indexOf(k)>=0;})); S('weather_kill_caption', document.getElementById('hunt-caption').textContent.trim());",
  "    await sleep(1100); S('weather_kill_struck', weatherFarewell.getAttribute('data-stage')==='struck'&&weatherFarewell.getAttribute('data-condition')==='storm'&&Number(weatherCrack.getAttribute('opacity'))===1&&Number(document.getElementById('monitor-weather-kill-storm').getAttribute('opacity'))===1);",
  "    await sleep(500); S('weather_kill_closed_app', !mon().classList.contains('show-weather')); S('weather_kill_flash_ended', !mon().classList.contains('death-weather')); S('weather_kill_reset_visual', !weatherFarewell.hasAttribute('data-stage')&&!weatherFarewell.hasAttribute('data-condition')&&!weatherFarewell.hasAttribute('data-seen')&&Number(weatherCrack.getAttribute('opacity'))===0);",
  "    showApp('show-browser'); ctxAt(mon()); S('browser_items', monItems()); S('browser_kill_enabled', monKill()?!monKill().disabled:false); S('browser_has_restart', !!monRestart());",
  "    if(monKill()) monKill().click(); await sleep(40); S('browser_kill_hid_menu', !monMenu()); S('browser_kill_flash_started', mon().classList.contains('death-browser')); S('browser_kill_still_open_during_flash', mon().classList.contains('show-browser')); await sleep(2400); S('browser_kill_closed_app', !mon().classList.contains('show-browser')); S('browser_kill_flash_ended', !mon().classList.contains('death-browser'));",
  // ---- PYTHON (console-ctx) ----
  "    showApp('show-python');",
  "    var pyOut = document.getElementById('monitor-py-out');",
  "    S('py_contextmenu_prevented', ctxAt(pyOut));",
  "    S('py_menu_present', !!ccMenu());",
  "    S('py_no_restart', !ccVisible('.cc-restart'));",
  "    S('py_kill_visible', ccVisible('.cc-kill'));",
  "    S('py_kill_disabled_when_cold', ccKillDisabled());",   // runtime not loaded → Kill inactive
  "    S('py_kill_label', ccText('.cc-kill'));",
  "    S('py_no_start_over', !ccReset());",
  "    S('menu_html', ccMenu()?ccMenu().outerHTML.replace(/\\s+/g,' ').slice(0,500):'');",
  // mark the runtime running → Kill enabled → runs the Black Knight flash, THEN destroys the app
  "    window.__pyRunning=function(){return true;};",
  "    showApp('show-python'); ctxAt(pyOut); S('py_menu_reopened', !!ccMenu());",
  "    S('py_kill_enabled_when_running', !ccKillDisabled());",
  "    ccMenu().querySelector('.cc-kill').click(); await sleep(40);",
  "    S('py_kill_hid_menu', !ccMenu());",
  "    S('py_kill_flash_started', mon().classList.contains('death-python'));",
  "    S('py_kill_still_open_during_flash', mon().classList.contains('show-python'));",
  "    await sleep(2700);",   // wait out the flash → destroyPython drops show-python
  "    S('py_kill_closed_app', !mon().classList.contains('show-python'));",
  "    S('py_kill_flash_ended', !mon().classList.contains('death-python'));",
  // Esc keeps app, closes menu
  "    showApp('show-python'); ctxAt(pyOut);",
  "    document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));",
  "    await sleep(80);",
  "    S('esc_hid_menu', !ccMenu());",
  "    S('esc_kept_app', mon().classList.contains('show-python'));",
  // Plain JS console: Kill is enabled (no runtime gate); no whole-loft action is mixed in.
  "    showApp('show-console');",
  "    var conOut=document.getElementById('monitor-console-out');",
  "    if(conOut){ ctxAt(conOut); S('console_no_restart', !ccVisible('.cc-restart')); S('console_no_start_over', !ccReset()); S('console_kill_visible', ccVisible('.cc-kill')); S('console_kill_enabled', !ccKillDisabled()); S('console_kill_label', ccText('.cc-kill')); S('console_menu_html', ccMenu()?ccMenu().outerHTML.replace(/\\s+/g,' '):''); }",
  "    else { S('console_no_restart','no-console-out'); S('console_no_start_over','no-console-out'); S('console_kill_visible','no-console-out'); S('console_kill_enabled','no-console-out'); S('console_kill_label','no-console-out'); S('console_menu_html',''); }",
  // console Kill now runs the JS-crash flatline flash, THEN refreshes: the menu hides + death-console
  // starts immediately; show-console stays up during the flash, then destroyConsole clears the
  // scrollback + drops show-console once it ends.
  "    if(conOut){ showApp('show-console'); conOut.innerHTML='<div>stale console line</div>'; ctxAt(conOut);",
  "      if(ccMenu()) ccMenu().querySelector('.cc-kill').click(); await sleep(40);",
  "      S('console_kill_hid_menu', !ccMenu()); S('console_kill_flash_started', mon().classList.contains('death-console')); S('console_kill_still_open_during_flash', mon().classList.contains('show-console'));",
  "      await sleep(2100);",
  "      S('console_kill_cleared_out', !/stale console line/.test(conOut.textContent)); S('console_kill_closed_app', !mon().classList.contains('show-console')); S('console_kill_flash_ended', !mon().classList.contains('death-console'));",
  "    } else { ['console_kill_hid_menu','console_kill_flash_started','console_kill_still_open_during_flash','console_kill_cleared_out','console_kill_closed_app','console_kill_flash_ended'].forEach(function(k){S(k,'no-console-out');}); }",
  // ---- LINUX (console-ctx) ----
  "    showApp('show-linux');",
  "    var lxOutEl=document.getElementById('monitor-linux-out');",
  "    ctxAt(lxOutEl); S('linux_menu_present', !!ccMenu()); S('linux_no_restart', !ccVisible('.cc-restart')); S('linux_no_start_over', !ccReset()); S('linux_kill_visible', ccVisible('.cc-kill'));",
  "    S('linux_kill_disabled_when_cold', ccKillDisabled());",
  "    if(ccMenu()) document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); await sleep(40); S('linux_menu_hidden', !ccMenu());",
  // ---- DOOM (mon-ctx) ----
  "    showApp('show-doom');",
  "    var doomWrap=document.getElementById('monitor-doom-wrap');",
  "    S('doom_ctx_prevented', ctxAt(mon()));",
  "    S('doom_menu_present', !!monMenu()); S('doom_items', monItems());",
  "    S('doom_no_restart', !monRestart()); S('doom_no_start_over', !monReset());",
  "    S('doom_kill_disabled_when_cold', monKillDisabled());",   // engine not up → Kill inactive
  // mark the engine running → Kill enabled → closes
  "    window.__doomRunning=function(){return true;};",
  "    showApp('show-doom'); ctxAt(mon());",
  "    S('doom_kill_enabled_when_running', !monKillDisabled());",
  // Kill now runs a ~2.1s FATALITY death-flash, THEN destroys the app: the menu hides + the
  // on-screen flash (death-doom) starts immediately; show-doom is torn down only after the flash.
  "    if(monKill()) monKill().click(); await sleep(40); S('doom_kill_hid_menu', !monMenu()); S('doom_kill_flash_started', mon().classList.contains('death-doom')); S('doom_kill_still_open_during_flash', mon().classList.contains('show-doom')); await sleep(2300); S('doom_kill_closed_app', !mon().classList.contains('show-doom')); S('doom_kill_flash_ended', !mon().classList.contains('death-doom'));",
  // Shoot's own Fullscreen control preserves both the shared monitor focus and its live iframe.
  "    if(window.__monitorZoomIn)window.__monitorZoomIn(); var fsBtn=document.getElementById('monitor-desk-fullscreen'),shootHost=document.getElementById('monitor-shoot-host'),shootFsRequested=false; fsBtn.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})); shootHost.requestFullscreen=function(){shootFsRequested=this===shootHost;return Promise.resolve();}; S('monitor_fs_btn_present', !!fsBtn);",
  "    showApp('show-doom'); document.querySelector('[data-shoot-game=\"doom\"]').click(); await sleep(120); var shootFrame=document.querySelector('#monitor-shoot-host iframe'),shootWindow=shootFrame.contentWindow,shootSrc=shootFrame.getAttribute('src'),shootLoads=0,shootFs=document.getElementById('monitor-doom-fullscreen');shootFrame.addEventListener('load',function(){shootLoads++;}); S('shoot_did_not_auto_fs',!shootFsRequested&&window.__monitorContentFullscreen()); shootFs.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));await sleep(40); S('monitor_fs_entered', shootFsRequested&&mon().classList.contains('show-doom')&&window.__monitorContentFullscreen()&&shootFrame===document.querySelector('#monitor-shoot-host iframe')&&shootWindow===shootFrame.contentWindow&&shootSrc===shootFrame.getAttribute('src')&&shootLoads===0&&!shootHost.contains(shootFs)&&shootHost.parentNode.id==='monitor-doom-wrap'); document.dispatchEvent(new Event('fullscreenchange')); await sleep(40); S('shoot_fs_returned_same_iframe',window.__monitorContentFullscreen()&&shootFrame===document.querySelector('#monitor-shoot-host iframe')&&shootWindow===shootFrame.contentWindow&&shootSrc===shootFrame.getAttribute('src')&&shootLoads===0&&shootHost.parentNode.id==='monitor-doom-wrap');",
  "    mon().classList.remove('show-caps');",
  // doom restart teardown — Restart now runs the FATALITY flash, THEN destroys (and would cold-boot,
  // but a real re-boot needs show-caps + the WASM runtime, out of scope here; no show-caps → openDoom
  // no-ops, so we just verify flash-then-teardown). show-doom is set from the fs block above.
  "    var before=document.querySelector('#monitor-shoot-host iframe'); var threw=null;",
  "    try { window.__restartMonitorDoom(); } catch(e){ threw=String(e); }",
  "    S('doom_restart_threw', threw);",
  "    S('doom_restart_flash_started', mon().classList.contains('death-doom'));",
  "    await sleep(2300);",  // wait out the ~2.1s flash → destroyDoom removes the iframe + drops show-doom
  "    var after=document.querySelector('#monitor-shoot-host iframe');",
  "    S('doom_restart_removed_iframe', !!before && !after);",
  "    S('doom_restart_torn_down', !mon().classList.contains('show-doom') && !mon().classList.contains('death-doom'));",
  // linux/python restart teardown direct
  // Linux Restart now runs a BSOD flash, THEN destroys (clears the console) and would cold-boot
  // (no show-caps here → openLinux no-ops); verify flash-then-teardown.
  "    showApp('show-linux'); var lo=document.getElementById('monitor-linux-out'); lo.innerHTML='<div>old</div>'; var lxThrew=null;",
  "    try { window.__restartMonitorLinux(); } catch(e){ lxThrew=String(e); }",
  "    S('linux_restart_threw', lxThrew); S('linux_restart_flash_started', mon().classList.contains('death-linux'));",
  "    await sleep(2800);",
  "    S('linux_restart_bsod_lingers', mon().classList.contains('death-linux') && /old/.test(lo.textContent));",
  "    await sleep(1600);",  // the extended BSOD (dur 4200) now finishes and destroys Linux
  "    S('linux_restart_cleared_out', !/old/.test(lo.textContent));",
  // Python Restart now runs the Monty Python Black Knight flash, THEN destroys (clears the output +
  // drops show-python) and would reopen a fresh REPL (no show-caps here → openPython no-ops); verify flash-then-teardown.
  "    showApp('show-python'); var po=document.getElementById('monitor-py-out'); po.innerHTML='<div>old-py</div>'; var pyThrew=null;",
  "    try { window.__restartMonitorPython(); } catch(e){ pyThrew=String(e); }",
  "    S('python_restart_threw', pyThrew); S('python_restart_flash_started', mon().classList.contains('death-python'));",
  "    await sleep(2700);",  // wait out the ~2.6s flash → destroyPython clears the output + drops show-python
  "    S('python_restart_cleared_out', !/old-py/.test(po.textContent)); S('python_restart_torn_down', !mon().classList.contains('show-python') && !mon().classList.contains('death-python'));",
  // ==== DESKTOP TASK REGISTRY + DOCK-ICON CONTEXT MENU ====
  // Open is universal. Kill appears only for an app registered by a real foreground launch;
  // a normal close/switch keeps that task registered. Heavy runtimes additionally need their
  // live-engine predicate. Desktop Kill must run the same themed hook as in-app Kill.
  "    function deskTile(id){ return document.getElementById('monitor-dock-'+id); }",
  "    function monOpen(){ var m=monMenu(); return m?m.querySelector('button.ctx-open'):null; }",
  "    function escMenu(){ document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true})); }",
  // A fresh desktop has no killable tasks and no dots; adding the overlay must not resize cells.
  "    if(window.__clearMonitorRunningApps) window.__clearMonitorRunningApps(); showApp('show-caps'); await sleep(0);",
  "    var desktopDock=document.getElementById('monitor-desktop-dock'); mon().classList.remove('tap-blink'); desktopDock.dispatchEvent(new MouseEvent('click',{bubbles:true})); S('desk_blank_click_no_flicker',!mon().classList.contains('tap-blink'));",
  "    var allTiles=['chrome','music','photobooth','video','call','chat','mail','tattoo','life','classics','shoot','snake','code','console','python','linux']; var freshOpenOnly=true;",
  "    for(var di=0;di<allTiles.length;di++){ctxAt(deskTile(allTiles[di])); if(!monOpen()||monKill()) freshOpenOnly=false; escMenu();}",
  "    S('desk_fresh_all_open_only',freshOpenOnly); S('desk_fresh_no_dots',allTiles.every(function(id){return !dot(id);}));",
  "    var mailTile=deskTile('mail'), mailBox0=mailTile.getBoundingClientRect();",
  // Open Mail through the real desktop path, then close normally. It stays registered/dotted.
  "    ctxAt(mailTile); if(monOpen()) monOpen().click(); await sleep(30); S('desk_mail_open_registered',mon().classList.contains('show-mail')&&reg('mail')&&dot('mail'));",
  "    if(window.__closeTopMonitorApp) window.__closeTopMonitorApp(); await sleep(20); var mailBox1=mailTile.getBoundingClientRect();",
  "    var mailIcon=mailTile.querySelector('.dock-tile'), mailDot=mailTile.querySelector('.dock-running-dot'), iconBox=mailIcon.getBoundingClientRect(), dotBox=mailDot.getBoundingClientRect();",
  "    S('desk_mail_close_kept_running',!mon().classList.contains('show-mail')&&reg('mail')&&dot('mail')); S('desk_dot_dimensions',{before:{width:mailBox0.width,height:mailBox0.height},after:{width:mailBox1.width,height:mailBox1.height}}); S('desk_dot_no_layout_shift',Math.abs(mailBox0.width-mailBox1.width)<.01&&Math.abs(mailBox0.height-mailBox1.height)<.01); S('desk_dot_is_circle',!!mailDot.querySelector('circle')&&Math.abs(dotBox.width-dotBox.height)<.1); S('desk_dot_bottom_right',dotBox.left>=iconBox.left+iconBox.width*.65&&dotBox.top>=iconBox.top+iconBox.height*.65&&dotBox.right<=iconBox.right+1&&dotBox.bottom<=iconBox.bottom+1);",
  "    S('desk_mail_prevented',ctxAt(mailTile)); S('desk_mail_items',monItems()); S('desk_mail_has_open',!!monOpen()); S('desk_mail_has_kill',!!monKill());",
  // Kill the backgrounded Mail task. It is surfaced and runs the same paper-airplane gag.
  "    if(monKill()) monKill().click(); await sleep(40); S('desk_mail_kill_same_gag',mon().classList.contains('show-mail')&&mon().classList.contains('death-mail')); S('desk_mail_kill_cleared',!reg('mail')&&!dot('mail')); S('desk_mail_kill_hid_menu',!monMenu());",
  "    if(window.__deathFlashCleanup) window.__deathFlashCleanup(); await sleep(20);",
  // A foreground switch registers both apps and backgrounds the first without clearing it.
  "    if(window.__clearMonitorRunningApps) window.__clearMonitorRunningApps(); showApp('show-mail'); await sleep(0); showApp('show-mines'); await sleep(0); showApp('show-caps'); await sleep(0);",
  "    S('desk_switch_kept_both_running',reg('mail')&&reg('classics')&&dot('mail')&&dot('classics'));",
  // Every monitor class, including toolbar-only Weather and the three runtime consoles, maps in.
  "    if(window.__clearMonitorRunningApps) window.__clearMonitorRunningApps(); var regApps=[['chrome','show-browser'],['music','show-nowplaying'],['photobooth','photobooth'],['video','show-video'],['call','show-family'],['chat','show-chat'],['mail','show-mail'],['calendar','show-calendar'],['clock','show-clock'],['tattoo','show-tattoo'],['classics','show-mines'],['life','show-life'],['shoot','show-doom'],['snake','show-snake'],['code','show-code'],['console','show-console'],['python','show-python'],['linux','show-linux'],['weather','show-weather'],['help','show-help']];",
  "    for(var ri=0;ri<regApps.length;ri++){showApp(regApps[ri][1]); await sleep(0);} showApp('show-caps'); await sleep(0);",
  "    S('desk_every_app_registered',regApps.every(function(a){return reg(a[0]);})); S('desk_every_tiled_app_dotted',regApps.filter(function(a){return a[0]!=='weather'&&a[0]!=='clock'&&a[0]!=='calendar'&&a[0]!=='help';}).every(function(a){return dot(a[0]);}));",
  // Every registered plain app, including Browser and Console, exposes its established Kill.
  "    var plainIds=['chrome','music','photobooth','video','call','chat','mail','tattoo','classics','life','code','console']; var plainKill=true;",
  "    for(var pi=0;pi<plainIds.length;pi++){ctxAt(deskTile(plainIds[pi])); if(!monKill()) plainKill=false; escMenu();} S('desk_registered_plain_apps_have_kill',plainKill);",
  // Verify every desktop action dispatches to that app's exact themed hook (Mail's real gag
  // above covers the visual integration; spies keep this full mapping check fast).
  "    var hookApps=[['chrome','__killMonitorBrowser'],['music','__killMonitorMusic'],['photobooth','__killMonitorPhotobooth'],['video','__killMonitorVideo'],['call','__killMonitorFamily'],['chat','__killMonitorChat'],['mail','__killMonitorMail'],['tattoo','__killMonitorTattoo'],['classics','__killMonitorClassics'],['life','__killMonitorLife'],['code','__killMonitorCode'],['console','__killMonitorConsole']]; var exactHooks=true;",
  "    for(var hi=0;hi<hookApps.length;hi++){var hp=hookApps[hi], oldHook=window[hp[1]], called=''; (function(id,name){window[name]=function(){called=id;};})(hp[0],hp[1]); ctxAt(deskTile(hp[0])); if(monKill()) monKill().click(); else exactHooks=false; if(called!==hp[0]||reg(hp[0])||dot(hp[0])) exactHooks=false; showApp('show-caps'); await sleep(0); window[hp[1]]=oldHook;} S('desk_exact_plain_kill_hooks',exactHooks);",
  // Host tile with runtime STOPPED remains Open-only even though its task is registered.
  "    window.__doomRunning=function(){return false;}; showApp('show-caps'); S('desk_doom_stopped_prevented', ctxAt(deskTile('shoot'))); S('desk_doom_stopped_items', monItems()); S('desk_doom_stopped_has_kill', !!monKill()); escMenu(); await sleep(20);",
  // Host tile with runtime RUNNING → Open + Kill (Open first).
  "    window.__doomRunning=function(){return true;}; showApp('show-caps'); ctxAt(deskTile('shoot')); S('desk_doom_running_items', monItems()); S('desk_doom_running_has_open', !!monOpen()); S('desk_doom_running_has_kill', !!monKill());",
  // The runtime keeps its own hook, while the registry/dot are cleared immediately.
  "    window.__killMonitorDoom=function(){window.__deskKill='shoot';}; window.__deskKill=null; if(monKill()) monKill().click(); await sleep(20); S('desk_doom_kill_called',window.__deskKill==='shoot'); S('desk_doom_kill_foregrounded_gag',mon().classList.contains('show-doom')); S('desk_doom_kill_cleared',!reg('shoot')&&!dot('shoot')); S('desk_doom_kill_hid_menu',!monMenu());",
  // Each remaining host maps to its own predicate + kill hook.
  "    window.__lxRunning=function(){return true;}; showApp('show-caps'); ctxAt(deskTile('linux')); S('desk_linux_running_has_kill', !!monKill()); escMenu(); await sleep(20);",
  "    window.__pyRunning=function(){return true;}; showApp('show-caps'); ctxAt(deskTile('python')); S('desk_python_running_has_kill', !!monKill()); escMenu(); await sleep(20);",
  // right-clicking a NON-icon desktop surface (the menu-bar brand) → no custom menu, native kept
  "    showApp('show-caps'); var brand=document.getElementById('monitor-system-brand'); S('desk_nontile_prevented', brand?ctxAt(brand):'no-brand'); S('desk_nontile_no_menu', !monMenu());",
  // Context menus never expose the global reset. The shared reset helper itself still routes
  // through confirmation + extinguisher, so verify that independently.
  "    showApp('show-mail'); ctxAt(mon()); S('global_reset_absent', !monReset()); if(monMenu())monMenu().remove();",
  "    var oldConfirm=window.__confirmRestart,oldActivate=window.__activateExtinguisher,oldStageIndex=window.__currentStageIndex,resetActivations=[]; window.__currentStageIndex=0; window.__activateExtinguisher=function(opts){resetActivations.push(opts||{});}; window.__confirmRestart=function(){return false;}; var rejected=window.__requestLoftReset(); await sleep(10); S('global_reset_reject',rejected===false&&resetActivations.length===0); window.__confirmRestart=function(){return true;}; var accepted=window.__requestLoftReset(); await sleep(10); S('global_reset_accept',accepted===true&&resetActivations.length===1&&resetActivations[0].resetDateTime===true); window.__confirmRestart=oldConfirm;window.__activateExtinguisher=oldActivate;window.__currentStageIndex=oldStageIndex;",
  // Console Restart now runs the JS-crash flatline flash, THEN refreshes (clears the scrollback +
  // drops show-console) and would reopen a fresh welcome (no show-caps here → openConsole no-ops);
  // verify flash-then-teardown, mirroring linux/python.
  "    showApp('show-console'); var co=document.getElementById('monitor-console-out'); if(co){ co.innerHTML='<div>old-console</div>'; } var conThrew=null;",
  "    try { window.__restartMonitorConsole(); } catch(e){ conThrew=String(e); }",
  "    S('console_restart_threw', conThrew); S('console_restart_flash_started', mon().classList.contains('death-console'));",
  "    await sleep(2100);",  // wait out the ~2s flatline flash → destroyConsole clears the console
  "    S('console_restart_cleared_out', co?!/old-console/.test(co.textContent):'no-console-out'); S('console_restart_torn_down', !mon().classList.contains('show-console') && !mon().classList.contains('death-console'));",
  "  }",
  "  window.addEventListener('load', function(){ setTimeout(function(){ run().catch(function(e){ window.__errs.push('harness: '+String(e&&e.stack||e)); }).then(function(){ report.errors=window.__errs; document.getElementById('__report').textContent=JSON.stringify(report); }); }, 400); });",
  "})();",
  "</script>"
].join("\n");

var rep = lib.runPageSync("rsvp.html", HARNESS, 70000, { patchRaf: true });
if (!rep) { console.log("  ✗ harness produced no report (page error before load, or budget too small)"); process.exit(1); }

var fails = 0;
function check(name, cond, detail) {
  if (cond) console.log("  ✓ " + name);
  else { fails++; console.log("  ✗ " + name + (detail !== undefined ? "   [" + JSON.stringify(detail) + "]" : "")); }
}
var s = rep.steps;
console.log("monitor right-click Kill menus + runtime helpers + shared fullscreen:");
console.log(" desktop (no app open):");
check("right-click on the bare monitor desktop eats the native menu, shows no custom menu", s.desktop_ctx_prevented === true && s.desktop_no_mon_menu === true && s.desktop_no_cc_menu === true, { prevented: s.desktop_ctx_prevented, mon: !s.desktop_no_mon_menu, cc: !s.desktop_no_cc_menu });
check("empty menu shells stay hidden and receive no Start over action", s.empty_menu_suppressed === true, s.empty_menu_suppressed);
check("outside click dismisses the Loft OS menu without activating the covered app", s.system_menu_opened === true && s.system_menu_outside_dismissed === true && s.system_menu_outside_blocked_app === true, { opened: s.system_menu_opened, dismissed: s.system_menu_outside_dismissed, blocked: s.system_menu_outside_blocked_app });
console.log(" non-runtime apps (mail/chat/weather/classics/music) — Kill only, enabled, no Restart:");
check("every sampled non-runtime app shows exactly an enabled Kill, no Restart", s.nonruntime_kill_only_enabled === true, s.nonruntime_detail);
check("a stationary touch hold on an EQ band opens Reset EQ and Kill", s.eq_touch_context &&
  s.eq_touch_context.reset === true && s.eq_touch_context.resetEnabled === true &&
  s.eq_touch_context.kill === true && s.eq_touch_reset === true, s.eq_touch_context);
check("System Information offers Copy before Kill and copies only the system fields", Array.isArray(s.system_context_items) && s.system_context_items.length === 2 && /copy/i.test(s.system_context_items[0] || "") && /kill/i.test(s.system_context_items[1] || "") && s.system_copy_report === true && s.system_copy_omits_recommendation === true, { items: s.system_context_items, report: s.system_copy_report, omittedRecommendation: s.system_copy_omits_recommendation });
check("Help Kill drops its question mark through both caption beats and closes", s.help_kill_started === true && s.help_kill_first_caption === true && s.help_kill_second_caption === true && s.help_kill_closed === true, { started: s.help_kill_started, first: s.help_kill_first_caption, second: s.help_kill_second_caption, closed: s.help_kill_closed });
check("an unzoomed app does not leak its Kill menu onto unrelated office props", s.outside_monitor_no_kill === true, { nativePreventedByProp: !s.outside_monitor_native, noMenu: s.outside_monitor_no_kill });
check("right-clicking the zoomed monitor rim keeps zoom and exposes the active app menu", s.rim_right_pointer_kept_zoom === true && s.rim_context_prevented === true && s.rim_menu_present === true, { zoom: s.rim_right_pointer_kept_zoom, prevented: s.rim_context_prevented, menu: s.rim_menu_present });
check("Mail Kill launches envelopes as planes, clears its task dot, and hides its menu", s.mail_kill_started === true && s.mail_kill_hid_menu === true && s.mail_kill_registry_cleared === true && s.mail_kill_envelopes === true && s.mail_kill_launched === true);
check("Mail Kill collides the planes, empties the tray, resets unread state, and closes", s.mail_kill_caption === true && s.mail_kill_collision === true && s.mail_kill_empty_tray === true && s.mail_kill_teardown === true, { caption: s.mail_kill_caption, collision: s.mail_kill_collision, empty: s.mail_kill_empty_tray, teardown: s.mail_kill_teardown });
check("Chat Kill starts on the open app and types the interrupted sentence", s.chat_kill_started === true && s.chat_kill_still_open === true && s.chat_kill_typing_stage === true);
check("Chat Kill safely cancels pending and queued work", s.chat_kill_cancelled_pending === true);
check("Chat Kill stops exactly at “I think, therefore I…”", s.chat_kill_stopped_thought === true);
check("Chat Kill collapses the conversation into context tokens", s.chat_kill_tokens === true);
check("Chat Kill ends on the exact cleared-system line and caption", s.chat_kill_context_cleared === true && s.chat_kill_caption === true);
check("Chat Kill resets history and input, removes death state, and closes", s.chat_kill_teardown === true);
check("Call Kill starts with the live call frozen behind a full signal", s.call_kill_started === true);
check("Call Kill drops its signal bars one at a time", s.call_kill_signal_dropping === true);
check("Call Kill cuts the waveform to a flat line and shows its exact caption", s.call_kill_wave_cut === true && s.call_kill_caption === true, { wave: s.call_kill_wave_cut, caption: s.call_kill_caption });
check("Call Kill silently ends the call and removes its death state", s.call_kill_teardown === true);
check("Calendar Kill accelerates through a full pad to bare backing, then closes", s.calendar_kill_started === true && s.calendar_kill_full_pad === true && s.calendar_kill_accelerating === true && s.calendar_kill_bare === true && s.calendar_kill_closed === true, { started: s.calendar_kill_started, full: s.calendar_kill_full_pad, accelerating: s.calendar_kill_accelerating, bare: s.calendar_kill_bare, closed: s.calendar_kill_closed });
check("Music Kill starts with its record scratch over live playback", s.music_kill_started === true);
check("Music Kill bends the live media element’s playback rate down", s.music_kill_slowed === true);
check("Music Kill sends the notes tumbling off their staff", s.music_kill_notes_falling === true);
check("Music Kill reaches silence with its exact caption", s.music_kill_silence === true && s.music_kill_caption === true, { silent: s.music_kill_silence, caption: s.music_kill_caption });
check("Music Kill rewinds the catalog, clears selection, and closes cleanly", s.music_kill_teardown === true);
check("browser menu shows only an enabled Kill, no Restart", Array.isArray(s.browser_items) && s.browser_items.length === 1 && /kill/i.test(s.browser_items[0] || "") && s.browser_kill_enabled === true && s.browser_has_restart === false, { items: s.browser_items, enabled: s.browser_kill_enabled, restart: s.browser_has_restart });
check("browser Kill runs the Aw-Snap flash then closes the app", s.browser_kill_hid_menu === true && s.browser_kill_flash_started === true && s.browser_kill_still_open_during_flash === true && s.browser_kill_closed_app === true && s.browser_kill_flash_ended === true, { hid: s.browser_kill_hid_menu, flash: s.browser_kill_flash_started, during: s.browser_kill_still_open_during_flash, closed: s.browser_kill_closed_app, ended: s.browser_kill_flash_ended });
console.log(" python / linux (folded into the console menu):");
check("contextmenu suppresses native menu over python console", s.py_contextmenu_prevented === true);
check("Code text fields expose Cut, Copy, Paste, Select all, then Kill app", s.code_edit_context_prevented === true && Array.isArray(s.code_edit_context_items) && s.code_edit_context_items.join("|") === "Cut|Copy|Paste|Select all|Kill app", s.code_edit_context_items);
check("Code context-menu Select all restores focus and selects the complete buffer", s.code_edit_select_all === true);
check("Code Kill runs the QBasic → DOS send-off, then clears its live buffer", s.code_kill_flash_started === true && s.code_kill_still_open_during_flash === true && s.code_kill_reached_dos === true && s.code_kill_closed_app === true && s.code_kill_flash_ended === true && s.code_kill_cleared_live_buffer === true, { flash: s.code_kill_flash_started, during: s.code_kill_still_open_during_flash, dos: s.code_kill_reached_dos, closed: s.code_kill_closed_app, ended: s.code_kill_flash_ended, cleared: s.code_kill_cleared_live_buffer });
check("Life Kill evolves a real five-cell glider, then closes the app", s.life_kill_flash_started === true && s.life_kill_still_open_during_flash === true && s.life_kill_glider_alive === true && s.life_kill_closed_app === true && s.life_kill_flash_ended === true, { flash: s.life_kill_flash_started, during: s.life_kill_still_open_during_flash, alive: s.life_kill_glider_alive, closed: s.life_kill_closed_app, ended: s.life_kill_flash_ended });
check("Tattoo Kill inks NO REGRETS, then resets and closes the studio", s.tattoo_kill_flash_started === true && s.tattoo_kill_still_open_during_flash === true && s.tattoo_kill_is_inking === true && s.tattoo_kill_closed_app === true && s.tattoo_kill_flash_ended === true, { flash: s.tattoo_kill_flash_started, during: s.tattoo_kill_still_open_during_flash, ink: s.tattoo_kill_is_inking, closed: s.tattoo_kill_closed_app, ended: s.tattoo_kill_flash_ended });
check("Video chooser Kill lets Behdad's camera roll, shoot back, and cut", s.video_kill_flash_started === true && s.video_kill_still_open_during_flash === true && s.video_kill_starts_framing === true && s.video_kill_camera_rolls === true && s.video_kill_camera_shoots_back === true && s.video_kill_closed_app === true && s.video_kill_flash_ended === true, { flash: s.video_kill_flash_started, during: s.video_kill_still_open_during_flash, framing: s.video_kill_starts_framing, rolling: s.video_kill_camera_rolls, shootsBack: s.video_kill_camera_shoots_back, closed: s.video_kill_closed_app, ended: s.video_kill_flash_ended });
check("Mines Kill reveals the board, chains every mine, blinks the last, freezes time and resets", s.mines_kill_flash_started === true && s.mines_kill_still_open_during_flash === true && s.mines_kill_timer_frozen === true && s.mines_kill_revealed_all === true && s.mines_kill_caption === "You found them." && s.mines_kill_chain_visible === true && s.mines_kill_xeyes === true && s.mines_kill_last_blinks === true && s.mines_kill_timer_stayed_frozen === true && s.mines_kill_final_pop === true && s.mines_kill_closed_app === true && s.mines_kill_flash_ended === true && s.mines_kill_reset_board === true, { flash: s.mines_kill_flash_started, during: s.mines_kill_still_open_during_flash, frozen: s.mines_kill_timer_frozen, reveal: s.mines_kill_revealed_all, caption: s.mines_kill_caption, chain: s.mines_kill_chain_visible, xeyes: s.mines_kill_xeyes, blink: s.mines_kill_last_blinks, timer: s.mines_kill_timer_stayed_frozen, final: s.mines_kill_final_pop, closed: s.mines_kill_closed_app, ended: s.mines_kill_flash_ended, reset: s.mines_kill_reset_board });
check("Photobooth Kill develops empty-chair frames, closes the last curtain, resets and closes", s.photobooth_kill_flash_started === true && s.photobooth_kill_still_open === true && s.photobooth_kill_cancelled_picker === true && s.photobooth_kill_strip_developing === true && s.photobooth_kill_caption === "Nobody blinked." && s.photobooth_kill_curtain_closing === true && s.photobooth_kill_curtain_closed === true && s.photobooth_kill_closed_app === true && s.photobooth_kill_flash_ended === true && s.photobooth_kill_reset_visual === true, { flash: s.photobooth_kill_flash_started, open: s.photobooth_kill_still_open, picker: s.photobooth_kill_cancelled_picker, strip: s.photobooth_kill_strip_developing, caption: s.photobooth_kill_caption, closing: s.photobooth_kill_curtain_closing, closedCurtain: s.photobooth_kill_curtain_closed, closed: s.photobooth_kill_closed_app, ended: s.photobooth_kill_flash_ended, reset: s.photobooth_kill_reset_visual });
check("Weather Kill cycles sun/rain/snow/lightning, strikes the app, resets and closes", s.weather_kill_flash_started === true && s.weather_kill_still_open === true && s.weather_kill_cycled_all === true && s.weather_kill_caption === "Under the weather." && s.weather_kill_struck === true && s.weather_kill_closed_app === true && s.weather_kill_flash_ended === true && s.weather_kill_reset_visual === true, { flash: s.weather_kill_flash_started, open: s.weather_kill_still_open, cycled: s.weather_kill_cycled_all, caption: s.weather_kill_caption, struck: s.weather_kill_struck, closed: s.weather_kill_closed_app, ended: s.weather_kill_flash_ended, reset: s.weather_kill_reset_visual });
check("console menu appears over python", s.py_menu_present === true);
check("python has no redundant app Restart", s.py_no_restart === true);
check("Kill item visible for python", s.py_kill_visible === true);
check("Kill is DISABLED while the python runtime isn't running", s.py_kill_disabled_when_cold === true);
check("Kill action is labelled 'Kill app'", s.py_kill_label === "Kill app", s.py_kill_label);
check("python menu has no whole-loft Start over", s.py_no_start_over === true);
check("Kill becomes ENABLED once the runtime is running", s.py_kill_enabled_when_running === true);
check("enabled Kill runs the Black Knight flash then destroys the python app", s.py_kill_hid_menu === true && s.py_kill_flash_started === true && s.py_kill_still_open_during_flash === true && s.py_kill_closed_app === true && s.py_kill_flash_ended === true);
check("Esc hides the menu", s.esc_hid_menu === true);
check("Esc leaves the app open (does not close it)", s.esc_kept_app === true);
check("plain JS console has no redundant app Restart", s.console_no_restart === true || s.console_no_restart === "no-console-out");
check("plain JS console gets an enabled Kill (no runtime to gate)", (s.console_kill_visible === true && s.console_kill_enabled === true) || s.console_kill_visible === "no-console-out");
check("console Kill action is labelled 'Kill app'", s.console_kill_label === "Kill app" || s.console_kill_label === "no-console-out", s.console_kill_label);
check("console menu has no whole-loft Start over", s.console_no_start_over === true || s.console_no_start_over === "no-console-out");
check("console menu copy/paste are Titlecase (Copy/Paste)", /Copy/.test(s.console_menu_html) && /Paste/.test(s.console_menu_html) || s.console_menu_html === "", s.console_menu_html ? s.console_menu_html.slice(0, 260) : "(none)");
check("console Kill runs the flatline flash then refreshes (clears scrollback + drops show-console)", (s.console_kill_hid_menu === true && s.console_kill_flash_started === true && s.console_kill_still_open_during_flash === true && s.console_kill_cleared_out === true && s.console_kill_closed_app === true && s.console_kill_flash_ended === true) || s.console_kill_hid_menu === "no-console-out", { hid: s.console_kill_hid_menu, flash: s.console_kill_flash_started, during: s.console_kill_still_open_during_flash, cleared: s.console_kill_cleared_out, closed: s.console_kill_closed_app, ended: s.console_kill_flash_ended });
check("console menu appears over linux with Kill, no Restart", s.linux_menu_present === true && s.linux_no_restart === true && s.linux_kill_visible === true);
check("linux Kill is DISABLED while the VM isn't running", s.linux_kill_disabled_when_cold === true);
check("linux menu has no whole-loft Start over", s.linux_no_start_over === true);
check("linux menu dismisses cleanly before shooter checks", s.linux_menu_hidden === true);
console.log(" doom (standalone menu):");
check("contextmenu suppresses native menu over doom", s.doom_ctx_prevented === true);
check("doom menu has Kill and no redundant Restart", s.doom_menu_present === true && Array.isArray(s.doom_items) && s.doom_items.length === 1 && /kill/i.test(s.doom_items[0]) && s.doom_no_restart === true, s.doom_items);
check("doom menu has no whole-loft Start over", s.doom_no_start_over === true);
check("doom Kill is DISABLED while the engine isn't running", s.doom_kill_disabled_when_cold === true);
check("doom Kill becomes ENABLED once the engine is running", s.doom_kill_enabled_when_running === true);
check("enabled doom Kill runs the FATALITY flash then destroys the app", s.doom_kill_hid_menu === true && s.doom_kill_flash_started === true && s.doom_kill_still_open_during_flash === true && s.doom_kill_closed_app === true && s.doom_kill_flash_ended === true);
check("shared monitor fullscreen button present", s.monitor_fs_btn_present === true);
check("choosing a shooter does not auto-enter browser fullscreen", s.shoot_did_not_auto_fs === true);
check("Shoot Fullscreen preserves monitor focus without reloading or reparenting the live iframe", s.monitor_fs_entered === true && s.shoot_fs_returned_same_iframe === true);
console.log(" runtime teardown helpers (no throws, real state reset):");
check("doom restart runs the flash then tears down the disposable iframe", s.doom_restart_threw === null && s.doom_restart_flash_started === true && s.doom_restart_removed_iframe === true && s.doom_restart_torn_down === true, s.doom_restart_threw);
check("linux restart holds the BSOD longer, then destroys + clears the console", s.linux_restart_threw === null && s.linux_restart_flash_started === true && s.linux_restart_bsod_lingers === true && s.linux_restart_cleared_out === true, s.linux_restart_threw);
check("python restart runs the Black Knight flash then destroys + clears the console", s.python_restart_threw === null && s.python_restart_flash_started === true && s.python_restart_cleared_out === true && s.python_restart_torn_down === true, s.python_restart_threw);
check("console restart runs the flatline flash then refreshes + clears the console", s.console_restart_threw === null && s.console_restart_flash_started === true && (s.console_restart_cleared_out === true || s.console_restart_cleared_out === "no-console-out") && s.console_restart_torn_down === true, s.console_restart_threw);
check("no uncaught JS errors during the run", Array.isArray(rep.errors) && rep.errors.length === 0, rep.errors);

// ==== DESKTOP TASK REGISTRY + DOCK-ICON CONTEXT MENU ====
console.log(" desktop running-app registry + dock-icon menu:");
check("blank desktop and menu-bar clicks do not blink the whole monitor", s.desk_blank_click_no_flicker === true);
check("fresh app tiles all expose Open only and have no running dots", s.desk_fresh_all_open_only === true && s.desk_fresh_no_dots === true);
check("real desktop Open registers and dots Mail", s.desk_mail_open_registered === true);
check("normal close backgrounds Mail without clearing its registry entry or dot", s.desk_mail_close_kept_running === true);
check("running dot does not change the dock cell dimensions", s.desk_dot_no_layout_shift === true, s.desk_dot_dimensions);
check("running marker is a geometrically round SVG LED", s.desk_dot_is_circle === true);
check("running dot sits inside the app icon’s bottom-right corner", s.desk_dot_bottom_right === true);
check("backgrounded Mail exposes Open + Kill (Open first)", s.desk_mail_prevented === true && Array.isArray(s.desk_mail_items) && s.desk_mail_items.length === 2 && /open/i.test(s.desk_mail_items[0] || "") && /kill/i.test(s.desk_mail_items[1] || "") && s.desk_mail_has_open === true && s.desk_mail_has_kill === true, s.desk_mail_items);
check("desktop Mail Kill runs the same paper-airplane gag, clears its task, and hides the menu", s.desk_mail_kill_same_gag === true && s.desk_mail_kill_cleared === true && s.desk_mail_kill_hid_menu === true, { gag: s.desk_mail_kill_same_gag, cleared: s.desk_mail_kill_cleared, hid: s.desk_mail_kill_hid_menu });
check("switching foreground apps keeps both tasks registered and dotted", s.desk_switch_kept_both_running === true);
check("all 20 monitor apps, including search-only Help/Calendar and toolbar Weather/Clock, register from their foreground class", s.desk_every_app_registered === true);
check("all 16 desktop apps receive a running dot", s.desk_every_tiled_app_dotted === true);
check("every registered plain app, including Browser and Console, offers Kill", s.desk_registered_plain_apps_have_kill === true);
check("every plain desktop Kill dispatches to that app's exact themed hook and clears its task", s.desk_exact_plain_kill_hooks === true);
check("registered runtime with engine STOPPED remains Open only", s.desk_doom_stopped_prevented === true && Array.isArray(s.desk_doom_stopped_items) && s.desk_doom_stopped_items.length === 1 && s.desk_doom_stopped_has_kill === false, s.desk_doom_stopped_items);
check("registered runtime with engine RUNNING exposes Open + Kill", Array.isArray(s.desk_doom_running_items) && s.desk_doom_running_items.length === 2 && /open/i.test(s.desk_doom_running_items[0] || "") && /kill/i.test(s.desk_doom_running_items[1] || "") && s.desk_doom_running_has_open === true && s.desk_doom_running_has_kill === true, s.desk_doom_running_items);
check("desktop runtime Kill foregrounds its gag, calls its hook, clears the registry/dot, and hides the menu", s.desk_doom_kill_called === true && s.desk_doom_kill_foregrounded_gag === true && s.desk_doom_kill_cleared === true && s.desk_doom_kill_hid_menu === true);
check("registered, live Linux and Python runtimes offer Kill", s.desk_linux_running_has_kill === true && s.desk_python_running_has_kill === true);
check("desktop right-click a non-icon surface shows no custom menu", s.desk_nontile_prevented === true && s.desk_nontile_no_menu === true, { prevented: s.desk_nontile_prevented });
check("app context menus never expose the global Start over action", s.global_reset_absent === true);
check("global Start over cancellation preserves state", s.global_reset_reject === true);
check("global Start over confirmation runs the extinguisher with date/time reset", s.global_reset_accept === true);

console.log("\n" + (fails ? ("FAILED " + fails + " check(s)") : "All menu checks passed."));
console.log("captured console menu HTML: " + (s.menu_html || "(none)"));
process.exit(fails ? 1 : 0);
