# snakes DOS runtime

The monitor’s `snakes` app is a pinned, self-hosted DOSBox runtime. It boots
directly into an owner-supplied historical MS-DOS Nibbles executable modified by
Behdad’s friend `bigbug` to support up to four players. `Esc` leaves the game at
DOSBox’s real `C:\>` shell.

## Components and provenance

| Component | Version / revision | License / status | Pinned SHA-256 |
| --- | --- | --- | --- |
| js-dos player | 8.4.1, git `be548f4fb3616c956bfcd35d7c36f6db91d6a8b8` | GPL-2.0 | deployed `runtime/js-dos.js`: `9e083d840e4de87d9089463faff596b41beb56d5181ff3bd5b7c12b4c07b7982` |
| js-dos emulators / DOSBox | 8.4.1, git `0d840292a74dad4574d5068d8cf934a4e580ea11` | GPL-2.0 | deployed WASM: `aea62e7ea836424ce912728692d3168df63828b5fabfebc2b18cd1d2b19beda2` |
| Four-player Nibbles executable | Historical MS-DOS build supplied by the site owner; modified by `bigbug` for four-player support | Owner-supplied compiled artifact; no open-source, source-availability, stock-Microsoft, or shareware claim | `source/nibbles.exe`: `ca601f2eb07727b5100017d524df6f0698751b89ee2ea1eb8a1df08c955bedc2` |

The exact source snapshots corresponding to the deployed js-dos player and
emulator are in `source/`. `licenses/GPL-2.0.txt` applies to those GPL runtime
components. The Nibbles executable is preserved byte-for-byte as supplied by
the owner; no QBasic/Microsoft source is included, and that executable is not
described as open source.

`snakes.jsdos` is a ZIP-format js-dos bundle assembled from the pinned
`source/nibbles.exe` plus the locally authored DOSBox configuration and
`README.TXT` in `bundle-config/`. Its SHA-256 is
`15f35bb40c086fda6b76ae87d7b14839c0f029f061e643a5a6a4e68494598408`.

## Repacking

Copy `source/nibbles.exe` to the bundle root as `NIBBLES.EXE`, add
`bundle-config/dosbox.conf` as `.jsdos/dosbox.conf`, and add
`bundle-config/README.TXT` as `README.TXT`. Zip those entries with Deflate
compression and name the result `snakes.jsdos`.

This compiled QBasic-era DOS executable runs without a DPMI host, so CWSDPMI is
not bundled.
