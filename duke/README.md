# Duke Nukem 3D shareware web runtime

Pinned, self-hosted deliverables for the **Duke** choice in the office monitor's
Shoot launcher. Nothing here is a build output of this repository and no CDN is used.

## Engine

`eduke32.js`, `eduke32.wasm`, and the base of `player.html` come from
[originalsouth/emduke32](https://github.com/originalsouth/emduke32), commit
`e2f24a97b3aaa58c75bf3992010634da9d711a57` (2026-04-10). The published
GitHub Pages artifacts were retrieved from `https://originalsouth.github.io/emduke32/`.

- EDuke32/emduke32 license: GPL-2.0; see `COPYING`.
- `eduke32.js` SHA-256:
  `837f3567891ac5212d5e59ddbf88585fb4703adec3cb25f5106a3471b3ae5c61`
- `eduke32.wasm` SHA-256:
  `4a10e493c262c4a648be1b1e63aa2c77ce3cc8cbeaf66a0638a450bed558f12d`
- MIDI synthesis is `webaudio-tinysynth`, Apache-2.0; its license is beside
  the script in `vendor/webaudio-tinysynth/`.

The local `player.html` automatically boots volume 1, level 1, skill 2. It
extracts the GRP in memory, persists only small settings/save files, and gates
the main loop plus both audio contexts on parent foreground visibility and focus.

## Shareware data and redistribution

`3dduke13.zip` is the exact official Duke Nukem 3D 1.3d shareware archive:

- size: `5924374` bytes
- MD5: `04e4ca70b8a2d59ed56c451c5c1d5d39`
- SHA-1: `72b832734d72c829cecaffd8d8ae0eb38995aeb3`
- SHA-256: `c67efd179022bc6d9bde54f404c707cbcbdc15423c20be72e277bc2bdddf3d0e`

These values match Debian `game-data-packager`'s `duke3d-shareware` metadata.
The original `LICENSE.TXT` is reproduced byte-for-byte as
`LICENSE-shareware.txt` (9108 bytes; MD5
`583bf2a6cb3d404a21c2205041c45481`).

That license expressly lets individuals give the Game away without charge and
lets free WWW/FTP sites make it downloadable, on the condition that all released
Game files are included without modification. For that reason this directory
ships the complete original `3dduke13.zip` unchanged. It does **not** ship a
repacked or separately distributed GRP; `player.html` extracts
`DN3DSW13.SHR` and then `DUKE3D.GRP` only after the visitor has downloaded the
intact archive.
