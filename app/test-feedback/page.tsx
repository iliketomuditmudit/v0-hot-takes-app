"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TestFeedbackPage() {
  const [result, setResult] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const testWriteFeedback = async () => {
    setLoading(true)
    setResult("")

    try {
      const response = await fetch("/api/test-feedback", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult(`✅ Success! Wrote feedback with ID: ${data.feedback_id}`)
      } else {
        setResult(`❌ Error: ${data.error}`)
      }
    } catch (error) {
      setResult(`❌ Request failed: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Test Feedback Table Write</CardTitle>
            <CardDescription>This will attempt to write a dummy row to the feedback table in Supabase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testWriteFeedback} disabled={loading} className="w-full">
              {loading ? "Testing..." : "Write Dummy Feedback Row"}
            </Button>

            {result && <div className="p-4 rounded-lg bg-gray-100 font-mono text-sm">{result}</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
