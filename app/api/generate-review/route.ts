import { generateText } from "ai"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const { transcript, order_id, restaurant_name, food_items } = await req.json()

    if (!transcript || transcript.trim().length === 0) {
      return Response.json({ error: "Transcript is required" }, { status: 400 })
    }

    if (!order_id) {
      return Response.json({ error: "Order ID is required" }, { status: 400 })
    }

    const userLines = transcript.split("\n").filter((line: string) => line.startsWith("User:"))

    if (userLines.length === 0) {
      console.log("[v0] No user responses in transcript, returning default message")
      return Response.json(
        {
          star_rating: 0,
          review_text:
            "The call ended before any feedback was collected. Please try again and share your thoughts about your experience!",
        },
        { status: 200 },
      )
    }

    if (transcript.split("\n").length < 6) {
      console.log("[v0] Transcript too short, returning insufficient feedback message")
      return Response.json(
        {
          star_rating: 0,
          review_text:
            "Thanks for starting! The conversation was too brief to generate a full review. Please complete the full feedback session to create your Google review.",
        },
        { status: 200 },
      )
    }

    const result = await generateText({
      model: "anthropic/claude-haiku-4.5",
      prompt: `You are generating a punchy Google Maps review from a voice feedback transcript.

TRANSCRIPT:
${transcript}

RESTAURANT: ${restaurant_name || "this restaurant"}
ITEMS ORDERED: ${food_items && food_items.length > 0 ? food_items.join(", ") : "various items"}

INSTRUCTIONS:
- Write 80-120 words MAX (Google reviews work best when concise)
- First person, natural voice
- Lead with overall vibe, then 2-3 specific highlights
- Use short, punchy sentences - avoid overly flowery language
- Include specific items they mentioned positively
- Star rating based on sentiment:
  * 5 stars = loved it, multiple highlights, would return
  * 4 stars = really good, minor room for improvement
  * 3 stars = decent but notable issues
  * 2 stars = disappointed, multiple problems
  * 1 star = poor experience
- If they mention negatives, include them briefly but don't dwell
- End with a simple recommendation or final thought
- NO generic phrases like "hit the spot" or "from start to finish"

RESPOND WITH ONLY THIS JSON (no markdown, no extra text):
{"star_rating": 5, "review_text": "Your concise review here"}`,
      temperature: 0.7,
    })

    const jsonMatch = result.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.log("[v0] No JSON found in Claude response, using fallback")
      throw new Error("No JSON found in response")
    }

    const reviewData = JSON.parse(jsonMatch[0])

    // Save to database
    try {
      const supabase = await createClient()

      const feedbackData = {
        order_id: order_id,
        transcript: transcript,
        summary: "",
        generated_review: reviewData.review_text,
        categories: [],
      }

      const { error: dbError } = await supabase.from("feedback").insert(feedbackData)

      if (dbError) {
        console.error("[v0] Database save error:", dbError)
      }
    } catch (dbError) {
      console.error("[v0] Database exception:", dbError)
    }

    return Response.json({
      star_rating: reviewData.star_rating,
      review_text: reviewData.review_text,
    })
  } catch (error: any) {
    console.error("[v0] Error generating review:", error?.message)

    return Response.json(
      {
        star_rating: 0,
        review_text:
          "Unable to generate a review at this time. Please try completing the full feedback conversation to create your Google review.",
      },
      { status: 200 },
    )
  }
}
