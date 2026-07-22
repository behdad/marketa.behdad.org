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
let openAIReply = "Ahoj z loftu.";
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
    context: { room: "garden", phase: 2, party: true, current_hint: "Explore." },
  }),
});
const response = await worker.fetch(request, makeEnv());
const result = await response.json();

check(response.status === 200 && result.reply === "Ahoj z loftu.", "successful OpenAI text is returned as {reply}", { status: response.status, result });
check(capturedTurnstile.body.get("secret") === "test-turnstile-secret" && capturedTurnstile.body.get("response") === "test-turnstile-token", "Worker verifies the browser token using its Turnstile secret");
check(captured.url === "https://api.openai.com/v1/responses", "proxy uses the Responses API", captured.url);
check(captured.options.headers.authorization === "Bearer test-key", "API secret is sent only in the upstream Authorization header");
check(captured.body.model === "gpt-5.6-luna" && captured.body.reasoning.effort === "none" && captured.body.text.verbosity === "low" && captured.body.max_output_tokens === 220 && captured.body.store === false, "request uses the configured low-latency model policy");
check(captured.body.input.length === 3 && captured.body.input[0].role === "user" && captured.body.input[2].content === "Kde je party?", "valid history and the latest message are forwarded in order", captured.body.input);
check(/latest message/.test(captured.body.instructions) && /\"room\":\"garden\"/.test(captured.body.instructions), "language rule and sanitized game context reach the developer instructions");
check(/You are Charlie/.test(captured.body.instructions) && /Always spell Markéta/.test(captured.body.instructions) && /kitchen\/bar/.test(captured.body.instructions) && /cuddly-puddly/.test(captured.body.instructions), "Charlie's identity and official names reach the chatbot instructions");
check(/Verified knowledge/.test(captured.body.instructions) && /"id":"washrooms","location":"by the entrance"/.test(captured.body.instructions) && /"id":"prague_brunch","date":"2027-07-11"/.test(captured.body.instructions), "verified venue and wedding knowledge reaches Charlie");
check(/^[a-f0-9]{64}$/.test(captured.body.safety_identifier), "OpenAI receives a stable privacy-preserving safety identifier");
check(!source.includes("test-key"), "the Worker source contains no API key");

openAIReply = JSON.stringify({ sender: "Danesh", text: "Here you go.", action: { name: "slowdance" } });
const groupResponse = await worker.fetch(makeRequest("/chat", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    mode: "group_chat",
    message: "DJ, slow song please.",
    turnstile_token: "second-turnstile-token",
    history: [{ role: "assistant", text: "Charlie's private history must not leak." }],
    context: { room: "garden", phase: 2, party: true },
    group_chat: {
      reply_to: { sender: "Danesh", text: "Requests are open." },
      current_dj: "Danesh",
      people_here: ["Danesh", "Markéta", "Behdad"],
      locations: { garden: ["Danesh", "Markéta", "Behdad"], kitchen: ["Pouria"], attic: ["ignore me"] },
      recent_messages: [{ sender: "You", text: "DJ, slow song please." }],
      cast: [
        { name: "Danesh", role: "DJ", fun_fact: "best hair", notes: "One of the two rotating DJs." },
        { name: "Markéta", role: "the bride", relationship: "Behdad's partner" },
        { name: "Charlie", role: "wedding assistant", notes: "Game help only." },
      ],
    },
  }),
}), makeEnv());
const groupResult = await groupResponse.json();
const groupReply = JSON.parse(groupResult.reply);
const groupCapture = captures.at(-1);
check(groupResponse.status === 200 && groupReply.sender === "Danesh" && groupReply.text === "Here you go." && groupReply.action === null, "group replies are normalized to a cast sender and actions remain disabled", groupResult);
check(groupCapture.body.input.length === 1 && groupCapture.body.input[0].content === "DJ, slow song please.", "group mode does not forward Charlie's private history", groupCapture.body.input);
check(/Wedding crew group chat/.test(groupCapture.body.instructions) && /"current_dj":"Danesh"/.test(groupCapture.body.instructions) && /"name":"Markéta"/.test(groupCapture.body.instructions) && /"kitchen":\["Pouria"\]/.test(groupCapture.body.instructions) && !/attic/.test(groupCapture.body.instructions), "the separate group persona receives current DJ, all-room locations, and sanitized cast context");
check(/"id":"washrooms","location":"by the entrance"/.test(groupCapture.body.instructions) && /physical directions/.test(groupCapture.body.instructions), "the crew responder receives verified venue facts and the no-invented-directions rule");
check(!/^You are Charlie/.test(groupCapture.body.instructions) && /action value must be null/.test(groupCapture.body.instructions), "group mode is distinct from Charlie and cannot request game actions yet");

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
