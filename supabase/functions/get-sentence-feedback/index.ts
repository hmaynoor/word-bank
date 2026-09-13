const apiKey = Deno.env.get("ANTHROPIC_API_KEY");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { word, definition, sentence } = await req.json();

    if (!word || !definition || !sentence) {
      return new Response(
        JSON.stringify({ error: "Missing word, definition, or sentence" }),
        { status: 400 }
      );
    }

    const prompt = `A writer is learning vocabulary. They need to write a sentence using the word "${word}" (definition: "${definition}").

Their sentence: "${sentence}"

Evaluate this sentence on:
1. **Correct usage** — Does it use the word correctly in context?
2. **Nuance** — Is the word used in a natural, sophisticated way that shows understanding?
3. **Voice** — Does it sound like authentic writing, not forced or artificial?

Be encouraging but honest. Keep feedback concise (2-3 sentences max). Focus on what works and one thing to consider if needed.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey || "",
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-1",
        max_tokens: 200,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Claude API error: ${error}`);
    }

    const data = await response.json();
    const feedback = data.content[0].text;

    return new Response(
      JSON.stringify({
        feedback: feedback,
        word,
        definition,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
    });
  }
});