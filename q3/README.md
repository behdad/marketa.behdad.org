# Quake III / OpenArena web runtime

Pinned, self-hosted deliverables for the **Quake III** choice in the office monitor's
Shoot launcher. Nothing here is a build output of this repository and no CDN is used.

## Engine

- `ioquake3.js` and `ioquake3.wasm` are the official Emscripten artifact from
  [ioquake/ioq3](https://github.com/ioquake/ioq3), commit
  `20f7436cd90aee2db64d2f72e2d622cec6592252`.
- GitHub Actions run `30185781103`, artifact `8626992626`,
  `ioq3-emscripten-1.36_g20f7436`.
- License: GPL-2.0; see `COPYING`.
- SHA-256:
  - `ioquake3.js`: `7aeec6e8ade71306b598e06e26d9bc178448ffc9f2ceb9def4bb4f6f6547bf47`
  - `ioquake3.wasm`: `b7f6d688d8b9edae19fcb8d150436c7cfe478cf06e433a4a83882c3d98938b42`

## Game data

The data is from the official
[OpenArena 0.8.8 download](https://www.openarena.ws/download.php),
`openarena-0.8.8.zip`:

- size: `425189255` bytes
- SHA-256: `5a8faf7f5b51f351b0a1618c06b6b98a5f1a6758f1d39818de2c87df2a0bac4a`

OpenArena is a free-content game for the GPL id Tech 3 engine. Its GPL-2.0 license
is also present as `COPYING` inside `baseoa/pak0.pk3`.

- `baseoa/pak0.pk3` is the unmodified OpenArena 0.8.8 core pack.
  SHA-256: `5bf50ed038fe8098f32e2e9bec7184a763ae2030c8feccef1e8448f6bd7d027f`
- `baseoa/loft-shine.pk3` is a reduced pack assembled from the same official
  OpenArena archive: the `oa_shine` BSP/AAS/levelshot, its complete shader and
  image closure (including the skybox and gameplay effects), and the bot files
  needed for a local match. Its exact 530-member list is in
  `baseoa/loft-shine.manifest`.
  SHA-256: `376e1ae3389fef99c7deea461cae745e5ba93215c82241e23fe7aa11a82e53a1`
- `baseoa/loft-arenas.pk3` adds the `aggressor` and `am_lavaarena`
  BSP/AAS/levelshots and their exact runtime asset closures from that same
  archive. Its 90-member list is in `baseoa/loft-arenas.manifest`.
  SHA-256: `649c64bbc3f6a6fae51c915177be032271c1b03924584fc3f443183ef4fc5cfb`

`player.html` loads only these three packs, disables networking, and adds one
local bot. Its launcher offers Shine, Aggressor, and Lava Arena with the same tall
three-card Shoot layout at room and expanded monitor scales. A room-scale press
only focuses the monitor; the next explicit click or `1`–`3` selection chooses an
arena. It explicitly selects OpenGL2's GLES path and disables HDR/postprocessing/
advanced material paths that upstream documents as unsupported or unsuitable on
GLES; leaving them enabled produces invalid white world surfaces in this WebGL
build. Initial mouse sensitivity is `0.8` with acceleration off.

The parent monitor sends pause/resume messages; the iframe gates both the main loop
and SDL audio on foreground visibility. Removing the iframe is the hard-stop
lifecycle used by Back/Kill/Restart. The canvas uses the shared centered 4:3
contract.
