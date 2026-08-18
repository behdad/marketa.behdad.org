#!/usr/bin/env node
"use strict";

const fs = require("fs");
const html = fs.readFileSync("loft-day.html", "utf8");

function ok(condition, message) {
  if (!condition) throw new Error(message);
  console.log("✓ " + message);
}

const sound = html.match(/function playGameEntrySwoosh\(\) \{([\s\S]*?)\n\}\nwindow\.__playGameEntrySwoosh/);
ok(sound, "game-entry swoosh is registered");
ok(/getSfxCtx\(\)/.test(sound[1]), "swoosh uses the shared SFX context");
ok(/\[-1, 1\]\.forEach/.test(sound[1]), "swoosh builds symmetric left and right voices");
ok(/linearRampToValueAtTime\(direction \* 0\.92/.test(sound[1]), "voices sweep outward in stereo");
ok(/else gain\.connect\(ctx\.destination\)/.test(sound[1]), "mono browsers keep the wash");
ok(!/new (?:AudioContext|webkitAudioContext)/.test(sound[1]), "swoosh creates no private AudioContext");

const dismiss = html.match(/function clickMeDismiss\(e\) \{([\s\S]*?)\n  \}/);
ok(dismiss, "CLICK ME dismiss path exists");
ok(/e && e\.isTrusted && window\.__playGameEntrySwoosh/.test(dismiss[1]), "only a trusted pointer entry plays the swoosh");
ok(/function introKeyDismiss[\s\S]*?clickMeDismiss\(\)/.test(html), "keyboard entry remains silent");
