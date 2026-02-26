"use client"

import { useState, useEffect, useRef } from "react"
import Vapi from "@vapi-ai/web"
import { createClient } from "@supabase/supabase-js"

interface OrderData {
  order_id: string
  restaurant_name: string
  google_maps_url: string
  food_items: string[]
  alcohol_items: string[]
  food_categories: string[]
  alcohol_categories: string[]
}

interface ReviewData {
  star_rating: number
  review_text: string
}

type PageState = "landing" | "voice" | "review"
type VoiceStatus = "idle" | "connecting" | "listening" | "speaking" | "thinking"

const DUMMY_ORDER_DATA: OrderData = {
  order_id: "123e4567-e89b-12d3-a456-426614174000",
  restaurant_name: "Mario's Pizzeria",
  google_maps_url: "https://maps.google.com/?cid=12345",
  food_items: ["Margherita Pizza", "Caesar Salad", "Tiramisu"],
  alcohol_items: ["Peroni Beer", "House Red Wine"],
  food_categories: ["Italian", "Pizza", "Pasta"],
  alcohol_categories: ["Beer", "Wine"],
}

const VAPI_PUBLIC_KEY = "775f68ba-ed29-46b6-b5ea-ae0a8dbb6738"
const VAPI_ASSISTANT_ID = "367afb1a-2a0d-446d-8886-1c1527a08f78"

const supabase =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    : null

const USE_DUMMY_DATA = true

export default function FeedbackPage({
  params,
}: {
  params: { order_id: string }
}) {
  const [orderId, setOrderId] = useState<string>("")
  const [pageState, setPageState] = useState<PageState>("landing")
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle")
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [reviewData, setReviewData] = useState<ReviewData>({
    star_rating: 0,
    review_text: "Thanks for starting! Please complete the full feedback session to create your Google review.",
  })
  const [isMuted, setIsMuted] = useState(false)
  const [voiceTimer, setVoiceTimer] = useState(0)
  const [copySuccess, setCopySuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [audioLevel, setAudioLevel] = useState(0)
  const [isGeneratingReview, setIsGeneratingReview] = useState(false)

  const vapiRef = useRef<Vapi | null>(null)
  const transcriptRef = useRef<string[]>([])

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params
      setOrderId(resolvedParams.order_id)
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (!orderId) return

    async function fetchOrderData() {
      console.log("[v0] Fetching order data for:", orderId)
      console.log("[v0] USE_DUMMY_DATA:", USE_DUMMY_DATA)
      console.log("[v0] Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("[v0] Supabase client exists:", !!supabase)

      if (USE_DUMMY_DATA) {
        setTimeout(() => {
          setOrderData(DUMMY_ORDER_DATA)
          setIsLoading(false)
        }, 500)
        return
      }

      try {
        if (!supabase) {
          throw new Error("Supabase client not initialized")
        }

        const { data, error } = await supabase
          .from("orders")
          .select(`
            *,
            restaurants (
              name
            )
          `)
          .eq("id", orderId)
          .single()

        if (error) {
          console.error("[v0] Supabase error:", error)
          throw error
        }

        console.log("[v0] Fetched order data:", data)

        const restaurantName = data.restaurants?.name || "Restaurant"

        setOrderData({
          order_id: data.id,
          restaurant_name: restaurantName,
          google_maps_url: data.google_maps_url || "#",
          food_items: Array.isArray(data.food_items) ? data.food_items : [],
          alcohol_items: Array.isArray(data.alcohol_items) ? data.alcohol_items : [],
          food_categories: Array.isArray(data.food_categories) ? data.food_categories : [],
          alcohol_categories: Array.isArray(data.alcohol_categories) ? data.alcohol_categories : [],
        })
        console.log("[v0] Set orderData with restaurant name:", restaurantName)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error fetching order:", error)
        setIsLoading(false)
      }
    }

    fetchOrderData()
  }, [orderId])

  useEffect(() => {
    const vapi = new Vapi(VAPI_PUBLIC_KEY)
    vapiRef.current = vapi

    vapi.on("call-start", () => {
      console.log("[v0] Vapi call started")
      setVoiceStatus("listening")
      transcriptRef.current = []
    })

    vapi.on("call-end", async () => {
      console.log("[v0] Vapi call ended - generating review from transcript")
      setVoiceStatus("idle")

      const fullTranscript = transcriptRef.current.join("\n")
      console.log("[v0] Full transcript:", fullTranscript)

      // Immediately transition to review page with loading state
      setPageState("review")
      setIsGeneratingReview(true)

      if (fullTranscript.trim().length === 0) {
        console.log("[v0] No transcript available, showing incomplete feedback screen")
        setReviewData({
          star_rating: 0,
          review_text:
            "The call ended before any feedback was collected. Please try again and share your thoughts about your experience!",
        })
        setIsGeneratingReview(false)
        return
      }

      // Only call API if we have a transcript
      try {
        const requestBody = {
          transcript: fullTranscript,
          order_id: orderData?.order_id,
          restaurant_name: orderData?.restaurant_name,
          food_items: orderData?.food_items,
        }
        console.log("[v0] Sending request body:", requestBody)

        const response = await fetch("/api/generate-review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        })

        if (response.ok) {
          const generatedReview = await response.json()
          console.log("[v0] Generated review:", generatedReview)
          setReviewData(generatedReview)
        } else {
          console.error("[v0] Failed to generate review")
          setReviewData({
            star_rating: 0,
            review_text:
              "Unable to generate a review at this time. Please try completing the full feedback conversation to create your Google review.",
          })
        }
      } catch (error) {
        console.error("[v0] Error generating review:", error)
        setReviewData({
          star_rating: 0,
          review_text:
            "Unable to generate a review at this time. Please try completing the full feedback conversation to create your Google review.",
        })
      } finally {
        setIsGeneratingReview(false)
      }
    })

    vapi.on("speech-start", () => {
      console.log("[v0] User started speaking")
      setVoiceStatus("listening")
      setAudioLevel(Math.random() * 80 + 20)
    })

    vapi.on("speech-end", () => {
      console.log("[v0] User stopped speaking")
      setVoiceStatus("thinking")
      setAudioLevel(10)
    })

    vapi.on("message", (message: any) => {
      console.log("[v0] Vapi message:", message)

      if (message.type === "transcript" && message.transcriptType === "final") {
        const speaker = message.role === "user" ? "User" : "Assistant"
        const text = message.transcript || ""
        transcriptRef.current.push(`${speaker}: ${text}`)
        console.log("[v0] Added to transcript:", `${speaker}: ${text}`)
        console.log("[v0] Current transcript length:", transcriptRef.current.length)
      }

      if (message.type === "speech-update") {
        if (message.status === "started" && message.role === "assistant") {
          setVoiceStatus("speaking")
        } else if (message.status === "stopped" && message.role === "assistant") {
          setVoiceStatus("listening")
        }
        setAudioLevel(Math.random() * 80 + 20)
      }
    })

    vapi.on("error", (error: any) => {
      // Suppress ejection errors - they're normal when call ends
      if (error?.error?.type !== "ejected" && error?.errorMsg !== "Meeting has ended") {
        console.error("[v0] Vapi error:", error)
      }
    })

    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop()
        vapiRef.current = null
      }
    }
  }, [orderData])

  useEffect(() => {
    const audioInterval = setInterval(() => {
      if (voiceStatus === "listening" || voiceStatus === "speaking") {
        setAudioLevel((prev) => Math.random() * 80 + 20)
      } else if (voiceStatus === "thinking") {
        setAudioLevel(10)
      } else {
        setAudioLevel(0)
      }
    }, 100)

    return () => clearInterval(audioInterval)
  }, [voiceStatus])

  useEffect(() => {
    if (pageState !== "voice" || !orderData || !vapiRef.current) return

    const startCall = async () => {
      const foodItemsList = orderData.food_items.join(", ")
      const alcoholItemsList =
        orderData.alcohol_items.length > 0 ? orderData.alcohol_items.join(", ") : "no alcoholic drinks"
      const allCategories = [...orderData.food_categories, ...orderData.alcohol_categories]
      const categoriesList = allCategories.length > 0 ? allCategories.join(", ") : "general dining"

      setVoiceStatus("connecting")

      try {
        await vapiRef.current!.start(VAPI_ASSISTANT_ID, {
          variableValues: {
            restaurant_name: orderData.restaurant_name,
            food_items: foodItemsList,
            alcohol_items: alcoholItemsList,
            categories: categoriesList,
          },
          firstMessage: `Hi! Thanks for dining at ${orderData.restaurant_name} today. I'm here to hear about your experience. This should only take about 2 minutes. Ready to get started?`,
        })
      } catch (error) {
        console.error("Failed to start call:", error)
        setVoiceStatus("idle")
        alert("Could not start voice chat. Please try again.")
      }
    }

    startCall()
  }, [pageState, orderData])

  const handleStartFeedback = () => {
    setPageState("voice")
    setVoiceTimer(0)
  }

  const handleEndChat = () => {
    console.log("[v0] User clicked End Chat button")
    if (vapiRef.current) {
      vapiRef.current.stop()
    }
    // Review generation and page transition happen automatically in the call-end event
  }

  const handleMuteToggle = () => {
    if (vapiRef.current) {
      if (isMuted) {
        vapiRef.current.setMuted(false)
      } else {
        vapiRef.current.setMuted(true)
      }
      setIsMuted(!isMuted)
    }
  }

  const handleCopyReview = async () => {
    try {
      await navigator.clipboard.writeText(reviewData.review_text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error("[v0] Failed to copy text:", err)
      alert("Failed to copy to clipboard")
    }
  }

  const handleOpenGoogleMaps = () => {
    window.open(orderData?.google_maps_url, "_blank")
  }

  const getStatusText = () => {
    switch (voiceStatus) {
      case "connecting":
        return "Connecting..."
      case "listening":
        return "I'm listening..."
      case "speaking":
        return "Speaking..."
      case "thinking":
        return "Processing..."
      default:
        return "Ready"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading your order...</div>
      </div>
    )
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-2">Order Not Found</h2>
          <p className="text-gray-600">This feedback link is invalid or expired.</p>
        </div>
      </div>
    )
  }

  if (!orderId) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
      {pageState === "landing" && (
        <div className="rounded-lg shadow-2xl p-8 max-w-md w-full bg-white animate-fadeIn border border-gray-100">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce-continuous">🌶️</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Hot Takes</h1>
            <p className="text-gray-600 mb-2">Thanks for dining at</p>
            <p className="text-2xl font-extrabold text-gray-900 mb-4">{orderData.restaurant_name}</p>
            <p className="text-gray-700 mb-8">Share your feedback in a quick voice chat!</p>

            {process.env.NODE_ENV === "development" && (
              <div className="mb-4">
                <button onClick={() => setShowDebug(!showDebug)} className="text-xs text-gray-500 underline">
                  {showDebug ? "Hide" : "Show"} Debug Info
                </button>
                {showDebug && (
                  <div className="mt-2 text-left text-xs bg-gray-100 p-3 rounded">
                    <p>
                      <strong>Order ID:</strong> {orderData.order_id}
                    </p>
                    <p>
                      <strong>Restaurant:</strong> {orderData.restaurant_name}
                    </p>
                    <p>
                      <strong>Food:</strong> {orderData.food_items.join(", ")}
                    </p>
                    <p>
                      <strong>Drinks:</strong>{" "}
                      {orderData.alcohol_items.length > 0 ? orderData.alcohol_items.join(", ") : "no alcoholic drinks"}
                    </p>
                    <p>
                      <strong>Food Categories:</strong> {orderData.food_categories.join(", ") || "none"}
                    </p>
                    <p>
                      <strong>Alcohol Categories:</strong> {orderData.alcohol_categories.join(", ") || "none"}
                    </p>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleStartFeedback}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 text-xl rounded-lg font-semibold transition-all hover:scale-105 active:scale-95 w-full mb-3"
            >
              🎤 Start Feedback
            </button>
            <p className="text-sm text-gray-500">Takes ~2 minutes</p>
          </div>
        </div>
      )}

      {pageState === "voice" && (
        <div className="rounded-lg shadow-xl p-8 max-w-md w-full bg-white animate-fadeIn">
          <div className="text-center">
            <div className="text-4xl mb-6">🌶️</div>

            <div className="h-32 mb-6 flex items-center justify-center gap-1">
              {[...Array(7)].map((_, i) => {
                const baseHeight = 8
                const maxHeight = 80
                const height =
                  voiceStatus === "connecting" || voiceStatus === "idle"
                    ? baseHeight
                    : baseHeight + Math.sin((audioLevel + i * 30) / 15) * ((maxHeight - baseHeight) / 2)

                return (
                  <div
                    key={i}
                    className="w-3 bg-red-500 rounded-full transition-all duration-150 ease-out"
                    style={{
                      height: `${height}px`,
                      opacity: voiceStatus === "connecting" ? 0.3 : voiceStatus === "idle" ? 0.3 : 1,
                    }}
                  />
                )
              })}
            </div>

            <p className="text-xl mb-6 font-medium text-gray-900">{getStatusText()}</p>

            <div className="space-y-3 mb-6">
              <button
                onClick={handleEndChat}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] active:scale-95"
              >
                End Chat
              </button>
              <button
                onClick={handleMuteToggle}
                className={`w-full border-2 px-6 py-2 rounded-lg font-medium transition-all ${
                  isMuted
                    ? "border-red-500 text-red-500 bg-red-50 hover:bg-red-100"
                    : "border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700"
                }`}
              >
                {isMuted ? "🔇 Unmute" : "🔇 Mute"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pageState === "review" && (
        <div className="rounded-lg shadow-xl p-8 max-w-md w-full bg-white animate-fadeIn">
          <div className="text-center">
            {isGeneratingReview ? (
              <>
                <div className="text-4xl mb-2">✨</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Generating your review...</h2>
                <div className="animate-pulse bg-gray-200 h-32 rounded-lg mb-6"></div>
              </>
            ) : (
              <>
                {reviewData.star_rating === 0 ? (
                  <>
                    <div className="text-4xl mb-2">🤔</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback Incomplete</h2>
                    <div className="bg-yellow-50 border-2 border-yellow-200 p-6 rounded-lg mb-6">
                      <p className="text-gray-800 leading-relaxed">{reviewData.review_text}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPageState("landing")
                        setReviewData({
                          star_rating: 0,
                          review_text:
                            "Thanks for starting! Please complete the full feedback session to create your Google review.",
                        })
                        setIsGeneratingReview(false)
                        transcriptRef.current = []
                      }}
                      className="bg-red-500 hover:bg-red-600 text-white w-full py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] active:scale-95"
                    >
                      🔄 Try Again
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-4xl mb-2">✅</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Thanks for your feedback!</h2>

                    <div className="text-3xl text-center mb-4">{"⭐".repeat(reviewData.star_rating)}</div>

                    <div className="bg-gray-50 p-6 rounded-lg mb-6 text-left">
                      <p className="text-gray-800 leading-relaxed">{reviewData.review_text}</p>
                    </div>

                    <div className="space-y-3">
                      <button
                        onClick={handleCopyReview}
                        className="bg-gray-800 hover:bg-gray-900 text-white w-full py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] active:scale-95"
                      >
                        {copySuccess ? "✅ Copied!" : "📋 Copy Review"}
                      </button>
                      <button
                        onClick={handleOpenGoogleMaps}
                        className="bg-red-500 hover:bg-red-600 text-white w-full py-3 rounded-lg font-semibold transition-all hover:scale-[1.02] active:scale-95"
                      >
                        🗺️ Open Google Maps
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {copySuccess && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
          Copied to clipboard!
        </div>
      )}
    </div>
  )
}
