#!/usr/bin/env node
"use strict";

// Focused identity/figure regression for Ayushi: public cast data, bilingual card,
// solo Cuddly/bar/office/garden appearances, balcony cameo, one-room exclusions,
// and her Dec 10 birthday cake appearance.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) { out.checks.push({ name: name, pass: !!pass, detail: detail || "" }); }
  function sleep(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  function report() {
    out.errors = (window.__errs || []).slice();
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  window.addEventListener("load", function () {
    setTimeout(function () {
      (async function () {
        var fig = document.querySelector("#garden-guests .g-ayushi");
        var avatar = document.getElementById("garden-ayushi-avatar");
        var art = avatar && avatar.getBBox();
        check("Ayushi has a complete adult party figure",
          !!(fig && avatar && art && art.height > 150 && avatar.querySelector(".guest-head") &&
            avatar.querySelector(".guest-torso") && avatar.querySelector(".guest-arm-l") &&
            avatar.querySelector(".guest-arm-r") && avatar.querySelector(".guest-leg-l") &&
            avatar.querySelector(".guest-leg-r")), art ? JSON.stringify(art) : "missing");
        check("the reference outfit and accessories remain identifiable at party scale",
          !!(avatar && avatar.querySelector("#garden-ayushi-sari") &&
            avatar.querySelectorAll(".ayushi-sari-pattern path, .ayushi-sari-pattern circle").length >= 7 &&
            avatar.querySelectorAll("#garden-ayushi-glasses circle").length === 2 &&
            avatar.querySelector("#garden-ayushi-jewelry") && avatar.querySelector(".bd-hat-ayushi")));

        var profile = (window.__chatPeopleKnowledge ? window.__chatPeopleKnowledge() : []).filter(function (p) { return p.id === "ayushi"; })[0];
        check("public cast knowledge names Ayushi as the lowercase diva without an invented relationship",
          !!(profile && profile.name === "Ayushi" && profile.role === "diva" &&
            profile.relationship === "" && /Stand-up comedian in practice\./.test(profile.fun_fact)),
          JSON.stringify(profile || null));

        window.setLang("en");
        var en = window.castPersonCard("ayushi");
        window.setLang("cs");
        var cs = window.castPersonCard("ayushi");
        window.setLang("en");
        check("the English direct-person card carries the supplied role and fun fact",
          /Ayushi/.test(en) && /diva/.test(en) && !/from India/.test(en) && /Stand-up comedian in practice\./.test(en), en);
        check("the Czech direct-person card mirrors all Ayushi copy",
          /Ayushi/.test(cs) && /diva/.test(cs) && !/z Indie/.test(cs) && /stand-up komička v zácviku\./.test(cs), cs);

        window.goToStage("cuddly");
        document.getElementById("stage-cuddly").classList.remove("dusk");
        var cuddlyStarted = window.__cuddlyVisit("ayushi", true);
        await sleep(120);
        var cuddlyNow = window.__cuddlyVisitorsNow();
        var cuddlyHere = window.__whoIsHere("cuddly").filter(function (p) { return p.key === "ayushi"; })[0];
        var cuddlyUse = document.querySelector("#cuddly-vis-ayushi use");
        check("Ayushi makes a daytime Cuddly visit by herself",
          cuddlyStarted && cuddlyNow.length === 1 && cuddlyNow[0].key === "ayushi" &&
            document.getElementById("cuddly-vis-ayushi").classList.contains("showing") &&
            !!cuddlyHere && cuddlyHere.roleKey === "role_diva",
          JSON.stringify({ started: cuddlyStarted, now: cuddlyNow.map(function (p) { return p.key; }), here: cuddlyHere && cuddlyHere.key }));
        check("the Cuddly cameo reuses Ayushi's named avatar",
          !!(cuddlyUse && (cuddlyUse.getAttribute("href") === "#garden-ayushi-avatar" ||
            cuddlyUse.getAttribute("xlink:href") === "#garden-ayushi-avatar")));
        window.__resetCuddlyVisitors();

        window.party(true);
        window.__duoArrive("ayushi");
        await sleep(150);
        var here = window.__whoIsHere("garden").filter(function (p) { return p.key === "ayushi"; })[0];
        check("Ayushi can arrive as a solo garden guest",
          fig.classList.contains("arrived") && !!here && here.roleKey === "role_diva",
          JSON.stringify({ classes: fig.getAttribute("class"), here: here && { key: here.key, roleKey: here.roleKey } }));
        var balcony = document.querySelector("#bh-ayushi use");
        check("the balcony crowd reuses Ayushi's named avatar",
          !!(balcony && (balcony.getAttribute("href") === "#garden-ayushi-avatar" ||
            balcony.getAttribute("xlink:href") === "#garden-ayushi-avatar")));
        check("Ayushi's portrait drink maps to a cocktail",
          window.__partyDrinkPreference("Ayushi") === "cocktail");

        window.goToStage("kitchen");
        var realAttended = window.__partyGuestAttended;
        var realCuddlyNow = window.__cuddlyVisitorsNow;
        window.__partyGuestAttended = function (name) { return name === "ayushi"; };
        window.__cuddlyVisitorsNow = function () { return [{ key: "ayushi" }]; };
        window.couples(false);
        var blockedBar = window.couples(true);
        check("the bar one-room rule excludes a Cuddly visitor", blockedBar === null, JSON.stringify(blockedBar));
        window.__partyGuestAttended = realAttended;
        window.__cuddlyVisitorsNow = realCuddlyNow;
        var barNow = window.couples("ayushi");
        var barHere = window.__whoIsHere("kitchen").filter(function (p) { return p.key === "ayushi"; })[0];
        check("Ayushi joins the bar rotation as a solo appearance",
          JSON.stringify(barNow) === '["ayushi"]' &&
            document.querySelector(".bc-ayushi").classList.contains("present") &&
            document.querySelectorAll(".bc-ayushi .bc-person").length === 1 && !!barHere && barHere.roleKey === "role_diva",
          JSON.stringify({ now: barNow, here: barHere && barHere.key }));

        window.goToStage("office");
        window.__partyGuestAttended = function (name) { return name === "ayushi"; };
        window.__cuddlyVisitorsNow = function () { return [{ key: "ayushi" }]; };
        window.officefolks(false);
        var blockedOffice = window.officefolks(true);
        check("the office one-room rule excludes a Cuddly visitor", blockedOffice === null, JSON.stringify(blockedOffice));
        window.__partyGuestAttended = realAttended;
        window.__cuddlyVisitorsNow = realCuddlyNow;
        var officeNow = window.officefolks("ayushi");
        var officeHere = window.__whoIsHere("office").filter(function (p) { return p.key === "ayushi"; })[0];
        check("Ayushi joins the office rotation as a solo appearance",
          JSON.stringify(officeNow) === '["ayushi"]' &&
            document.querySelector(".of-ayushi").classList.contains("present") &&
            document.querySelectorAll(".of-ayushi .of-person").length === 1 && !!officeHere && officeHere.roleKey === "role_diva",
          JSON.stringify({ now: officeNow, here: officeHere && officeHere.key }));

        if (window.__endBdCakeCutting) window.__endBdCakeCutting();
        window.birthday("ayushi");
        await sleep(550);
        var strip = document.getElementById("loft-game-strip");
        var portrait = window.__bdPortrait({ who: "ayushi", type: "hat" });
        check("Dec 10 birthday routes Ayushi to her garden cake",
          strip.classList.contains("bd-ayushi") && window.currentStageName === "garden" &&
            !!window.__bdCakeOn && fig.classList.contains("arrived") && fig.classList.contains("bd-cutter") &&
            getComputedStyle(avatar.querySelector(".bd-hat-ayushi")).visibility === "visible",
          JSON.stringify({ classes: strip.className, room: window.currentStageName, cake: !!window.__bdCakeOn, fig: fig.getAttribute("class") }));
        var portraitHost = document.createElement("div");
        portraitHost.innerHTML = portrait;
        check("Ayushi has a glasses-and-bun birthday portrait",
          /calx-bust/.test(portrait) && /<ellipse cx="6\.2" cy="3\.8"/.test(portrait) &&
            portraitHost.querySelectorAll('g[stroke="#3a2f28"] circle').length === 2, portrait);
        report();
      })().catch(function (error) {
        out.errors.push("harness: " + (error && error.stack || error));
        report();
      });
    }, 350);
  });
})();
</script>`;

var result = lib.runPageSync("rsvp.html", harness, 5000, {
  forceMotion: true,
  patchRaf: true,
  seedRandom: true
});

if (!result) { console.error("Ayushi: no report"); process.exit(1); }
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
console.log("Ayushi: all " + result.checks.length + " checks passed");
