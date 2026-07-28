# snakes DOS runtime

The monitor’s `snakes` app is a pinned, self-hosted DOSBox runtime. It boots directly
into NGE Nibbles; `Esc` leaves the game at DOSBox’s real `C:\>` shell.

## Components and provenance

| Component | Version / revision | License | Upstream package SHA-256 |
| --- | --- | --- | --- |
| js-dos player | 8.4.1, git `be548f4fb3616c956bfcd35d7c36f6db91d6a8b8` | GPL-2.0 | npm `js-dos-8.4.1.tgz`; deployed `runtime/js-dos.js`: `9e083d840e4de87d9089463faff596b41beb56d5181ff3bd5b7c12b4c07b7982` |
| js-dos emulators / DOSBox | 8.4.1, git `0d840292a74dad4574d5068d8cf934a4e580ea11` | GPL-2.0 | deployed WASM: `aea62e7ea836424ce912728692d3168df63828b5fabfebc2b18cd1d2b19beda2` |
| NGE Nibbles | 0.1.0a, FreeDOS package `20220217.0` | GPL-2.0 | `e2981a5539b12f3115509de533cd42e73da8f0b40674a7483a3ec177a60475fe` |
| CWSDPMI | 7a, FreeDOS package `20220217.0` | GPL-2.0 | `0bc98f44f85df84d594de8d730f3c2572b50725cbae0b533e247539a40dc1ecc` |

The exact original FreeDOS packages, including their complete source packages, are in
`source/`. Exact corresponding source snapshots for the deployed js-dos player and
emulator are there too. `licenses/GPL-2.0.txt` contains the license text. The bundle
contains NGE’s own `GPL.TXT` and CWSDPMI’s `COPYING.CWS`.

No Microsoft QBASIC, `NIBBLES.BAS`, MS-DOS system file, or proprietary game asset is
included. `snakes.jsdos` is a ZIP-format js-dos bundle assembled from those pinned
packages plus the locally authored DOSBox configuration and `README.TXT` in
`bundle-config/`. Its SHA-256 is
`a60a399dc5d340b5bcb2b2f4f0f2d1a36214c895a8f8a5795485226c3ea6e2da`.

## Repacking

Extract `source/nge_nibb-0.1.0a.zip`, copy `GAMES/NGE_NIBB` to the bundle as
`NIBBLES`, add `BIN/CWSDPMI.EXE` and `DOC/CWSDPMI/COPYING.CWS` from
`source/cwsdpmi-7a.zip`, then add `bundle-config/dosbox.conf` as
`.jsdos/dosbox.conf` and `bundle-config/README.TXT` at the root. Zip those entries
with Deflate compression and name the result `snakes.jsdos`.
