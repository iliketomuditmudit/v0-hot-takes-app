"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"

const SAMPLE_TRANSCRIPT = `Assistant: Hi! Thank you for ordering from Bella's Italian Kitchen. I'd love to hear about your experience today. How was everything?

Customer: Oh it was amazing! The food was really good. The pasta was perfectly cooked and the sauce was incredible. We also got the tiramisu for dessert and it was the best I've ever had. The delivery was quick too, only took about 25 minutes. My only complaint is that they forgot to include extra napkins, but honestly the food was so good I don't even care.`

const TestReviewPage = () => {
  const [review, setReview] = useState(SAMPLE_TRANSCRIPT)
  const [summary, setSummary] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSummarize = async () => {
    setLoading(true)
    setError("")
    setSummary("")

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: review }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize")
      }

      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Claude API Summarization</CardTitle>
            <CardDescription>Enter a review or transcript and get an AI-generated summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Review Text</label>
              <Textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Write your review or paste a transcript..."
                className="min-h-[200px]"
              />
            </div>
            <Button onClick={handleSummarize} disabled={loading || !review.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Summarizing..." : "Summarize with Claude"}
            </Button>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}

            {summary && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="font-semibold text-green-900 mb-2">Summary:</p>
                <p className="text-green-800">{summary}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default TestReviewPage
