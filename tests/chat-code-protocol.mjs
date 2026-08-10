#!/usr/bin/env node
// Contract tests for the bounded, reviewable Code edit protocol.
import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../chat.js", import.meta.url), "utf8");
const knowledge = JSON.parse(await fs.readFile(new URL("../chat-knowledge.json", import.meta.url), "utf8"));
const bundled = source.replace('import CHAT_KNOWLEDGE from "./chat-knowledge.json";', `const CHAT_KNOWLEDGE = ${JSON.stringify(knowledge)};`);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`;
const { normalizeCodeReply } = await import(moduleUrl);

let failures = 0;
function check(ok, message, detail) {
  if (ok) console.log(`  ✓ ${message}`);
  else { failures++; console.log(`  ✗ ${message}${detail ? `   [${JSON.stringify(detail)}]` : ""}`); }
}
function parse(reply, code = {}) {
  return JSON.parse(normalizeCodeReply(JSON.stringify(reply), code));
}

console.log("Code edit protocol:");
const code = 'await sleep(10000);\nawait loft.call.incoming.trigger("madla");\nloft.party.set(true);';
const callStart = code.indexOf("loft.call.incoming.trigger");
const callEnd = callStart + 'loft.call.incoming.trigger("madla")'.length;
const valid = parse({ text: "Insert the call before the party.", edits: [
  { start: 0, end: 0, text: "// delayed call\n" },
  { start: callStart, end: callEnd, text: 'loft.call.video.start("lubeck")' },
] }, { source: code });
check(valid.edits.length === 2 && valid.edits[0].start === 0 && valid.edits[1].end === callEnd, "valid non-overlapping edits survive normalization", valid);
check(valid.suggestion === "" && valid.replace === false, "multi-edit response remains separate from legacy suggestion fields", valid);

const overlap = parse({ text: "bad", edits: [{ start: 1, end: 8, text: "x" }, { start: 7, end: 10, text: "y" }] }, { source: code });
check(overlap.edits.length === 0, "overlapping edits are rejected as a batch", overlap.edits);

const outOfBounds = parse({ text: "bad", edits: [{ start: 0, end: code.length + 1, text: "x" }] }, { source: code });
check(outOfBounds.edits.length === 0, "out-of-bounds edits are rejected", outOfBounds.edits);

const malformed = parse({ text: "bad", edits: [{ start: 0, end: 0, text: "x" }, { start: "later", end: 1, text: "y" }] }, { source: code });
check(malformed.edits.length === 0, "malformed edit entries invalidate the batch", malformed.edits);
const coerced = parse({ text: "bad", edits: [{ start: "0", end: 0, text: "x" }] }, { source: code });
check(coerced.edits.length === 0, "string offsets are not coerced into edits", coerced.edits);

const legacy = parse({ text: "replace this", suggestion: "loft.party.set(true);", replace: true }, { source: code });
check(legacy.suggestion === "loft.party.set(true);" && legacy.replace === true && Array.isArray(legacy.edits) && legacy.edits.length === 0, "legacy suggestion/replace reply fields remain compatible", legacy);

const nested = JSON.parse(normalizeCodeReply(JSON.stringify({
  text: JSON.stringify({
    text: "Replace the current script.",
    suggestion: "import turtle\nturtle.circle(60)",
    replace: true,
    edits: [],
  }),
}), { language: "python", source: "print('old')" }));
check(nested.suggestion === "import turtle\nturtle.circle(60)" && nested.replace === true,
  "nested JSON envelopes preserve a complete code suggestion", nested);

const huge = parse({ text: "too much", edits: Array.from({ length: 17 }, (_, i) => ({ start: 0, end: 0, text: String(i) })) }, { source: code });
check(huge.edits.length === 0, "edit count is capped", huge.edits.length);

if (failures) { console.log(`${failures} check(s) failed.`); process.exit(1); }
console.log("All checks passed.");
