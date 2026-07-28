# Reproducing the Quake III / OpenArena browser payload

The shipped engine files are the official Emscripten artifact from ioquake3 commit
`20f7436cd90aee2db64d2f72e2d622cec6592252`, Actions run `30185781103`,
artifact `8626992626`. The upstream build follows ioquake3's documented Emscripten
CMake workflow; the exact shipped identities are in `README.md`.

`baseoa/pak0.pk3` is copied unmodified from OpenArena 0.8.8. To reconstruct the reduced
arena pack:

1. Download the official `openarena-0.8.8.zip` and verify the checksum in `README.md`.
2. Expand its `baseoa/pak*.pk3` files into one overlay in numeric order.
3. Select `maps/oa_shine.bsp`, `maps/oa_shine.aas`, `levelshots/oa_shine.jpg`,
   all `botfiles/`, `scripts/bots.txt`, and the shader/image closure referenced by
   that BSP. The closure includes `env/anoice1/`, the map's texture families,
   `textures/sfx/`, and the nailgun effect assets; do not omit shader-stage images
   merely because the BSP does not name them directly.
4. Zip those paths without renaming them and compare the member list with
   `baseoa/loft-shine.manifest` (530 files).

The shipped pack's SHA-256 in `README.md` is its identity. A fresh ZIP may differ
byte-for-byte because ZIP metadata and compression versions are not reproducible.

For a visual acceptance run, use a real headful Chrome/WebGL session, wait for
`UnnamedPlayer entered the game`, and inspect the framebuffer. The player must
retain `cl_renderer opengl2`, `r_preferOpenGLES 1`, and the disabled HDR,
postprocess, tonemap, auto-exposure, normal/specular/deluxe mapping cvars. Headless
SwiftShader context loss is not a trustworthy render result for this runtime.
