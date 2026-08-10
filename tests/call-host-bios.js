#!/usr/bin/env node
"use strict";

// Every video-call surface names the local caller too: Behdad on the monitor,
// Markéta on incoming calls, and the couple on calls placed from their phone.
var lib = require("./lib");

var harness = String.raw`<script>
(function () {
  var out = { checks: [], errors: [] };
  function check(name, pass, detail) {
    out.checks.push({ name: name, pass: !!pass, detail: detail || "" });
  }
  function click(el) {
    if (el) el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  }
  function cardText() {
    var card = document.querySelector(".egg-bubble.who-pop");
    return card ? card.textContent.replace(/\s+/g, " ").trim() : "";
  }
  function finish() {
    out.errors = out.errors.concat((window.__errs || []).slice());
    var pre = document.createElement("pre");
    pre.id = "__report";
    pre.textContent = JSON.stringify(out);
    document.body.appendChild(pre);
  }
  try {
    click(document.getElementById("monitor-family-self"));
    var monitor = cardText();
    check("monitor self-view opens Behdad's full bio",
      /behdad/i.test(monitor) && /the groom/i.test(monitor) &&
      /Markéta's partner/i.test(monitor) && /Claude & Codex/i.test(monitor),
      monitor);

    click(document.getElementById("laptop-call-self"));
    var laptop = cardText();
    check("laptop self-view opens Markéta's full bio",
      /markéta/i.test(laptop) && /the bride/i.test(laptop) &&
      /Behdad's partner/i.test(laptop) && /sports, reading/i.test(laptop),
      laptop);
    window.phone.open("call");
    click(document.querySelector(".dial-call-btn"));
    var outgoingSelf = document.querySelector(".phone-incall .pic-self");
    click(outgoingSelf);
    var outgoing = cardText();
    check("outgoing phone self-view identifies both hosts",
      /markéta & behdad/i.test(outgoing) && /the hosts/i.test(outgoing),
      outgoing);
    check("phone call bio paints above the phone overlay",
      (function () {
        var card = document.querySelector(".egg-bubble.who-pop.phone-tooltip");
        return card && Number(getComputedStyle(card).zIndex) > 65;
      })());
    window.phone.set(false);
    setTimeout(function () {
      try {
        window.__answerPrague();
        setTimeout(function () {
          try {
            var incomingSelf = document.querySelector(".phone-incall .pic-self");
            click(incomingSelf);
            var incoming = cardText();
            check("incoming phone self-view opens Markéta's full bio",
              /markéta/i.test(incoming) && /the bride/i.test(incoming) &&
              /Behdad's partner/i.test(incoming) && /sports, reading/i.test(incoming),
              incoming);
          } catch (error) {
            out.errors.push(String(error && error.stack || error));
          }
          finish();
        }, 760);
      } catch (error) {
        out.errors.push(String(error && error.stack || error));
        finish();
      }
    }, 260);
  } catch (error) {
    out.errors.push(String(error && error.stack || error));
    finish();
  }
})();
</script>`;

var report = lib.runPageSync("rsvp.html", harness, 2600, {
  forceReduce: true,
  seedRandom: true,
  patchRaf: true
});

if (!report) { console.error("call host bios: no report"); process.exit(1); }
var failed = false;
report.checks.forEach(function (c) {
  console.log("  " + (c.pass ? "✓" : "✗") + " " + c.name + (c.pass || !c.detail ? "" : " — " + c.detail));
  if (!c.pass) failed = true;
});
if (report.errors.length) {
  failed = true;
  console.error("runtime errors:\n  " + report.errors.join("\n  "));
}
if (failed) process.exit(1);
console.log("call host bios: all " + report.checks.length + " checks passed");
