# Reproducing the Duke browser payload

The shipped engine files were not compiled in this repository. They are the published
GitHub Pages output of `originalsouth/emduke32` commit
`e2f24a97b3aaa58c75bf3992010634da9d711a57`, whose workflow pins Emscripten 5.0.5:

```sh
make EMSCRIPTEN=1 -j"$(nproc)"
```

The resulting `eduke32.js` and `eduke32.wasm` identities are recorded in `README.md`.
`player.html` is the repository-owned shell based on that upstream loader.

`3dduke13.zip` must never be rebuilt or repacked. It is the exact official 1.3d
shareware release whose original license requires every released file to be included
without modification. The player parses that unchanged archive in memory, extracts
`DN3DSW13.SHR`, then extracts `DUKE3D.GRP`. Verify its recorded size and checksums in
`README.md` before any replacement.
