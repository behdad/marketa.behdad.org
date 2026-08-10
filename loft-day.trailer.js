/* Loft Day's authored trailer timeline. The page owns only presentation mechanics
   (cards, captions, cuts, cursor, scheduling); every world change below goes through
   the same typed `loft` API exposed to Code, Console, and Python. */
(function () {
  "use strict";

  var FULL = {
    announce: 2200,
    title: 4000,
    office: 4000,
    cinema: 4000,
    garden: 3500,
    bathroom: 3500,
    phone: 2700,
    bedroom: 3500,
    cuddly: 3500,
    party: 4500,
    road: 5500,
    camp: 6500,
    final: 4000,
    kitchen: 1000
  };

  function unwrap(envelope, label) {
    if (!envelope || envelope.ok !== true) {
      throw new Error((label || "Trailer action") + " failed: " +
        (envelope && (envelope.message || envelope.code) || "no result"));
    }
    return envelope.value;
  }

  function timing(host) {
    if (!host.reduced) return FULL;
    var reduced = {};
    Object.keys(FULL).forEach(function (key) {
      reduced[key] = key === "announce" ? 1600 : Math.max(1800, Math.round(FULL[key] * .55));
    });
    return reduced;
  }

  async function pause(host, ms) {
    if (!await host.wait(ms)) throw new Error("Trailer stopped");
  }

  async function announceAndCut(host, t, room, chapter, caption, hold, setup) {
    host.announce(chapter, caption);
    await pause(host, t.announce); // narration lands before the camera moves
    await host.cut(async function () {
      unwrap(await window.loft.room.go(room), "Open " + room);
      if (setup) await setup();
    });
    await pause(host, hold); // the same caption remains through the move and tableau
  }

  async function run(host) {
    var loft = window.loft;
    if (!loft || !loft.session || !loft.session.preview) {
      throw new Error("Loft API is not ready.");
    }
    var t = timing(host);

    host.card("title", "cine_title_kicker", "cine_title", "cine_title_sub");
    host.caption("cine_open");
    unwrap(await loft.session.preview.score.play({
      track: "tumbala", loop: true, level: .42, fade_ms: 900
    }), "Start trailer score");
    await pause(host, t.title);
    host.hideCard();

    await announceAndCut(host, t, "office", "cine_chapter_jump", "cine_arcade", t.office,
      async function () { unwrap(await loft.office.invaders.preview(true), "Start Invaders preview"); });
    unwrap(await loft.office.invaders.preview(false), "Stop Invaders preview");

    await announceAndCut(host, t, "cinema", "cine_chapter_open", "cine_below", t.cinema,
      async function () {
        await host.interact("cinema.bike");
        await pause(host, host.reduced ? 500 : 900);
        await host.interact("cinema.cushion");
      });

    await announceAndCut(host, t, "garden", "cine_chapter_unlock", "cine_clues", t.garden,
      async function () { await host.interact("garden.tensegrity"); });

    await announceAndCut(host, t, "bathroom", "cine_chapter_wander", "cine_anywhere", t.bathroom,
      async function () { unwrap(await loft.bathroom.bubbles.preview(true), "Start bubbles preview"); });
    unwrap(await loft.bathroom.bubbles.preview(false), "Stop bubbles preview");

    host.caption("cine_phone");
    unwrap(await loft.app.open("clock"), "Open Clock");
    await pause(host, t.phone);
    unwrap(await loft.app.open("mines"), "Open Mines");
    await pause(host, t.phone);
    unwrap(await loft.app.close("phone"), "Close phone");

    await announceAndCut(host, t, "bedroom", "cine_chapter_round", "cine_round", t.bedroom,
      async function () { unwrap(await loft.api.perform("bedroom.tic-tac-toe.preview", { on: true }), "Start tic-tac-toe preview"); });
    unwrap(await loft.api.perform("bedroom.tic-tac-toe.preview", { on: false }), "Stop tic-tac-toe preview");

    await announceAndCut(host, t, "cuddly", "cine_chapter_soft", "cine_soft", t.cuddly,
      async function () {
        await host.interact("cuddly.pan-edge");
        await pause(host, host.reduced ? 450 : 800);
        await host.interact("cuddly.bolster");
      });

    await announceAndCut(host, t, "garden", "cine_chapter_party", "cine_party", t.party,
      async function () { unwrap(await loft.party.set(true), "Start Party preview"); });

    host.announce("cine_chapter_road", "cine_road");
    await pause(host, t.announce);
    await host.cut(async function () {
      unwrap(await loft.party.set(false), "Stop Party preview");
      unwrap(await loft.roadtrip.preview.show({ route: "banff", distance: 540 }), "Show Road Trip");
    });
    await pause(host, t.road);

    host.announce("cine_chapter_camp", "cine_camp");
    await pause(host, t.announce);
    await host.cut(async function () {
      unwrap(await loft.roadtrip.preview.show({ route: "camp", distance: 0 }), "Show Camping");
      unwrap(await loft.camping.fire.open(), "Open campfire builder");
      unwrap(await loft.camping.fire.place("tinder"), "Place tinder");
      unwrap(await loft.camping.fire.place("twigs"), "Place twigs");
      unwrap(await loft.camping.fire.place("teepee"), "Place logs");
      unwrap(await loft.camping.fire.light(), "Light campfire");
    });
    // Fire lighting deliberately has two delayed beats of its own. Reclaim the authored
    // line after they settle so the campsite's ordinary clue cannot replace the trailer.
    await pause(host, Math.min(1800, t.camp));
    host.caption("cine_camp");
    await pause(host, Math.max(0, t.camp - 1800));

    host.card("final", "cine_final_kicker", "cine_final_title", "cine_final_detail", "cine_final_note");
    host.caption("cine_signoff");
    await pause(host, t.final);
    host.hideCard();

    // Finish through public owners: return to the Kitchen, let the camera land, then
    // use the canonical extinguisher reset. Preview completion preserves raw recovery bytes.
    await host.cut(async function () {
      unwrap(await loft.room.go("kitchen"), "Return to Kitchen");
    });
    host.caption("cine_signoff");
    await pause(host, t.kitchen);
    var reset = loft.game.reset("extinguisher");
    host.caption("cine_signoff");
    unwrap(await reset, "Reset Loft Day");
    host.caption("cine_signoff");
    unwrap(await loft.session.preview.score.stop({ fade_ms: 1200 }), "Fade trailer score");
    await host.stop("fresh");
  }

  window.LoftDayTrailer = Object.freeze({
    duration: 90000,
    run: run
  });
})();
