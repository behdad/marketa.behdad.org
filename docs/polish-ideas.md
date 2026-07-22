# Polish Update

Implemented in the current polish pass:

- Script Editor AI multi-edit responses now show a compact before/after preview and apply edits atomically.
- Unsaved Script Editor drafts persist separately from named scripts and restore after reload.
- The editor reports `Running script`, `Script finished`, and `Script stopped` in its status line.
- Messages and Album have clearer English and Czech empty states.
- Advanced users can export/import bounded session progress with `session("export")`, `loftSessionExport()`, and `loftSessionImport(...)`.

Session export intentionally excludes messages, photos, scripts, credentials, and other personal data.
