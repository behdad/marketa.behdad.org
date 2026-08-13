#!/usr/bin/env node
"use strict";

// Tab and the grid button own a full-loft picker from the beginning. The floor button stays
// visible but disabled until downstairs is discovered; Enter opens or deliberately unlocks rooms.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function key(name, repeat) {
    var event = new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, repeat: !!repeat });
    document.dispatchEvent(event);
    return event.defaultPrevented;
  }
  function state() { return window.__dollhouseState(); }
  function roomButton(name) {
    return document.querySelector('.loft-dollhouse-room[data-dollhouse-room="' + name + '"]');
  }
  function report() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre"); pre.id = "__report"; pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  async function run() {
    if (window.__removeClickMe) window.__removeClickMe();
    if (window.__stopHintBlink) window.__stopHintBlink();
    key("?");
    await sleep(20);
    var tabChip = [].slice.call(document.querySelectorAll(".kbd-keys")).filter(function (row) { return row.textContent === "Tab"; })[0];
    check("the keyboard dialog documents Tab as the whole-loft picker",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent === "open / close the whole-loft view",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent);
    key("Escape");
    await sleep(280);
    window.__setLang("cs"); key("?"); await sleep(20);
    tabChip = [].slice.call(document.querySelectorAll(".kbd-keys")).filter(function (row) { return row.textContent === "Tab"; })[0];
    check("the keyboard dialog mirrors the Tab help in Czech",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent === "otevřít / zavřít pohled na celý loft",
      tabChip && tabChip.nextElementSibling && tabChip.nextElementSibling.textContent);
    key("Escape");
    await sleep(280);
    window.__setLang("en");
    window.__resetLowerRoomDiscovery();
    window.__setSeenRooms(["kitchen", "bathroom"]);

    var realTransportState = window.__entranceRoadtripTransportState;
    var realTransportToggle = window.__toggleEntranceRoadtripTransport;
    var transportPaused = false, transportPauseCalls = 0;
    window.__entranceRoadtripTransportState = function () {
      return { active: true, paused: transportPaused };
    };
    window.__toggleEntranceRoadtripTransport = function () {
      transportPauseCalls++;
      transportPaused = true;
      return true;
    };
    var undiscoveredTab = key("Tab");
    check("Tab opens The Loft before downstairs is discovered and both chrome buttons are present",
      undiscoveredTab && state().eligible && !state().controlsUnlocked && state().button && state().floorDisabled && state().open &&
        !document.getElementById("hunt-floor-btn").hidden && !document.getElementById("hunt-dollhouse-btn").hidden,
      JSON.stringify(state()));
    var firstUpperPreviews = [].slice.call(document.querySelectorAll("#loft-dollhouse-main use.loft-dollhouse-live-preview"));
    var firstLowerPreviews = [].slice.call(document.querySelectorAll("#loft-dollhouse-lower use.loft-dollhouse-live-preview"));
    check("the first Dollhouse stays visually withheld while its upper previews prepare",
      firstUpperPreviews.length === 5 && firstUpperPreviews.every(function (use) { return use.style.display === "none"; }) &&
        firstLowerPreviews.length === 5 && firstLowerPreviews.every(function (use) { return use.style.display !== "none"; }) &&
        getComputedStyle(document.getElementById("loft-dollhouse")).opacity === "0",
      JSON.stringify({ upper: firstUpperPreviews.map(function (use) { return use.style.display; }),
        lower: firstLowerPreviews.map(function (use) { return use.style.display; }),
        opacity: getComputedStyle(document.getElementById("loft-dollhouse")).opacity }));
    await sleep(140);
    check("the first Dollhouse appears only after every live upper preview is ready",
      firstUpperPreviews.every(function (use) { return use.style.display !== "none"; }) &&
        getComputedStyle(document.getElementById("loft-dollhouse")).opacity === "1",
      JSON.stringify({ upper: firstUpperPreviews.map(function (use) { return use.style.display; }),
        opacity: getComputedStyle(document.getElementById("loft-dollhouse")).opacity }));
    check("opening The Loft pauses an active Road Trip exactly once",
      transportPauseCalls === 1 && transportPaused,
      JSON.stringify({ calls: transportPauseCalls, paused: transportPaused }));
    check("the Entrance card mirrors the active Road Trip without its pause overlay",
      roomButton("entrance").querySelector("use.loft-dollhouse-live-preview").getAttribute("href") ===
        "#entrance-roadtrip-world" &&
      roomButton("entrance").querySelector("svg").getAttribute("viewBox") === "0 -120 680 216" &&
      document.getElementById("entrance-roadtrip-pause-dialog").style.display === "none");
    check("the first Cuddly-puddly thumbnail is initialized with a warm projector image",
      document.getElementById("cuddly-wallscreen").classList.contains("chan-fire") &&
      !!document.getElementById("cuddly-flame-img").getAttribute("href") &&
      document.getElementById("cuddly-flame-img").style.filter === "none");
    check("the Entrance thumbnail uses the real scene's daylight state",
      document.getElementById("entrance-room-art").classList.contains("dollhouse-day-preview") &&
      !document.getElementById("entrance-sky-bg").getAttribute("style"));
    check("the first Bathroom thumbnail has a towel paint fallback",
      document.getElementById("bathroom-waffle-towel").getAttribute("fill") ===
        "url(#bathroom-waffle) #a8a39e");
    var parkedUpperSources = ["stage-garden", "stage-cuddly", "stage-office", "stage-balcony"]
      .map(function (id) { return document.getElementById(id); });
    check("opening The Loft makes every parked upper source tree raster-visible for WebKit",
      parkedUpperSources.every(function (stage) {
        return stage.classList.contains("stage-far") && getComputedStyle(stage).visibility === "visible" &&
          getComputedStyle(stage.firstElementChild).visibility === "visible";
      }), parkedUpperSources.map(function (stage) {
        return stage.id + ":" + getComputedStyle(stage).visibility + "/" +
          getComputedStyle(stage.firstElementChild).visibility;
      }).join(","));
    var officeMonitor = document.getElementById("office-monitor");
    var monitorScreen = document.getElementById("office-monitor-screen-content");
    var officeMonitorPreview = document.querySelector('[data-dollhouse-room="office"] .loft-dollhouse-office-monitor-preview');
    check("the powered-off Office preview keeps the real dark monitor instead of caps art",
      officeMonitor.classList.contains("dollhouse-preview") &&
        getComputedStyle(monitorScreen).display === "none" &&
        officeMonitorPreview && getComputedStyle(officeMonitorPreview).display === "none");
    officeMonitor.classList.add("screen-on");
    window.__refreshRoomDots();
    check("powering the monitor reveals the static caps thumbnail",
      getComputedStyle(officeMonitorPreview).display !== "none");
    officeMonitor.classList.remove("screen-on");
    window.__refreshRoomDots();
    key("Tab");
    check("closing The Loft restores the Road Trip pause overlay",
      document.getElementById("entrance-roadtrip-pause-dialog").style.display === "");
    check("closing The Loft restores the real Office monitor surface",
      !officeMonitor.classList.contains("dollhouse-preview"));
    check("closing The Loft removes the entire cached picker from paint",
      getComputedStyle(document.getElementById("loft-dollhouse")).display === "none");
    check("closing The Loft retains every cached room card in its warm DOM",
      document.querySelectorAll(".loft-dollhouse-room").length === 10);
    check("closing The Loft bounds every warm upper-room source to its own stage",
      parkedUpperSources.every(function (stage) {
        return stage.classList.contains("stage-far") && getComputedStyle(stage).visibility === "visible" &&
          getComputedStyle(stage).clipPath.indexOf("loft-stage-room-clip") >= 0;
      }),
      parkedUpperSources.map(function (stage) {
        return stage.id + ":" + getComputedStyle(stage).visibility + "/" + getComputedStyle(stage).clipPath;
      }).join(","));
    window.__openDollhouse();
    check("reopening restores every cached room card without rebuilding it",
      [].slice.call(document.querySelectorAll(".loft-dollhouse-room")).every(function (room) {
        return getComputedStyle(room).visibility === "visible";
      }), [].slice.call(document.querySelectorAll(".loft-dollhouse-room")).map(function (room) {
        return room.getAttribute("data-dollhouse-room") + ":" + getComputedStyle(room).visibility;
      }).join(","));
    check("reopening the cached Dollhouse reveals all live upper sources again",
      parkedUpperSources.every(function (stage) {
        return stage.classList.contains("stage-far") && getComputedStyle(stage).visibility === "visible" &&
          getComputedStyle(stage.firstElementChild).visibility === "visible" &&
          getComputedStyle(stage).clipPath === "none";
      }), parkedUpperSources.map(function (stage) {
        return stage.id + ":" + getComputedStyle(stage).visibility + "/" +
          getComputedStyle(stage.firstElementChild).visibility;
      }).join(","));
    window.__closeDollhouse();
    document.getElementById("entrance-drive-hud-svg").setAttribute("viewBox", "0 -120 680 340");
    window.__entranceRoadtripTransportState = function () {
      return { active: true, paused: false, route: "camp" };
    };
    document.getElementById("entrance-room").classList.add("roadtrip-active", "roadtrip-route-camp");
    window.__frameHealthFeed(0); window.__frameHealthFeed(0);
    key("Tab");
    check("low-FPS Dollhouse pauses its live source animations", state().pausedAnimations > 0,
      JSON.stringify(state()));
    check("the Entrance card fills with the live Camping view",
      roomButton("entrance").querySelector("use.loft-dollhouse-live-preview").getAttribute("href") ===
        "#entrance-roadtrip-world" &&
      roomButton("entrance").querySelector("svg").getAttribute("viewBox") === "0 -120 680 340" &&
      roomButton("entrance").querySelector("use.loft-dollhouse-live-preview").getAttribute("x") === "0" &&
      roomButton("entrance").querySelector("use.loft-dollhouse-live-preview").getAttribute("y") === "0" &&
      document.getElementById("entrance-roadtrip-run-panel").parentElement.style.display === "none");
    key("Tab");
    check("closing Dollhouse resumes only the animations it paused", state().pausedAnimations === 0,
      JSON.stringify(state()));
    window.__frameHealthFeed(60); window.__frameHealthFeed(60); window.__frameHealthFeed(60);
    check("closing the Camping preview restores its live SVG styles",
      document.getElementById("entrance-roadtrip-run-panel").parentElement.style.display === "" &&
      document.getElementById("entrance-roadtrip-world-clip").style.clipPath === "" &&
      document.getElementById("entrance-roadtrip-camp").style.opacity === "");
    document.getElementById("entrance-room").classList.remove("roadtrip-active", "roadtrip-route-camp");
    document.getElementById("entrance-drive-hud-svg").setAttribute("viewBox", "0 -31 680 207");
    window.__entranceRoadtripTransportState = realTransportState;
    window.__toggleEntranceRoadtripTransport = realTransportToggle;

    document.getElementById("stage-balcony").classList.add("dusk");
    key("Tab");
    check("the Entrance thumbnail follows the live night state",
      !document.getElementById("entrance-room-art").classList.contains("dollhouse-day-preview"));
    key("Tab");
    document.getElementById("stage-balcony").classList.remove("dusk");

    await sleep(0);
    var tabStops = [].slice.call(document.querySelectorAll("button,a[href],input,select,textarea,summary,iframe,[contenteditable],[tabindex]"))
      .filter(function (el) { return el.tabIndex >= 0; });
    check("the game exposes no browser tab stops", !tabStops.length,
      tabStops.map(function (el) { return el.id || el.className || el.tagName; }).join(","));
    var gameViewport = document.querySelector(".hunt-viewport");
    gameViewport.focus();
    check("programmatic scene focus never paints a full-frame browser outline",
      getComputedStyle(gameViewport).outlineStyle === "none", getComputedStyle(gameViewport).outline);

    window.__markLowerRoomDiscovered();
    check("discovering downstairs enables the persistent floor button without inventing a coach",
      state().eligible && state().controlsUnlocked && state().button && !state().floorDisabled &&
        !document.getElementById("hunt-floor-coach"), JSON.stringify(state()));

    window.__goToStage("kitchen");
    window.__openBathroomRoom();
    await sleep(260);
    check("the first downstairs visit keeps both flanking controls visible and the floor control enabled",
      !document.getElementById("hunt-floor-btn").hidden && !document.getElementById("hunt-floor-btn").disabled &&
      !document.getElementById("hunt-dollhouse-btn").hidden && !document.getElementById("hunt-floor-coach"), JSON.stringify(state()));

    var gridButton = document.getElementById("hunt-dollhouse-btn");
    gridButton.focus();
    gridButton.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true, pointerType: "mouse" }));
    gridButton.click();
    check("using the persistent grid button opens the picker without retaining browser focus",
      state().open && gridButton.getAttribute("tabindex") === "-1" && document.activeElement !== gridButton,
      JSON.stringify({ state: state(), tabindex: gridButton.getAttribute("tabindex"), active: document.activeElement && document.activeElement.id }));
    key("Tab");
    check("Tab closes the same picker without leaving the lower room", !state().open && window.__bathroomRoomOpen, JSON.stringify(state()));

    var tabHandled = key("Tab");
    var opened = state(), locked = opened.rooms.filter(function (room) { return room.locked; });
    check("Tab opens the same picker", tabHandled && opened.open, JSON.stringify(opened));
    check("the 5×2 overview exposes only the two rooms actually visited",
      opened.rooms.length === 10 && locked.length === 8 &&
      opened.rooms.filter(function (room) { return !room.locked; }).map(function (room) { return room.room; }).join(",") === "kitchen,bathroom",
      JSON.stringify(opened.rooms));
    check("locked cells retain their real names and blur both name and thumbnail",
      roomButton("garden").classList.contains("locked") &&
      roomButton("garden").querySelector("span").textContent === "Garden / Party" &&
      getComputedStyle(roomButton("garden").querySelector("span")).filter.indexOf("blur") !== -1 &&
      getComputedStyle(roomButton("garden").querySelector("svg")).filter.indexOf("blur") !== -1);
    check("all lower previews are SVG uses of their real art or the Dungeon portrait",
      ["bathroom", "cinema", "bedroom", "entrance"].every(function (name) {
        return roomButton(name).querySelector('use.loft-dollhouse-live-preview');
      }) && roomButton("dungeon").querySelector('use[href="#loft-dollhouse-dungeon-art"]'));
    check("the Cinema lake belongs only to its dollhouse preview",
      !!roomButton("cinema").querySelector('use.loft-dollhouse-cinema-lake[href="#cinema-lake-screen-art"]') &&
      !document.querySelector('#cinema-room use[href="#cinema-lake-screen-art"]') &&
      !document.getElementById("cinema-screen-lake"));
    check("Cinema click targets stay transparent in the cloned room art",
      getComputedStyle(document.querySelector("#cinema-room-art .cinema-hit")).fill === "rgba(0, 0, 0, 0)",
      getComputedStyle(document.querySelector("#cinema-room-art .cinema-hit")).fill);
    var roomBeforeKey = window.__currentStageName;
    key("ArrowRight");
    check("the open picker blocks room shortcuts from acting underneath it",
      state().open && window.__currentStageName === roomBeforeKey && window.__bathroomRoomOpen,
      JSON.stringify({ room: window.__currentStageName, open: state().open }));

    window.__setLang("cs");
    check("the open overview follows Czech live",
      document.getElementById("loft-dollhouse-title").textContent === "Loft 🗺️" &&
      roomButton("kitchen").textContent.indexOf("Kuchyň") !== -1 &&
      roomButton("garden").textContent.indexOf("Zahrada / Párty") !== -1,
      document.getElementById("loft-dollhouse-title").textContent);
    window.__setLang("en");

    var lockedDungeon = roomButton("dungeon"), before = window.__currentStageName;
    lockedDungeon.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
    check("a scripted click cannot use an undiscovered room as a navigation shortcut",
      state().open && window.__currentStageName === before && window.__bathroomRoomOpen,
      JSON.stringify({ room: window.__currentStageName, open: state().open }));

    key("Escape");
    check("Escape closes the picker without changing rooms",
      !state().open && window.__currentStageName === before && window.__bathroomRoomOpen, JSON.stringify(state()));
    key("Tab");

    roomButton("kitchen").click();
    check("a discovered main-floor cell closes the picker and returns upstairs",
      !state().open && window.__currentStageName === "kitchen" && !window.__bathroomRoomOpen, JSON.stringify(state()));
    key("Tab");
    roomButton("bathroom").click();
    check("a discovered lower-floor cell opens its paired room",
      !state().open && window.__currentStageName === "kitchen" && window.__bathroomRoomOpen, JSON.stringify(state()));

    key("Tab");
    document.getElementById("loft-game-strip").classList.add("party-on");
    window.__closeDollhouse(); key("Tab");
    check("the Kitchen / Bar cell switches its complete live stage to the Bar with the party",
      roomButton("kitchen").classList.contains("bar-active") &&
      roomButton("kitchen").querySelector("span").textContent === "Kitchen / Bar" &&
      roomButton("kitchen").querySelector("use.loft-dollhouse-live-preview").getAttribute("href") === "#stage-kitchen" &&
      document.getElementById("kitchen-bar").style.opacity === "1" &&
      document.getElementById("kitchen-post").style.opacity === "1");
    document.getElementById("loft-game-strip").classList.remove("party-on");
    window.__closeDollhouse();

    document.getElementById("loft-game-strip").classList.remove("second-round");
    document.getElementById("stage-kitchen").classList.add("dusk");
    key("Tab");
    check("first-round dusk keeps the Kitchen / Bar cell in the live Kitchen mode",
      !roomButton("kitchen").classList.contains("bar-active") &&
      document.getElementById("kitchen-bar").style.opacity !== "1");
    window.__closeDollhouse();

    document.getElementById("loft-game-strip").classList.add("second-round");
    key("Tab");
    check("the Kitchen / Bar cell switches to the Bar at night in the second round",
      roomButton("kitchen").classList.contains("bar-active") &&
      document.getElementById("kitchen-bar").style.opacity === "1");
    document.getElementById("stage-kitchen").classList.remove("dusk");
    document.getElementById("loft-game-strip").classList.remove("second-round");
    window.__closeDollhouse();

    if (window.__bathroomRoomOpen && window.__closeBathroomRoom) window.__closeBathroomRoom();
    await sleep(450);
    window.__resetLowerRoomDiscovery();
    check("Start-over clears discovery, disables floor travel, and leaves the picker available",
      state().eligible && !state().controlsUnlocked && state().button && state().floorDisabled && !state().open,
      JSON.stringify(state()));

    key("Tab");
    roomButton("garden").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    check("double-clicking a locked destination deliberately unlocks and enters it",
      !state().open && window.__currentStageName === "garden" && window.__roomSeen("garden"),
      JSON.stringify({ room: window.__currentStageName, open: state().open }));

    window.__setSeenRooms(["kitchen"]);
    key("Tab");
    roomButton("cinema").dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true }));
    check("unlocking a lower card does not also discover its paired upper room",
      !state().open && window.__currentStageName === "cuddly" && window.__cinemaRoomOpen &&
      window.__roomSeen("cinema") && !window.__roomSeen("cuddly"),
      JSON.stringify({ room: window.__currentStageName, seen: window.__seenRooms(), open: state().open }));
    key("Tab");
    check("reopening The Loft keeps only the selected lower card sharp",
      !roomButton("cinema").classList.contains("locked") &&
      roomButton("cuddly").classList.contains("locked"),
      JSON.stringify({ seen: window.__seenRooms(), rooms: state().rooms }));
    window.__closeDollhouse();
    if (window.__cinemaRoomOpen && window.__closeCinemaRoom) window.__closeCinemaRoom();

    window.__goToStage("kitchen");
    window.__setSeenRooms(["kitchen"]);
    key("Tab");
    key("ArrowRight");
    var lockedMainFirst = key("Enter");
    var lockedMainFirstState = state(), lockedMainFirstSeen = window.__roomSeen("garden");
    var lockedMainRepeat = key("Enter", true);
    var lockedMainRepeatState = state(), lockedMainRepeatSeen = window.__roomSeen("garden");
    key("Enter");
    check("a locked main-floor cursor needs two deliberate Enter presses and ignores auto-repeat",
      lockedMainFirst && lockedMainRepeat && lockedMainFirstState.open && lockedMainRepeatState.open &&
      !lockedMainFirstSeen && !lockedMainRepeatSeen && !state().open &&
      window.__currentStageName === "garden" && window.__roomSeen("garden"),
      JSON.stringify({ first: lockedMainFirstState, repeat: lockedMainRepeatState,
        room: window.__currentStageName, seen: window.__seenRooms(), open: state().open }));

    window.__setSeenRooms(["kitchen"]);
    key("Tab");
    key("ArrowDown");
    var lockedLowerFirst = key("Enter");
    var lockedLowerFirstState = state(), lockedLowerFirstSeen = window.__roomSeen("dungeon");
    var lockedLowerRepeat = key("Enter", true);
    var lockedLowerRepeatState = state(), lockedLowerRepeatSeen = window.__roomSeen("dungeon");
    key("Enter");
    check("the same two-Enter contract unlocks a lower-floor destination",
      lockedLowerFirst && lockedLowerRepeat && lockedLowerFirstState.open && lockedLowerRepeatState.open &&
      !lockedLowerFirstSeen && !lockedLowerRepeatSeen && !state().open &&
      window.__currentStageName === "garden" && window.__princeState().basement && window.__roomSeen("dungeon"),
      JSON.stringify({ first: lockedLowerFirstState, repeat: lockedLowerRepeatState,
        room: window.__currentStageName, dungeon: window.__princeState(), seen: window.__seenRooms(), open: state().open }));
    window.__closeMonitorPrince();

    window.__setSeenRooms(["kitchen"]);
    key("Tab");
    var touchTarget = roomButton("office");
    touchTarget.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch" }));
    touchTarget.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, cancelable: true, pointerType: "touch" }));
    check("double-tapping a locked destination does the same deliberate mobile unlock",
      !state().open && window.__currentStageName === "office" && window.__roomSeen("office"),
      JSON.stringify({ room: window.__currentStageName, open: state().open }));

    window.__setSeenRooms(["kitchen"]);
    window.__setSecondRound(true);
    window.__goToStage("kitchen");
    key("Tab");
    roomButton("cinema").click();
    check("Phase 2 single-click visits and opens any unvisited Dollhouse room",
      !state().open && window.__currentStageName === "cuddly" && window.__cinemaRoomOpen &&
      window.__roomSeen("cinema") && !window.__roomSeen("cuddly"),
      JSON.stringify({ room: window.__currentStageName, seen: window.__seenRooms(), open: state().open }));
    if (window.__cinemaRoomOpen && window.__closeCinemaRoom) window.__closeCinemaRoom();

    window.__setSeenRooms(["kitchen"]);
    window.__goToStage("kitchen");
    key("Tab");
    key("ArrowDown");
    var phaseTwoEnter = key("Enter");
    check("Phase 2 single-Enter has the same unvisited-room behavior",
      phaseTwoEnter && !state().open && window.__currentStageName === "kitchen" &&
      window.__bathroomRoomOpen && window.__roomSeen("bathroom"),
      JSON.stringify({ room: window.__currentStageName, seen: window.__seenRooms(), open: state().open }));
    if (window.__bathroomRoomOpen && window.__closeBathroomRoom) window.__closeBathroomRoom();
    window.__setSeenRooms(["kitchen"]);
    window.__setSecondRound(false, { releaseHeld: false });
    window.__goToStage("kitchen");
    key("Tab");
    check("Phase 1 keeps unvisited Dollhouse cards locked and blurred",
      state().rooms.filter(function (room) { return room.locked; }).length === 9 &&
      getComputedStyle(roomButton("garden").querySelector("span")).filter.indexOf("blur") !== -1,
      JSON.stringify(state().rooms));
    window.__setPartyMode(true, true, false);
    check("the real Phase 1 to Phase 2 transition immediately sharpens an open Dollhouse",
      state().open && state().rooms.every(function (room) { return !room.locked; }) &&
      getComputedStyle(roomButton("garden").querySelector("span")).filter === "none" &&
      getComputedStyle(roomButton("garden").querySelector("svg")).filter === "none",
      JSON.stringify(state().rooms));
    window.__setPartyMode(false, true, false);
    window.__setSecondRound(false, { releaseHeld: false });
    check("returning to Phase 1 restores the unvisited-card lock semantics",
      roomButton("garden").classList.contains("locked") &&
      getComputedStyle(roomButton("garden").querySelector("span")).filter.indexOf("blur") !== -1);
    window.__closeDollhouse();
    window.__setPartyMode(true, true, false);
    check("the Phase 2 transition also sharpens a closed cached Dollhouse",
      !state().open && state().rooms.every(function (room) { return !room.locked; }),
      JSON.stringify(state().rooms));
    window.__setPartyMode(false, true, false);
    key("Tab");
    check("opening after the closed transition paints every card sharp",
      state().rooms.every(function (room) { return !room.locked; }) &&
      getComputedStyle(roomButton("garden").querySelector("span")).filter === "none" &&
      getComputedStyle(roomButton("garden").querySelector("svg")).filter === "none",
      JSON.stringify(state().rooms));
    window.__closeDollhouse();
    window.__setSeenRooms(["kitchen", "garden", "cuddly", "office", "balcony"]);
    window.__goToStage("cuddly");
    window.__setPartyMode(true, true, false);
    if (window.__setPartyKidFormation) window.__setPartyKidFormation("play");
    var kidGames = document.getElementById("cuddly-kidgames");
    check("the Party's Cuddly kids are live in their open Dollhouse card",
      kidGames.classList.contains("playing") && window.__openDollhouse() &&
      getComputedStyle(roomButton("cuddly")).visibility === "visible" &&
      getComputedStyle(document.getElementById("stage-cuddly")).clipPath === "none");
    window.__closeDollhouse();
    window.__goToStage("office");
    check("Cuddly kids remain rendered at the start of the pan away",
      kidGames.classList.contains("playing") &&
      !document.getElementById("stage-cuddly").classList.contains("stage-far"));
    var strip = document.getElementById("loft-game-strip");
    var panEnd = new Event("transitionend", { bubbles: true });
    Object.defineProperty(panEnd, "propertyName", { value: "transform" });
    strip.dispatchEvent(panEnd);
    check("Cuddly kids clear only after their room is fully out of view",
      !kidGames.classList.contains("playing") &&
      document.getElementById("stage-cuddly").classList.contains("stage-far") &&
      getComputedStyle(document.getElementById("stage-cuddly")).clipPath.indexOf("loft-stage-room-clip") >= 0);
    window.__openDollhouse();
    check("the Cuddly card restores its Party kids while opened from another room",
      window.__currentStageName === "office" && kidGames.classList.contains("playing") &&
      getComputedStyle(roomButton("cuddly")).visibility === "visible");
    window.__closeDollhouse();
    check("closing the Dollhouse removes preview-only Cuddly kids",
      window.__currentStageName === "office" && !kidGames.classList.contains("playing"));
    window.__setPartyMode(false, true, false);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      run().catch(function (error) { out.errors.push(String(error && error.stack || error)); }).then(report);
    }, 300);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 10000, { patchRaf: true, seedRandom: true, forceMotion: true });
if (!result) { console.error("dollhouse: no report"); process.exit(1); }
var failed = false;
result.checks.forEach(function (item) {
  console.log("  " + (item.pass ? "✓" : "✗") + " " + item.name +
    (item.pass || !item.detail ? "" : " — " + item.detail));
  if (!item.pass) failed = true;
});
if (result.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + result.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("dollhouse: all checks passed");
