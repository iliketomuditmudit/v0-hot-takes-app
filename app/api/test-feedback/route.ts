import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Testing feedback table write...")

    // Create Supabase client
    const supabase = await createClient()

    console.log("[v0] Supabase client created")

    // Create dummy data
    const dummyFeedback = {
      order_id: "0bf33a33-b17e-4c68-8780-ed6c56158b1c", // Using an existing order ID from your test
      transcript: "This is a test transcript from the test endpoint",
      summary: "Test summary",
      generated_review: "This is a test review generated for testing purposes",
      categories: ["test", "dummy"],
    }

    console.log("[v0] Attempting to insert:", dummyFeedback)

    // Insert into feedback table
    const { data, error } = await supabase.from("feedback").insert([dummyFeedback]).select().single()

    if (error) {
      console.error("[v0] Supabase error:", error)
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error,
        },
        { status: 500 },
      )
    }

    console.log("[v0] Successfully inserted feedback:", data)

    return NextResponse.json({
      success: true,
      feedback_id: data.id,
      data: data,
    })
  } catch (error: any) {
    console.error("[v0] Test feedback error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error occurred",
      },
      { status: 500 },
    )
  }
}
