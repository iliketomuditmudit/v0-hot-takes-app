import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold text-gray-900">Hot Takes Voice Feedback</h1>
        <p className="text-gray-600 max-w-md">Test the voice feedback system for order reviews</p>
        <Link href="/feedback/12e217c7-d5ba-451e-b378-fe91fe1002b3">
          <Button size="lg" className="bg-red-600 hover:bg-red-700">
            Test Feedback Page
          </Button>
        </Link>
      </div>
    </main>
  )
}
