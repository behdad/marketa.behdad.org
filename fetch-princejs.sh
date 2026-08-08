#!/bin/sh
# fetch-princejs.sh — restore the untracked princejs/ runtime (the Prince of Persia
# app on rsvp.html's monitor and in the garden dungeon).
#
# Provenance (carried here since princejs/ left the repo and its README with it):
#   Upstream   https://github.com/oklemenz/PrinceJS — HTML5/JS reimplementation of the
#              MS-DOS Prince of Persia. Unlicense; the LICENSE file ships with the copy.
#   Pinned     ea1a97a763ac78fee5b35129e2841ef31531328e ("Fullscreen", 2026-05-22 —
#              upstream HEAD when the previously tracked copy was retrieved 2026-07-29).
#   Pruned     repo history (.git), dev tooling (converter/, eslint/prettier/npm files),
#              upstream README.md, the unminified lib/phaser.js, the large demo GIFs
#              (assets/web/level99.gif, level100.gif), and the optional community level
#              packs (assets/maps/custom/). The runtime, 14-level campaign, graphics,
#              animation, music, and sound all ship.
#   Shim       princejs-shim.patch (repo root) holds the local integration diff:
#              index.html gains parent-frame pause/resume + focus handling, readiness/
#              game-lost postMessage reporting, Escape/Backspace exit and contextmenu
#              forwarding, and tap-highlight suppression; assets/web/game.css is refit
#              to center the canvas at its native aspect inside the app iframe.
#
# rsvp.html HEAD-probes princejs/index.html and falls back to the upstream GitHub
# Pages build when this directory is absent, so the app works either way — the local
# copy keeps it zero-third-party with the full touch/pause/exit integration. Deploy:
# after the first git pull into a web root, run ./fetch-princejs.sh once.
#
# Do not casually bump the pin: test keyboard, touch, audio, iframe teardown, and
# fullscreen lifecycle first (and regenerate princejs-shim.patch against the new tree).
set -eu
cd "$(dirname "$0")"

UPSTREAM=https://github.com/oklemenz/PrinceJS
SHA=ea1a97a763ac78fee5b35129e2841ef31531328e

[ -f princejs-shim.patch ] || { echo "princejs-shim.patch not found next to this script" >&2; exit 1; }

WORK=$(mktemp -d princejs-fetch.XXXXXX)
trap 'rm -rf "$WORK"' EXIT INT TERM

git init --quiet "$WORK/tree"
if git -C "$WORK/tree" fetch --quiet --depth 1 "$UPSTREAM" "$SHA"; then
  git -C "$WORK/tree" -c advice.detachedHead=false checkout --quiet FETCH_HEAD
else
  # Host without direct-SHA fetch support: take the full clone instead.
  rm -rf "$WORK/tree"
  git clone --quiet "$UPSTREAM" "$WORK/tree"
  git -C "$WORK/tree" -c advice.detachedHead=false checkout --quiet "$SHA"
fi
[ "$(git -C "$WORK/tree" rev-parse HEAD)" = "$SHA" ] || { echo "upstream checkout is not $SHA" >&2; exit 1; }

rm -rf "$WORK/tree/.git"
(cd "$WORK/tree" && rm -rf \
  .gitignore .prettierignore .prettierrc.yml eslint.config.js \
  package.json package-lock.json README.md converter \
  assets/maps/custom assets/web/level99.gif assets/web/level100.gif \
  lib/phaser.js)

mv "$WORK/tree" "$WORK/princejs"
if command -v patch >/dev/null 2>&1; then
  (cd "$WORK" && patch -p1 --silent) < princejs-shim.patch
else
  git apply --directory="$WORK" princejs-shim.patch
fi

grep -q "prince-control" "$WORK/princejs/index.html" || { echo "shim missing after patch" >&2; exit 1; }
for f in lib/phaser.min.js assets/maps/level1.json assets/gfx/kid.png LICENSE; do
  [ -f "$WORK/princejs/$f" ] || { echo "fetched tree is missing $f" >&2; exit 1; }
done

rm -rf princejs
mv "$WORK/princejs" princejs
echo "princejs/ restored from $UPSTREAM @ $SHA (shim applied)."
