#!/usr/bin/env node
"use strict";

var fs = require("fs");
var path = require("path");
var lib = require("./lib");

var HARNESS = String.raw`<pre id="__report">pending</pre>
<script>
(function () {
  var report = { errors: [], steps: {} };
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function motion(id) {
    var style = getComputedStyle(document.getElementById(id));
    return { name: style.animationName, duration: style.animationDuration };
  }
  function click(el) { el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })); }
  window.addEventListener("load", function () {
    setTimeout(async function () {
      try {
        window.__unlockAllRooms();
        window.__gardenPartyOn = true;
        window.__partyDance = "techno";
        document.getElementById("stage-garden").classList.add("garden-party");
        document.documentElement.style.setProperty("--party-window-beat", ".533s");
        window.__syncScopeMirrors();
        window.__goToStage("office");
        window.__openBedroomRoom();
        await sleep(80);
        var glass = document.getElementById("bedroom-stained-glass");
        report.steps.bedroom = {
          live: document.documentElement.classList.contains("mir-party-bass-live"),
          motion: motion("bedroom-stained-glass"),
          placement: glass.getAttribute("transform")
        };
        click(document.querySelector('.bedroom-ttt-pane[data-cell="0"]'));
        report.steps.game = window.__bedroomTicTacToeState();

        window.__setMusicPaused(true);
        report.steps.paused = {
          live: document.documentElement.classList.contains("mir-party-bass-live"),
          motion: motion("bedroom-stained-glass")
        };
        window.__setMusicPaused(false);
        report.steps.resumed = motion("bedroom-stained-glass");
        window.__setPartyForegroundSuspended(true, "test");
        report.steps.suspended = motion("bedroom-stained-glass");
        window.__setPartyForegroundSuspended(false);

        window.__closeBedroomRoom();
        window.__goToStage("cuddly");
        window.__openCinemaRoom();
        await sleep(900);
        report.steps.cinema = motion("cinema-window");
        var cinemaRoom = document.getElementById("cinema-room");
        var beforeNight = cinemaRoom.classList.contains("cinema-night");
        click(document.getElementById("cinema-window"));
        await sleep(60);
        report.steps.cinemaClick = beforeNight !== cinemaRoom.classList.contains("cinema-night");
        report.steps.cinemaReaction = motion("cinema-window");
        document.getElementById("cinema-window").dispatchEvent(
          new AnimationEvent("animationend", { animationName: "cinema-window", bubbles: true })
        );
        await sleep(20);
        report.steps.cinemaSettled = motion("cinema-window");

        window.__gardenPartyOn = false;
        document.getElementById("stage-garden").classList.remove("garden-party");
        window.__syncScopeMirrors();
        report.steps.off = {
          live: document.documentElement.classList.contains("mir-party-bass-live"),
          motion: motion("cinema-window")
        };
      } catch (error) {
        report.errors.push(String(error && error.stack || error));
      }
      report.errors = (window.__errs || []).concat(report.errors);
      document.getElementById("__report").textContent = JSON.stringify(report);
    }, 240);
  });
})();
</script>`;

function run(options) {
  return lib.runPageSync("loft-day.html", HARNESS, 5000, Object.assign({
    seedRandom: true,
    urlSuffix: "?date=2026-08-21&time=22:00"
  }, options));
}

var failures = 0;
function check(ok, message, detail) {
  if (ok) console.log("  ✓ " + message);
  else {
    failures++;
    console.log("  ✗ " + message + (detail == null ? "" : " — " + JSON.stringify(detail)));
  }
}

console.log("loft-day.html lower-room Party bass vibration:");
var result = run({ forceMotion: true });
var s = (result && result.steps) || {};
check(result && result.errors.length === 0, "no uncaught page errors", result && result.errors);
check(s.bedroom && s.bedroom.live && s.bedroom.motion.name === "lower-room-party-bass" &&
  s.bedroom.motion.duration === "0.533s" && s.bedroom.placement === "translate(-3 -18)",
  "the open Bedroom window vibrates on the techno beat without replacing its SVG placement", s.bedroom);
check(s.game && s.game.board[0] === "X" && s.game.phase === "computer",
  "the moving stained-glass panes remain playable", s.game);
check(s.paused && !s.paused.live && s.paused.motion.name === "none" &&
  s.resumed && s.resumed.name === "lower-room-party-bass",
  "transport pause stills the window and resume restores it", { paused: s.paused, resumed: s.resumed });
check(s.suspended && s.suspended.name === "none",
  "a foreground Road Trip or Camping hold stills the window", s.suspended);
check(s.cinema && s.cinema.name === "lower-room-party-bass" && s.cinemaClick &&
  s.cinemaReaction && s.cinemaReaction.name === "cinema-window" &&
  s.cinemaSettled && s.cinemaSettled.name === "lower-room-party-bass",
  "the Cinema window vibrates and its day/night click still works", {
    initial: s.cinema, click: s.cinemaClick, reaction: s.cinemaReaction, settled: s.cinemaSettled
  });
check(s.off && !s.off.live && s.off.motion.name === "none",
  "ending the Party removes the vibration", s.off);

var source = fs.readFileSync(path.join(__dirname, "..", "loft-day.html"), "utf8");
check(/--party-window-beat", period\.toFixed\(3\) \+ "s"/.test(source) &&
  /animation:lower-room-party-bass var\(--party-window-beat,\.533s\)/.test(source) &&
  /@media \(prefers-reduced-motion:reduce\)\{[\s\S]*html\.mir-party-bass-live #cinema-window,[\s\S]*html\.mir-party-bass-live #bedroom-stained-glass\{animation:none\}/.test(source),
  "the active dance period drives the window's bass cadence");

console.log("");
if (failures) {
  console.log(failures + " lower-room Party bass assertion" + (failures === 1 ? "" : "s") + " failed.");
  process.exit(1);
}
console.log("Lower-room Party bass assertions passed.");
