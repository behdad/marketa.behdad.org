# art/linux/

Everything rsvp.html's Linux app boots from — all self-hosted so the app has no
third-party origin in its boot path (a visitor whose route to a CDN silently hung
used to be stranded on "booting…" forever).

## Emulator + BIOS blobs (verbatim upstream copies, pinned)

- `libv86.js`, `v86.wasm` — the v86 emulator, exact files from the npm build
  `v86@0.5.424` (fetched from `cdn.jsdelivr.net/npm/v86@0.5.424/build/`).
  v86 is BSD-2-Clause: https://github.com/copy/v86 (LICENSE in that repo).
  sha256 `b80fba71dacb7977e5b46800b3ba194bba7fe13e52fa3d22f80cc060ff015a4e` (libv86.js),
  `aec2c16bb0a1618aa641bb44d9c0fe14681f8c1459fa08c32e3e0562020884e8` (v86.wasm).
- `seabios.bin`, `vgabios.bin` — the BIOS images v86 ships for itself, from the v86
  repo @ 2f1346b0 `bios/`. SeaBIOS is LGPLv3 (https://www.seabios.org, source at
  https://github.com/coreboot/seabios); the VGA BIOS is SeaVGABIOS from the same
  project. Unmodified binaries; the v86 repo is the corresponding-source pointer.
  sha256 `73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98` (seabios),
  `a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880` (vgabios).

## linux.iso

The bootable image itself. It is the v86 project's stock
Buildroot demo ISO — Linux 2.6.34.14 + busybox, i686, serial console, from
https://github.com/copy/images @ db92d8fd (kernel & busybox under GPLv2; that repo and
Buildroot/kernel.org are the corresponding-source pointers) — repacked with additions
in the ext2 ramdisk:

- `/bin/hb-shape` and `/usr/bin/hb-info` — the real HarfBuzz shaping and
  font-introspection CLIs (the groom's project), v14.2.1, statically linked i686/musl,
  ~1.0 MB / ~0.7 MB stripped. HarfBuzz is under the Old MIT license.
  Built from https://github.com/harfbuzz/harfbuzz @ 9075798 with GLib (LGPL-2.1+),
  PCRE2 (BSD-3) and zlib linked in statically via meson subprojects. Cross toolchain:
  musl.cc i686-linux-musl-cross (GCC 11.2.1). Recipe:
  `meson setup build --cross-file <i686-musl cross file, c/cpp_link_args=-static -no-pie>
  -Dbuildtype=minsize -Ddefault_library=static -Dglib=enabled -Dgobject=disabled
  -Dfreetype=disabled -Dcairo=disabled -Dicu=disabled -Dgraphite2=disabled
  -Dchafa=disabled -Dtests=disabled -Ddocs=disabled -Dutilities=enabled
  --force-fallback-for=glib,pcre2,libffi,zlib` (+ glib subproject options disabling
  nls/xattr/libmount/selinux/introspection/sysprof/tests),
  `ninja util/hb-shape util/hb-info`, strip. hb-info is deliberately built without
  cairo/chafa, so no glyph previews — name/metrics/table/feature queries are the point
  (`hb-info /root/test.ttf`, `hb-info --list-features /root/test.ttf`).
  musl (MIT) is what makes a 2026 binary run on a 2010 kernel — glibc ≥ 2.24 statics
  refuse anything older than Linux 3.2.
- `/root/test.ttf` (hardlinked as `/root/fraunces.ttf`) — "Fraunces 72pt", a ~26 KB
  subset of Fraunces, the wedding site's own display face. Source: the variable TTF
  from https://github.com/google/fonts @ 4024282 (`ofl/fraunces/`), OFL 1.1 with no
  Reserved Font Name, so the subset legally keeps the Fraunces name. Recipe:
  `fonttools varLib.instancer 'Fraunces[SOFT,WONK,opsz,wght].ttf' opsz=72 wght=400
  SOFT=0 WONK=0 --update-name-table`, then a glyph transplant (Fraunces ships no
  U+221E — the ∞ outline is copied from the Liberation Sans subset below, scaled
  2048→2000 UPM, so `hb-shape /root/test.ttf 'markéta ∞ behdad'` shapes clean), then
  `pyftsubset --unicodes=<ASCII, Czech diacritics both cases, ∞, en/em dash, curly
  quotes, ellipsis, nbsp> --layout-features='*' --glyph-names`. GSUB/GPOS survive:
  `hb-shape /root/test.ttf 'find office'` forms fi/f_f_i ligatures,
  `--features='-liga'` decomposes them, and kern is live.
- `/root/emoji.ttf` — "Noto Color Emoji", a ~9 KB `hb-subset` (HarfBuzz 11.5.1) cut of
  Noto Color Emoji COLRv1 (the groom's own local build of
  https://github.com/googlefonts/noto-emoji, March 2025; upstream is OFL 1.1, no RFN):
  `hb-subset Noto-COLRv1.ttf --unicodes=U+1F468,U+1F469,U+2764,U+FE0F,U+200D
  --layout-features='*'`. Kept so `hb-shape /root/emoji.ttf '👩‍❤️‍👨'` proves the ZWJ
  sequence composes into a single glyph/cluster.
- `/root/sans.ttf` — "Loft Sans", a ~28 KB fontTools subset of Liberation Sans Regular
  (ASCII + Czech lowercase diacritics + ∞, GPOS/GSUB kept), renamed because the
  SIL OFL 1.1 reserves the "Liberation" name for unmodified builds. (This lived at
  `/root/test.ttf` before Fraunces took that slot.)
- `/root/OFL.txt` — combined attribution for all three fonts (Fraunces, Noto Color
  Emoji, Liberation-derived Loft Sans) plus the shared OFL 1.1 license text.

Repack: grow the ext2 image (`resize2fs` to 6144 1K-blocks — ~1.3 MB currently
free; grow it and `ramdisk_size=` together if it fills up), inject files with
`debugfs -w` (`rm`/`write`; the fraunces.ttf hardlink is `ln` + `sif <file>
links_count 2`), then `genisoimage -b isolinux/isolinux.bin -c isolinux/boot.cat
-no-emul-boot -boot-load-size 4 -boot-info-table` with `ramdisk_size=6144` added to the
isolinux append line (the fs outgrew the kernel's 4 MB ramdisk default). A gzipped
ramdisk would halve the ISO but this kernel build oopses in `rd_load_image`'s
decompressor, so it ships uncompressed.
