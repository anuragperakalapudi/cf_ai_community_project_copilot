/**
 * @typedef {Object} Env
 * @property {any} AI
 * @property {KVNamespace} PROJECTS
 */

export default {
  /**
   * @param {Request} request
   * @param {Env} env
   * @param {ExecutionContext} ctx
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Basic CORS so the frontend can call this
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    if (url.pathname === "/api/chat" && request.method === "POST") {
      return handleChat(request, env);
    }

    return new Response("Community Project Copilot backend", {
      status: 200,
      headers: { "Content-Type": "text/plain" }
    });
  }
};

/**
 * Handle chat request:
 * body: { projectId, projectTitle, message }
 * @param {Request} request
 * @param {Env} env
 */
async function handleChat(request, env) {
  const body = await request.json();
  const projectId = body.projectId;
  const projectTitle = body.projectTitle || "Untitled Project";
  const message = body.message;

  if (!projectId || !message) {
    return new Response("Missing projectId or message", { status: 400 });
  }

  const key = `project:${projectId}`;

  // Load existing state from KV
  const currentRaw = await env.PROJECTS.get(key);
  const current = currentRaw ? JSON.parse(currentRaw) : {};
  const history = Array.isArray(current.history) ? current.history : [];

  const systemPrompt = `
You are Community Project Copilot.

You help plan real-world community service projects like:
- trail renovations
- park cleanups
- coding camps for kids
- accessibility improvements

Goals:
1) Ask for missing details (number of volunteers, time, constraints) when needed.
2) Give concrete, step-by-step suggestions.
3) When appropriate, include:
   - Materials & tools list
   - Rough budget estimate
   - Day-of schedule
   - Roles & responsibilities

Be concise and practical.
Project title: ${projectTitle}.
`.trim();

  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message }
  ];

  // Call Workers AI (Llama 3 instruct)
  const aiResult = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
    messages
  });

  const reply =
    aiResult?.response ||
    aiResult?.result ||
    (aiResult?.choices && aiResult.choices[0]?.message?.content) ||
    "Sorry, I could not generate a response.";

  const newHistory = [
    ...history,
    { role: "user", content: message },
    { role: "assistant", content: reply }
  ];

  const newState = {
    title: projectTitle,
    history: newHistory,
    lastUpdated: new Date().toISOString()
  };

  await env.PROJECTS.put(key, JSON.stringify(newState));

  return new Response(JSON.stringify({ reply, state: newState }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}
