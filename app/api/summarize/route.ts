import { generateText } from "ai"

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return Response.json({ error: "Text is required" }, { status: 400 })
    }

    console.log("[v0] Text to summarize length:", text.length)

    const { text: summary } = await generateText({
      model: "anthropic/claude-haiku-4.5",
      prompt: `Please provide a concise summary (2-3 sentences) of this customer review or transcript:

${text}

Summary:`,
    })

    console.log("[v0] Summary generated:", summary)

    return Response.json({ summary })
  } catch (error: any) {
    console.error("[v0] Error summarizing:", error?.message || error)
    console.error("[v0] Error details:", error)
    return Response.json({ error: error instanceof Error ? error.message : "Failed to summarize" }, { status: 500 })
  }
}
