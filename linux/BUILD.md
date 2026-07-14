# BUILD.md — `linux/` — v86 emulator + a repacked ISO with a native `hb-shape`

This documents how the artifacts in `linux/` were produced. It is a companion to
`linux/README.md` (which also carries all shas and license pointers). See the root
`BUILD.md` for the shared framing. Fully **reconstructable** from `linux/README.md`.

**What it is.** `rsvp.html`'s Linux app boots a tiny Linux in the browser via the v86
emulator and auto-demos the *real*, natively-compiled `hb-shape` CLI. Two moving parts:
verbatim v86 blobs, and a **repacked** boot ISO.

**GOTCHA — everything self-hosted because of a jsDelivr hang.** The whole reason this dir
exists (rather than loading v86 from a CDN) is that a visitor whose network route to the
CDN silently hung was stranded on "booting…" forever. Keep every boot-path blob local.

**a) v86 + BIOS (verbatim upstream, pinned) — just copy, no build:**

- `libv86.js`, `v86.wasm` from npm **`v86@0.5.424`**
  (`cdn.jsdelivr.net/npm/v86@0.5.424/build/`), BSD-2-Clause, https://github.com/copy/v86.
  sha256 `b80fba71dacb7977e5b46800b3ba194bba7fe13e52fa3d22f80cc060ff015a4e` (libv86.js),
  `aec2c16bb0a1618aa641bb44d9c0fe14681f8c1459fa08c32e3e0562020884e8` (v86.wasm).
- `seabios.bin`, `vgabios.bin` from the v86 repo @ `2f1346b0` `bios/` (SeaBIOS LGPLv3 /
  SeaVGABIOS). sha256 `73e3f359102e3a9982c35fce98eb7cd08f18303ac7f1ba6ebfbe6cdc1c244d98`
  (seabios), `a4bc0d80cc3ca028c73dafa8fee396b8d054ce87ebd8abfbd31b06b437607880` (vgabios).

**b) `linux.iso` — the repacked boot image.** Base is the v86 project's stock Buildroot
demo ISO — **Linux 2.6.34.14 + busybox, i686, serial console** — from
https://github.com/copy/images @ `db92d8fd` (GPLv2). The ext2 ramdisk inside it is grown
and injected with these additions:

- **`/bin/hb-shape` + `/usr/bin/hb-info`** — real HarfBuzz **14.2.1** CLIs, statically
  linked i686/musl (~1.0 MB / ~0.7 MB stripped). Built from
  https://github.com/harfbuzz/harfbuzz @ `9075798`, GLib (LGPL-2.1+) / PCRE2 (BSD-3) /
  zlib linked statically via meson subprojects. Cross toolchain: **musl.cc
  i686-linux-musl-cross (GCC 11.2.1)**. musl (not glibc) is what lets a 2026 binary run
  on a 2010 kernel — glibc ≥ 2.24 statics refuse anything older than Linux 3.2.

  ```sh
  # cross file sets c/cpp_link_args = ['-static','-no-pie']
  meson setup build --cross-file <i686-musl.cross> \
    -Dbuildtype=minsize -Ddefault_library=static \
    -Dglib=enabled -Dgobject=disabled -Dfreetype=disabled -Dcairo=disabled \
    -Dicu=disabled -Dgraphite2=disabled -Dchafa=disabled -Dtests=disabled \
    -Ddocs=disabled -Dutilities=enabled \
    --force-fallback-for=glib,pcre2,libffi,zlib
    # + glib subproject opts disabling nls/xattr/libmount/selinux/introspection/sysprof/tests
  ninja -C build util/hb-shape util/hb-info
  i686-linux-musl-strip build/util/hb-shape build/util/hb-info
  ```
  `hb-info` is deliberately built without cairo/chafa (no glyph previews — name/metrics/
  table/feature queries are the point).

- **`/root/test.ttf`** (hardlinked as `/root/fraunces.ttf`) — "Fraunces 72pt", a ~26 KB
  subset of Fraunces. Source: the variable TTF from https://github.com/google/fonts @
  `4024282` (`ofl/fraunces/`), OFL 1.1 (no RFN, so the subset keeps the Fraunces name).

  ```sh
  fonttools varLib.instancer 'Fraunces[SOFT,WONK,opsz,wght].ttf' \
    opsz=72 wght=400 SOFT=0 WONK=0 --update-name-table
  # then transplant a U+221E ∞ outline (Fraunces ships none) from the Liberation Sans
  # subset below, scaled 2048→2000 UPM, so `hb-shape /root/test.ttf 'markéta ∞ behdad'`
  # shapes clean, then:
  pyftsubset <instanced.ttf> \
    --unicodes=<ASCII, Czech diacritics both cases, ∞, en/em dash, curly quotes, ellipsis, nbsp> \
    --layout-features='*' --glyph-names
  ```

- **`/root/emoji.ttf`** — "Noto Color Emoji", a ~9 KB `hb-subset` (HarfBuzz **11.5.1**)
  cut of Noto Color Emoji COLRv1 (the groom's local build of
  https://github.com/googlefonts/noto-emoji, March 2025; OFL 1.1, no RFN). Kept so
  `hb-shape /root/emoji.ttf '👩‍❤️‍👨'` proves the ZWJ sequence composes to one cluster.

  ```sh
  hb-subset Noto-COLRv1.ttf \
    --unicodes=U+1F468,U+1F469,U+2764,U+FE0F,U+200D --layout-features='*'
  ```

- **`/root/sans.ttf`** — "Loft Sans", a ~28 KB fontTools subset of Liberation Sans
  Regular (ASCII + Czech lowercase diacritics + ∞, GPOS/GSUB kept), renamed because SIL
  OFL 1.1 reserves the "Liberation" name for unmodified builds. (Previously lived at
  `/root/test.ttf` before Fraunces took that slot; it's the ∞ donor above.)
- **`/root/OFL.txt`** — combined attribution + OFL 1.1 text for all three fonts.

**ISO repack recipe (from `linux/README.md`):**

```sh
# grow the ext2 ramdisk (currently ~1.3 MB free); grow ramdisk_size= to match if it fills
resize2fs <ramdisk.img> 6144   # 6144 1K-blocks

# inject files with debugfs -w  (rm / write); the fraunces.ttf hardlink is:
#   debugfs -w -R 'ln /root/test.ttf /root/fraunces.ttf' <img>
#   debugfs -w -R 'sif /root/fraunces.ttf links_count 2' <img>

# repack the ISO, adding ramdisk_size=6144 to the isolinux append line
# (the fs outgrew the kernel's 4 MB ramdisk default)
genisoimage -b isolinux/isolinux.bin -c isolinux/boot.cat \
  -no-emul-boot -boot-load-size 4 -boot-info-table <iso-root>
```

**GOTCHA — the ramdisk ships uncompressed.** A gzipped ramdisk would roughly halve the
ISO, but this kernel build oopses in `rd_load_image`'s decompressor, so it stays
uncompressed and `ramdisk_size=6144` is passed on the isolinux append line.
