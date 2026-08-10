#!/usr/bin/env node
import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../chat.js", import.meta.url), "utf8");
const knowledge = JSON.parse(await fs.readFile(new URL("../chat-knowledge.json", import.meta.url), "utf8"));
const bundled = source.replace('import CHAT_KNOWLEDGE from "./chat-knowledge.json";', `const CHAT_KNOWLEDGE = ${JSON.stringify(knowledge)};`);
const worker = (await import(`data:text/javascript;base64,${Buffer.from(bundled).toString("base64")}`)).default;
const origin = "https://marketa.behdad.org";
let failures = 0;
let modelReply = JSON.stringify({ text: "Ready.", action: null });
let capturedInstructions = "";

function check(ok, message, detail) {
  if (ok) console.log(`  ✓ ${message}`);
  else { failures++; console.log(`  ✗ ${message}${detail ? `   [${JSON.stringify(detail)}]` : ""}`); }
}

globalThis.fetch = async (url, options) => {
  if (String(url).includes("turnstile/v0/siteverify")) return new Response(JSON.stringify({ success: true, hostname: "marketa.behdad.org", action: "loft-chat" }), { status: 200 });
  const body = JSON.parse(options.body);
  capturedInstructions = body.instructions;
  return new Response(JSON.stringify({ output_text: modelReply }), { status: 200, headers: { "content-type": "application/json" } });
};

const env = {
  OPENAI_API_KEY: "test-key",
  TURNSTILE_SECRET: "test-secret",
  OPENAI_MODEL: "gpt-test",
  CHAT_RATE_LIMITER: { limit: async () => ({ success: true }) },
};

async function ask(reply, actions, mode = "private") {
  modelReply = JSON.stringify(reply);
  const group = mode === "group_chat" ? {
    cast: [{ name: "Pouria", role: "bartender", can_message: true }, { name: "Behdad", role: "host", can_message: true }, { name: "Charlie", role: "assistant", can_message: true }],
    current_dj: "Behdad", reply_to: null, recent_messages: [],
  } : undefined;
  const response = await worker.fetch(new Request("https://marketa.behdad.org/chat", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify({ message: "Please do exactly that.", mode, group_chat: group, turnstile_token: "token", context: { phase: 2, actions_available: actions } }),
  }), env);
  const body = await response.json();
  return JSON.parse(body.reply);
}

console.log("Cloudflare Worker safe action catalog:");
const cases = [
  ["garden.moment.start", { moment: "group-photo" }],
  ["call.incoming.trigger", { caller: "madla" }],
  ["call.video.start", { contact: "lubeck" }],
  ["call.hangup", {}],
  ["kitchen.cocktail.make", { drink: "negroni" }],
  ["kitchen.mixer.start", { recipe: "yale" }],
  ["minigame.start", { game: "flair-catch" }],
  ["minigame.stop", {}],
  ["video.pause", {}],
  ["trip.next", {}],
  ["scene.activity.start", { activity: "rainbow" }],
  ["weather.scene.set", { mode: "thunderstorm" }],
  ["sky.effect.set", { effect: "aurora" }],
];
for (const [id, args] of cases) {
  const reply = await ask({ text: "On it.", action: { id, args } }, [id]);
  check(reply.action?.id === id && JSON.stringify(reply.action.args) === JSON.stringify(args), `${id} accepts its fixed enum`, reply);
}

let reply = await ask({ text: "No.", action: { id: "minigame.start", args: { game: "doom" } } }, ["minigame.start"]);
check(reply.action === null, "an unlisted game is rejected", reply);
reply = await ask({ text: "No.", action: { id: "kitchen.cocktail.make", args: { drink: "beer" } } }, ["kitchen.cocktail.make"]);
check(reply.action === null, "a drink outside the authored menu is rejected", reply);
reply = await ask({ text: "No.", action: { id: "weather.scene.set", args: { mode: "hail" } } }, ["weather.scene.set"]);
check(reply.action === null, "an arbitrary weather value is rejected", reply);
reply = await ask({ text: "No.", action: { id: "sky.effect.set", args: { effect: "solar-eclipse" } } }, ["sky.effect.set"]);
check(reply.action === null, "an unlisted sky effect is rejected", reply);
reply = await ask({ sender: "Pouria", text: "Tap this and I’ll mix it.", reply_to_id: null, action: { id: "kitchen.cocktail.make", args: { drink: "mojito" } } }, ["kitchen.cocktail.make"], "group_chat");
check(reply.sender === "Pouria" && reply.action?.id === "kitchen.cocktail.make", "Wedding crew keeps the action as a suggestion for the Messages UI", reply);
check(/garden\.moment\.start/.test(capturedInstructions) && /call\.incoming\.trigger/.test(capturedInstructions) && /kitchen\.cocktail\.make/.test(capturedInstructions) && /minigame\.start/.test(capturedInstructions) && /weather\.scene\.set/.test(capturedInstructions) && /sky\.effect\.set/.test(capturedInstructions) && /can we do the toasts\?/.test(capturedInstructions) && /what are the toasts\?/.test(capturedInstructions) && /Do not attach an action to a mere mention/.test(capturedInstructions) && /does not alter or claim to alter the real Edmonton or Prague forecast/.test(capturedInstructions), "the model receives the bounded catalog and distinguishes scene controls from factual weather questions");

console.log("");
if (failures) { console.log(`${failures} check(s) failed.`); process.exit(1); }
console.log("All checks passed.");
