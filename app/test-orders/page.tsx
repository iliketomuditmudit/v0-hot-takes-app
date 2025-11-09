import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Order {
  id: string
  restaurant_id: string
  food_items: string[]
  alcohol_items: string[]
  created_at: string
}

export default async function TestOrdersPage() {
  const supabase = await createClient()

  console.log("[v0] Fetching orders from Supabase...")

  const { data: orders, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false })

  console.log("[v0] Orders fetched:", orders)
  console.log("[v0] Error:", error)

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Error Loading Orders</h1>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <p className="text-red-700">{error.message}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Orders Database Test</h1>
          <p className="text-gray-600">
            Total Orders: <span className="font-semibold text-orange-600">{orders?.length || 0}</span>
          </p>
        </div>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-gray-500 text-center">No orders found in the database.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {orders.map((order: Order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span className="text-orange-600 font-mono text-sm truncate">Order #{order.id.slice(0, 8)}...</span>
                    <Badge variant="outline" className="ml-2">
                      {new Date(order.created_at).toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Restaurant ID:</h3>
                    <p className="text-xs font-mono text-gray-600 break-all">{order.restaurant_id}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Food Items ({order.food_items?.length || 0}):
                    </h3>
                    {order.food_items && order.food_items.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {order.food_items.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-green-100 text-green-800">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No food items</p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Alcohol Items ({order.alcohol_items?.length || 0}):
                    </h3>
                    {order.alcohol_items && order.alcohol_items.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {order.alcohol_items.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="bg-purple-100 text-purple-800">
                            {item}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400">No alcohol items</p>
                    )}
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">Created: {new Date(order.created_at).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
