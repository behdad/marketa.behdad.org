# art/linux/linux.iso

The bootable image behind rsvp.html's Linux app (v86). It is the v86 project's stock
Buildroot demo ISO — Linux 2.6.34.14 + busybox, i686, serial console, from
https://github.com/copy/images @ db92d8fd (kernel & busybox under GPLv2; that repo and
Buildroot/kernel.org are the corresponding-source pointers) — repacked with two
additions in the ext2 ramdisk:

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
- `/root/test.ttf` — "Loft Sans", a ~28 KB fontTools subset of Liberation Sans Regular
  (ASCII + Czech lowercase diacritics + ∞, GPOS/GSUB kept), renamed because the
  SIL OFL 1.1 reserves the "Liberation" name for unmodified builds. License text ships
  inside the image as `/root/OFL.txt` (copy of the Liberation LICENSE file).

Repack: grow the ext2 image (`resize2fs` to 5120 1K-blocks), inject files with
`debugfs -w`, then `genisoimage -b isolinux/isolinux.bin -c isolinux/boot.cat
-no-emul-boot -boot-load-size 4 -boot-info-table` with `ramdisk_size=5120` added to the
isolinux append line (the fs outgrew the kernel's 4 MB ramdisk default). A gzipped
ramdisk would halve the ISO but this kernel build oopses in `rd_load_image`'s
decompressor, so it ships uncompressed.
