#!/usr/bin/env node
// Calendar-only birthdays, quiet party cakes, and migration of retired greeting state.
"use strict";
var lib = require("./lib");

async function probe() {
  var checks = [];
  function check(ok, label, detail) { checks.push({ ok: !!ok, label: label, detail: ok ? undefined : detail }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function ticks(n) { for (var i = 0; i < n; i++) window.__tickBirthdayCake(); }
  function quiet() {
    window.__stopCueDrip();
    window.__stopDayDrip();
    window.__showPartyExplorationCoach();
    window.__retirePartyRoomMapCoach();
    document.querySelectorAll('.hunt-coach-overlay.show .hunt-coach-x').forEach(function (b) { b.click(); });
    document.querySelectorAll('.msg-thumb.show').forEach(function (el) { el.click(); });
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  }
  function state() {
    return { room: window.__currentStageName, party: !!window.__gardenPartyOn, cake: !!window.__bdCakeOn,
      card: !!document.getElementById('sharecard-modal'), banner: document.getElementById('occasion-banner')?.textContent,
      messages: window.__phoneMessageThread().filter(function (id) { return /^bd_/.test(id); }) };
  }
  check(typeof window.__tickBirthdayCake === 'function' && !loft.calendar.birthday.show,
    'fresh source exposes birthday dates without preview actions');
  check(!state().party && !state().cake && !state().card && !state().banner && !state().messages.length,
    'birthday entry stays quiet on the splash', state());
  var before = JSON.stringify(loft.calendar.date.status());
  ['b', 'B'].forEach(function (key) { document.dispatchEvent(new KeyboardEvent('keydown', { key: key, shiftKey: key === 'B', bubbles: true, cancelable: true })); });
  check(JSON.stringify(loft.calendar.date.status()) === before && !state().party, 'B and Shift+B no longer jump dates or start parties');
  var list = loft.calendar.birthday.list().value;
  check(list.some(function (b) { return b.id === 'baharak' && b.month === 8 && b.day === 10; }) &&
    !list.some(function (b) { return ['ali', 'goli', 'patricia-son', 'patricia-daughter'].includes(b.id); }),
    'real birthday dates remain listed and dateless people stay excluded');
  for (var day of [9, 10, 11]) {
    await loft.calendar.date.set('2031-09-' + day.toString().padStart(2, '0'));
    check(document.body.classList.contains('bd-baharak') === (day === 10) &&
      document.getElementById('loft-game-strip').classList.contains('bd-baharak') === (day === 10),
      'Baharak’s headwear uses September 10 only: ' + day);
  }
  await loft.calendar.date.set('2031-01-20');
  window.__calResetView();
  var calendar = document.createElement('div'); document.body.appendChild(calendar);
  window.__calendarRender(calendar, 'phone');
  var cell = Array.from(calendar.querySelectorAll('.calx-day')).find(function (el) { return el.querySelector('.calx-num')?.textContent === '20'; });
  check(cell && cell.querySelector('.calx-bust'), 'calendar retains Markéta’s birthday portrait');
  cell.click();
  check(!state().party && !state().cake && !state().card && !state().banner, 'birthday calendar click selects the date without a celebration', state());
  await loft.calendar.date.set('2031-08-12');
  window.__calendarRender(calendar, 'phone');
  var sharedDay = Array.from(calendar.querySelectorAll('.calx-day')).find(function (el) { return el.querySelector('.calx-num')?.textContent === '12'; });
  var roomBefore = state().room;
  sharedDay.click();
  check(state().room === roomBefore && !state().party, 'a birthday sharing a meteor-shower date still leaves the visitor in place');
  await loft.calendar.date.set('2031-01-20');
  calendar.remove();
  window.__checkpointPhoneRestore({ birthdayCelebrations: [{ who: 'baharak' }], rows: [
    { id: 'bd_baharak', message: { fromKey: 'msg_behdad_from', bodyKey: 'bd_msg_a', bdName: 'Baharak', act: 'bd:baharak' } },
    { id: 'cue_calendar', message: {} }
  ] });
  window.__restoreCheckpointSystems({ 'party-message-reveal': { started: true, complete: false, remaining: 0,
    queue: [{ id: 'bd_baharak', autonomous: true }] } }, 'beforeStage');
  check(!window.__phoneMessageThread().includes('bd_baharak') && window.__phoneMessageThread().includes('cue_calendar') &&
    !window.__partyMessageRevealGateState().queued.includes('bd_baharak'),
    'Continue discards old birthday greetings and queued announcements while retaining ordinary messages');
  check(window.__shareOccasion().kind !== 'birthday' && !window.__shareBirthdayOcc && !window.__queueBirthdayCelebration,
    'birthday postcard and reveal owners are removed');
  ticks(25);
  check(!state().party && !state().cake, 'the quiet cake never starts a party');
  window.__removeClickMe(); window.__finishOpeningGuide(); window.__endAttract();
  await loft.party.set(true);
  await loft.room.go('office');
  ticks(25);
  check(state().room === 'office' && !state().cake, 'a birthday never pulls the visitor away from another room', state());
  await loft.room.go('garden');
  window.__summonGuests();
  await sleep(4600);
  quiet();
  await sleep(400);
  var focused = document.hasFocus;
  document.hasFocus = function () { return false; }; ticks(25);
  check(!state().cake, 'unfocused parties cannot start a birthday cake');
  document.hasFocus = focused;
  window.__setPartyForegroundSuspended(true, 'birthday-test'); ticks(25);
  check(!state().cake, 'a suspended party cannot start a birthday cake');
  window.__setPartyForegroundSuspended(false);
  var viewport = document.querySelector('.hunt-viewport');
  viewport.style.display = 'none'; ticks(25);
  check(!state().cake, 'a scene hidden by the portrait prompt cannot consume its birthday cake');
  viewport.style.removeProperty('display');
  // The real party clock invokes this owner; deterministic ticks exercise its twenty-second budget.
  ticks(25);
  var cutter = document.querySelector('#garden-guests .g-marketa');
  check(state().cake && state().party && state().room === 'garden' && cutter.classList.contains('bd-cutter') &&
    getComputedStyle(cutter.querySelector('.bd-crown-marketa')).visibility === 'visible',
    'an attended party gets its birthday cake and visible crowned honoree', state());
  check(!state().messages.length && !state().card && !state().banner, 'the cake has no greeting, banner, or postcard', state());
  var systems = window.__captureCheckpointSystems();
  check(systems['birthday-cake'].seen.includes('2031-1-20'), 'the once-per-date cake is checkpointed');
  window.__beginBdCandleBlow(); await sleep(850);
  check(document.getElementById('garden-bd-cake').classList.contains('blown'), 'the honoree still blows out the candles');
  await sleep(1800); ticks(25);
  check(!state().cake && !state().card && state().party, 'the cake finishes without a card and does not repeat', state());
  await loft.party.set(false); await loft.party.set(true); window.__summonGuests();
  quiet(); ticks(25);
  check(!state().cake, 'toggling the party does not replay the cake');
  window.__resetCheckpointSystems();
  window.__restoreCheckpointSystems(systems, 'beforeStage'); ticks(25);
  check(!state().cake && window.__captureCheckpointSystems()['birthday-cake'].seen.includes('2031-1-20'),
    'Continue remembers a cake already seen');
  await loft.calendar.date.set('2031-06-24');
  quiet(); window.__summonGuests(); ticks(25);
  var madla = document.querySelector('#garden-guests .g-madla');
  check(state().cake && madla.classList.contains('arrived') && getComputedStyle(madla).visibility === 'visible' &&
    getComputedStyle(madla.querySelector('.bd-crown-madla')).visibility === 'visible',
    'a new birthday brings in the whole honoree, never a floating crown', state());
  await loft.calendar.date.set('2031-06-25');
  check(!state().cake && !document.getElementById('loft-game-strip').classList.contains('bd-madla') && !madla.classList.contains('bd-honoree'),
    'leaving the birthday date clears its cake and headwear');
  await loft.party.set(false);
  return { checks: checks, errors: window.__errs };
}
var harness = '<pre id="__report" style="display:none">pending</pre><script>window.addEventListener("load",function(){setTimeout(async function(){try{document.getElementById("__report").textContent=JSON.stringify(await (' + probe.toString() + ')());}catch(e){document.getElementById("__report").textContent=JSON.stringify({error:String(e.stack||e)});}},350);});</script>';
var report = lib.runPageCdpSync('rsvp.html', harness, 35000, { forceMotion: true, seedRandom: true, patchRaf: true, urlSuffix: '?date=2031-01-20&birthday-test=' + Date.now() });
if (!report || report.error) { console.error(report); process.exit(1); }
report.checks.forEach(function (c) { console.log('  ' + (c.ok ? '✓' : '✗') + ' ' + c.label + (c.ok ? '' : ' — ' + JSON.stringify(c.detail))); });
if (report.errors.length) console.error(report.errors);
if (report.errors.length || report.checks.some(function (c) { return !c.ok; })) process.exit(1);
console.log('All birthday checks passed.');
