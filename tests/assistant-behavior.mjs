#!/usr/bin/env node
// Deterministic assistant behavior matrix. This complements the browser harness:
// the Worker is tested with the same request envelope used by Chat and Messages,
// while the model output is deliberately adversarial (wrong language/no action)
// so deterministic safety rules are exercised.
import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../chat.js", import.meta.url), "utf8");
const knowledge = JSON.parse(await fs.readFile(new URL("../chat-knowledge.json", import.meta.url), "utf8"));
const bundled = source.replace('import CHAT_KNOWLEDGE from "./chat-knowledge.json";', `const CHAT_KNOWLEDGE = ${JSON.stringify(knowledge)};`);
const worker = (await import(`data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`)).default;
const origin = "https://marketa.behdad.org";
const env = { OPENAI_API_KEY: "test-key", TURNSTILE_SECRET: "test-secret", OPENAI_MODEL: "test-model", CHAT_RATE_LIMITER: { limit: async () => ({ success: true }) } };
let modelReply = JSON.stringify({ text: "model answer", action: null });
globalThis.fetch = async (url) => {
  if (String(url).includes("turnstile/v0/siteverify")) return new Response(JSON.stringify({ success: true, hostname: "marketa.behdad.org", action: "loft-chat" }), { status: 200 });
  return new Response(JSON.stringify({ output_text: modelReply }), { status: 200, headers: { "content-type": "application/json" } });
};

function request(body) {
  return new Request(`${origin}/chat`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ turnstile_token: "test-token", ...body }),
  });
}
async function ask(message, context, mode = "private") {
  modelReply = JSON.stringify({ text: "Видео остановлено.", action: null, sender: "Danesh" });
  const body = { message, context, mode };
  if (mode === "group_chat") body.group_chat = { cast: [{ name: "Athena", role: "wedding boss" }, { name: "Charlie", role: "wedding assistant" }] };
  const response = await worker.fetch(request(body), env);
  const json = await response.json();
  return { status: response.status, reply: JSON.parse(json.reply) };
}
function check(ok, label, detail) {
  if (ok) console.log(`  ✓ ${label}`);
  else { failures++; console.log(`  ✗ ${label}`, detail || ""); }
}
let failures = 0;
console.log("Assistant behavior matrix:");

let r = await ask("where can I find vitamins?", { phase: 2, actions_available: ["trip.next"] });
check(r.status === 200 && r.reply.action === null && /magic box in garden\/party/.test(r.reply.text), "private Chat keeps vitamin location informational", r);
r = await ask("let's have vitamins", { phase: 2, trip: { active: false }, actions_available: ["trip.next"] });
check(r.reply.action?.id === "trip.next", "private Chat turns a generic vitamin request into trip.next", r);
r = await ask("let's have vitamins", { phase: 1, trip: { active: false }, actions_available: ["trip.next"] });
check(r.reply.action === null && /phase 2/i.test(r.reply.text), "private Chat refuses vitamin trips before phase 2", r);
r = await ask("let's have vitamins", { phase: 2, party: true, trip: { active: false }, actions_available: ["trip.next"] });
check(r.reply.action?.id === "trip.next", "private Chat follows the advertised trip.next availability during a party", r);

r = await ask("dej mi vitaminy", { phase: 2, actions_available: ["trip.next"], site_language: "cs" });
check(r.reply.action?.id === "trip.next" && /vitam|trip/i.test(r.reply.text), "Czech vitamin request gets a trip suggestion", r);
r = await ask("بیایید ویتامین بخوریم", { phase: 2, actions_available: ["trip.next"] });
check(r.reply.action?.id === "trip.next" && /ویتامین/.test(r.reply.text), "Persian vitamin request gets trip.next in Persian", r);

r = await ask("stop video", { media: { video: { open: true, playing: true } }, actions_available: ["video.pause"] });
check(r.reply.action?.id === "video.pause" && /Pausing the video/i.test(r.reply.text) && !/[А-Яа-я]/.test(r.reply.text), "private Chat pauses video and corrects wrong model language", r);
r = await ask("stop video", { media: { video: { open: true, playing: true } }, actions_available: ["video.pause"] }, "group_chat");
check(r.reply.sender === "Charlie" && r.reply.action?.id === "video.pause" && /tap/i.test(r.reply.text), "Wedding crew offers video.pause as a tap action", r);
r = await ask("stop video", { media: { video: { open: true, playing: false } }, actions_available: [] });
check(r.reply.action === null && /isn.t playing/i.test(r.reply.text), "video stop never claims success when unavailable", r);

if (failures) { console.log(`\n${failures} check(s) failed.`); process.exit(1); }
console.log("\nAll checks passed.");
