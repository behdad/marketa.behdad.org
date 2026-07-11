# art/linux/linux.iso

The bootable image behind rsvp.html's Linux app (v86). It is the v86 project's stock
Buildroot demo ISO — Linux 2.6.34.14 + busybox, i686, serial console, from
https://github.com/copy/images @ db92d8fd (kernel & busybox under GPLv2; that repo and
Buildroot/kernel.org are the corresponding-source pointers) — repacked with additions
in the ext2 ramdisk:

- `/bin/hb-shape` — the real HarfBuzz shaping CLI (the groom's project), v14.2.1,
  statically linked i686/musl, ~1.0 MB stripped. HarfBuzz is under the Old MIT license.
  Built from https://github.com/harfbuzz/harfbuzz @ 9075798 with GLib (LGPL-2.1+),
  PCRE2 (BSD-3) and zlib linked in statically via meson subprojects. Cross toolchain:
  musl.cc i686-linux-musl-cross (GCC 11.2.1). Recipe:
  `meson setup build --cross-file <i686-musl cross file, c/cpp_link_args=-static -no-pie>
  -Dbuildtype=minsize -Ddefault_library=static -Dglib=enabled -Dgobject=disabled
  -Dfreetype=disabled -Dcairo=disabled -Dicu=disabled -Dgraphite2=disabled
  -Dchafa=disabled -Dtests=disabled -Ddocs=disabled -Dutilities=enabled
  --force-fallback-for=glib,pcre2,libffi,zlib` (+ glib subproject options disabling
  nls/xattr/libmount/selinux/introspection/sysprof/tests), `ninja util/hb-shape`, strip.
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

Repack: grow the ext2 image (`resize2fs` to 5120 1K-blocks), inject files with
`debugfs -w` (`rm`/`write`; the fraunces.ttf hardlink is `ln` + `sif <file>
links_count 2`), then `genisoimage -b isolinux/isolinux.bin -c isolinux/boot.cat
-no-emul-boot -boot-load-size 4 -boot-info-table` with `ramdisk_size=5120` added to the
isolinux append line (the fs outgrew the kernel's 4 MB ramdisk default). A gzipped
ramdisk would halve the ISO but this kernel build oopses in `rd_load_image`'s
decompressor, so it ships uncompressed.
