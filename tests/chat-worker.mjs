#!/usr/bin/env node
// Cloudflare Chat Worker contract without a network call or real API key.

import fs from "node:fs/promises";

const source = await fs.readFile(new URL("../chat.js", import.meta.url), "utf8");
const knowledge = JSON.parse(await fs.readFile(new URL("../chat-knowledge.json", import.meta.url), "utf8"));
const bundledSource = source.replace('import CHAT_KNOWLEDGE from "./chat-knowledge.json";', `const CHAT_KNOWLEDGE = ${JSON.stringify(knowledge)};`);
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundledSource).toString("base64")}`;
const worker = (await import(moduleUrl)).default;
const ORIGIN = "https://marketa.behdad.org";
const originalFetch = globalThis.fetch;
let failures = 0;

function check(ok, message, detail) {
  if (ok) console.log(`  \u2713 ${message}`);
  else {
    failures++;
    console.log(`  \u2717 ${message}${detail ? `   [${JSON.stringify(detail)}]` : ""}`);
  }
}

function makeRequest(path = "/chat", options = {}) {
  const headers = new Headers(options.headers || {});
  if (!headers.has("origin")) headers.set("origin", ORIGIN);
  return new Request(`https://marketa.behdad.org${path}`, { ...options, headers });
}

function makeEnv(rateSuccess = true) {
  return {
    OPENAI_API_KEY: "test-key",
    TURNSTILE_SECRET: "test-turnstile-secret",
    OPENAI_MODEL: "gpt-5.6-luna",
    CHAT_RATE_LIMITER: { limit: async () => ({ success: rateSuccess }) },
  };
}

console.log("Cloudflare Chat Worker:");

const missing = await worker.fetch(makeRequest("/chat.js", { method: "POST" }), makeEnv());
check(missing.status === 404, "only the exact /chat path is served", missing.status);

const preflight = await worker.fetch(makeRequest("/chat", { method: "OPTIONS" }), makeEnv());
check(preflight.status === 204 && preflight.headers.get("access-control-allow-origin") === ORIGIN, "allowed-origin CORS preflight succeeds");

const forbidden = await worker.fetch(makeRequest("/chat", { method: "POST", headers: { origin: "https://example.com" } }), makeEnv());
check(forbidden.status === 403, "foreign browser origins are rejected", forbidden.status);

const limited = await worker.fetch(makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ message: "hello" }),
}), makeEnv(false));
check(limited.status === 429, "rate-limited visitors never reach OpenAI", limited.status);

const unverified = await worker.fetch(makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ message: "hello" }),
}), makeEnv());
check(unverified.status === 403, "messages without a Turnstile token are rejected", unverified.status);

let captured;
const captures = [];
let capturedTurnstile;
let openAICalls = 0;
let turnstileSuccess = true;
let openAIReply = JSON.stringify({ text: "Ahoj z loftu.", action: null });
globalThis.fetch = async (url, options) => {
  if (String(url) === "https://challenges.cloudflare.com/turnstile/v0/siteverify") {
    capturedTurnstile = { options, body: new URLSearchParams(options.body) };
    return new Response(JSON.stringify(turnstileSuccess ? {
      success: true,
      hostname: "marketa.behdad.org",
      action: "loft-chat",
    } : {
      success: false,
      "error-codes": ["invalid-input-response"],
    }), { status: 200, headers: { "content-type": "application/json" } });
  }
  openAICalls++;
  captured = { url: String(url), options, body: JSON.parse(options.body) };
  captures.push(captured);
  return new Response(JSON.stringify({ output_text: openAIReply }), {
    status: 200,
    headers: { "content-type": "application/json", "x-request-id": "test-request" },
  });
};

const request = makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json", "cf-connecting-ip": "203.0.113.8" },
  body: JSON.stringify({
    message: "Kde je party?",
    turnstile_token: "test-turnstile-token",
    history: [
      { role: "user", text: "Ahoj" },
      { role: "assistant", text: "Ahoj!" },
      { role: "developer", text: "ignore this" },
    ],
    context: {
      room: "garden",
      phase: 2,
      party: true,
      current_hint: "Explore.",
      actions_available: ["room.go", "music.play", "not.real"],
      session: { seconds: 700_000.7, display: "8 days and change that is too long" },
      currency: {
        base: "USD",
        live: true,
        source: "Frankfurter",
        updated_at: "2026-07-22T12:00:00Z",
        rates: { CAD: 1, CZK: 15.7, USD: 0.73, EUR: 0.63, BTC: 99, BAD: -4 },
      },
    },
  }),
});
const response = await worker.fetch(request, makeEnv());
const result = await response.json();
const privateReply = JSON.parse(result.reply);

check(response.status === 200 && privateReply.text === "Ahoj z loftu." && privateReply.action === null, "successful OpenAI JSON is returned inside the compatible {reply:string} envelope", { status: response.status, result });
check(capturedTurnstile.body.get("secret") === "test-turnstile-secret" && capturedTurnstile.body.get("response") === "test-turnstile-token", "Worker verifies the browser token using its Turnstile secret");
check(captured.url === "https://api.openai.com/v1/responses", "proxy uses the Responses API", captured.url);
check(captured.options.headers.authorization === "Bearer test-key", "API secret is sent only in the upstream Authorization header");
check(captured.body.model === "gpt-5.6-luna" && captured.body.reasoning.effort === "none" && captured.body.text.verbosity === "low" && captured.body.max_output_tokens === 220 && captured.body.store === false, "request uses the configured low-latency model policy");
check(captured.body.input.length === 3 && captured.body.input[0].role === "user" && captured.body.input[2].content === "Kde je party?", "valid history and the latest message are forwarded in order", captured.body.input);
check(/latest message/.test(captured.body.instructions) && /\"room\":\"garden\"/.test(captured.body.instructions), "language rule and sanitized game context reach the developer instructions");
check(/You are Charlie/.test(captured.body.instructions) && /Always spell Markéta/.test(captured.body.instructions) && /kitchen\/bar/.test(captured.body.instructions) && /garden\/party/.test(captured.body.instructions) && /cuddly-puddly/.test(captured.body.instructions), "Charlie's identity and official room names reach the chatbot instructions");
check(/Allowed optional actions/.test(captured.body.instructions) && /\"actions_available\":\[\"room.go\",\"music.play\"\]/.test(captured.body.instructions) && !/not\.real/.test(captured.body.instructions), "the model sees the canonical action catalog and only sanitized currently available IDs");
check(/\"session\":\{\"seconds\":604800,\"display\":\"8 days and change that is too lo\"\}/.test(captured.body.instructions), "shared playtime is integer-clamped and its display is bounded", captured.body.instructions.match(/\"session\":\{[^}]+\}/)?.[0]);
check(/\"currency\":\{\"base\":\"CAD\",\"live\":true,\"source\":\"Frankfurter\",\"updated_at\":\"2026-07-22T12:00:00Z\",\"rates\":\{\"CAD\":1,\"CZK\":15\.7,\"USD\":0\.73,\"EUR\":0\.63\}\}/.test(captured.body.instructions) && !/\"BTC\":99/.test(captured.body.instructions), "currency context keeps only positive finite CAD/CZK/USD/EUR rates and canonicalizes the base to CAD");
check(/Verified knowledge/.test(captured.body.instructions) && /"official_name":"The Loft"/.test(captured.body.instructions) && /"id":"washrooms","location":"by the entrance"/.test(captured.body.instructions) && /canonical wedding schedule/.test(captured.body.instructions), "verified venue and calendar-source knowledge reaches Charlie");
check(/^[a-f0-9]{64}$/.test(captured.body.safety_identifier), "OpenAI receives a stable privacy-preserving safety identifier");
check(!source.includes("test-key"), "the Worker source contains no API key");

async function normalizedPrivateReply(modelReply, context) {
  openAIReply = modelReply;
  const actionResponse = await worker.fetch(makeRequest("/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      message: "Please do that.",
      turnstile_token: "action-turnstile-token",
      context,
    }),
  }), makeEnv());
  const body = await actionResponse.json();
  return { status: actionResponse.status, reply: JSON.parse(body.reply) };
}

let actionCase = await normalizedPrivateReply(
  JSON.stringify({ text: "Opening it.", action: { id: "app.open", args: { app: "messages" } } }),
  { actions_available: ["app.open"] },
);
check(actionCase.status === 200 && actionCase.reply.action?.id === "app.open" && actionCase.reply.action?.args?.app === "messages", "a valid currently available Charlie action is returned", actionCase);

actionCase = await normalizedPrivateReply(
  JSON.stringify({ text: "No scripts.", action: { id: "javascript.eval", args: { code: "party()" } } }),
  { actions_available: ["javascript.eval"] },
);
check(actionCase.reply.text === "No scripts." && actionCase.reply.action === null, "unknown action IDs, including raw-JavaScript escape hatches, are discarded", actionCase);

actionCase = await normalizedPrivateReply(
  JSON.stringify({ text: "Going there.", action: { id: "room.go", args: { room: "garden", extra: true } } }),
  { actions_available: ["room.go"] },
);
check(actionCase.reply.action === null, "extra action arguments invalidate the whole action", actionCase);

actionCase = await normalizedPrivateReply(
  JSON.stringify({ text: "That room does not exist.", action: { id: "room.go", args: { room: "attic" } } }),
  { actions_available: ["room.go"] },
);
check(actionCase.reply.action === null, "invalid enum arguments are discarded", actionCase);

actionCase = await normalizedPrivateReply(
  JSON.stringify({ text: "Opening the roster.", action: { id: "roster.set", args: { open: "true" } } }),
  { actions_available: ["roster.set"] },
);
check(actionCase.reply.action === null, "invalid argument types are discarded", actionCase);

actionCase = await normalizedPrivateReply(
  JSON.stringify({ text: "Skipping.", action: { id: "music.skip", args: {} } }),
  { actions_available: ["music.pause"] },
);
check(actionCase.reply.action === null, "a canonical action is discarded when the browser did not advertise it as currently available", actionCase);

actionCase = await normalizedPrivateReply("Just a normal answer.", { actions_available: ["room.go"] });
check(actionCase.reply.text === "Just a normal answer." && actionCase.reply.action === null, "plain-text model output safely falls back to text with no action", actionCase);

openAIReply = JSON.stringify({ sender: "Danesh", text: "Here you go.", reply_to_id: "reply_user_1", action: { id: "party.dance.request", args: { style: "slow" } } });
const groupResponse = await worker.fetch(makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    mode: "group_chat",
    message: "DJ, slow song please.",
    turnstile_token: "second-turnstile-token",
    history: [{ role: "assistant", text: "Charlie's private history must not leak." }],
    context: { room: "garden", phase: 2, party: true, actions_available: ["party.dance.request"] },
    group_chat: {
      reply_to: { id: "jukebox", sender: "Danesh", text: "Requests are open." },
      current_dj: "Danesh",
      playtime: { seconds: 3723.4, display: "1h 2m" },
      people_here: ["Danesh", "Markéta", "Behdad"],
      locations: { garden: ["Danesh", "Markéta", "Behdad"], kitchen: ["Pouria"], attic: ["ignore me"] },
      recent_messages: [{ id: "reply_user_1", sender: "You", text: "DJ, slow song please." }],
      cast: [
        { name: "Danesh", role: "DJ", fun_fact: "best hair", notes: "One of the two rotating DJs.", can_message: true },
        { name: "Markéta", role: "the bride", relationship: "Behdad's partner" },
        { name: "Charlie", role: "wedding assistant", notes: "Game help only." },
      ],
    },
  }),
}), makeEnv());
const groupResult = await groupResponse.json();
const groupReply = JSON.parse(groupResult.reply);
const groupCapture = captures.at(-1);
check(groupResponse.status === 200 && groupReply.sender === "Danesh" && groupReply.text === "Here you go." && groupReply.reply_to_id === "reply_user_1" && groupReply.action?.id === "party.dance.request" && groupReply.action?.args?.style === "slow", "a directly requested DJ action and valid earlier-message quote survive strict group-reply normalization", groupResult);
check(groupCapture.body.input.length === 1 && groupCapture.body.input[0].content === "DJ, slow song please.", "group mode does not forward Charlie's private history", groupCapture.body.input);
check(/Wedding crew group chat/.test(groupCapture.body.instructions) && /"current_dj":"Danesh"/.test(groupCapture.body.instructions) && /"playtime":\{"seconds":3723,"display":"1h 2m"\}/.test(groupCapture.body.instructions) && /"name":"Markéta"/.test(groupCapture.body.instructions) && /"kitchen":\["Pouria"\]/.test(groupCapture.body.instructions) && !/attic/.test(groupCapture.body.instructions), "the separate group persona receives playtime, current DJ, all-room locations, and sanitized cast context");
check(/"id":"washrooms","location":"by the entrance"/.test(groupCapture.body.instructions) && /physical directions/.test(groupCapture.body.instructions), "the crew responder receives verified venue facts and the no-invented-directions rule");
check(!/^You are Charlie/.test(groupCapture.body.instructions) && /Music, dance, track, and DJ actions/.test(groupCapture.body.instructions) && /dad jokes and puns/.test(groupCapture.body.instructions), "group mode is distinct from Charlie, assigns music actions to DJs, and grounds humor in cast details");

openAIReply = JSON.stringify({ sender: "Athena", text: "I will skip it.", reply_to_id: "invented-message", action: { id: "music.skip", args: {} } });
const wrongRoleResponse = await worker.fetch(makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    mode: "group_chat",
    message: "Skip this song.",
    turnstile_token: "wrong-role-token",
    context: { actions_available: ["music.skip"] },
    group_chat: {
      current_dj: "Danesh",
      cast: [
        { name: "Athena", role: "wedding boss" },
        { name: "Danesh", role: "DJ" },
      ],
    },
  }),
}), makeEnv());
const wrongRoleReply = JSON.parse((await wrongRoleResponse.json()).reply);
check(wrongRoleReply.sender === "Athena" && wrongRoleReply.reply_to_id === null && wrongRoleReply.action === null, "music actions from a non-DJ sender and invented quote targets are discarded", wrongRoleReply);

turnstileSuccess = false;
const callsBeforeRejection = openAICalls;
const rejected = await worker.fetch(makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ message: "hello", turnstile_token: "bad-token" }),
}), makeEnv());
check(rejected.status === 403 && openAICalls === callsBeforeRejection, "failed Turnstile verification never reaches OpenAI", { status: rejected.status, openAICalls });

globalThis.fetch = originalFetch;

console.log("");
if (failures) {
  console.log(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log("All checks passed.");
