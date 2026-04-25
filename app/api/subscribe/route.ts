import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const subscription = await req.json()
    const { endpoint, keys } = subscription

    if (!endpoint || !keys) {
      return Response.json({ error: "Invalid subscription" }, { status: 400 })
    }

    // Get authenticated user from request
    const authHeader = req.headers.get("authorization")
    let userId: string | null = null

    // Try to get user from auth header if available
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7)
      const { data: { user }, error: authError } = await supabase.auth.getUser(token)
      
      if (user) {
        userId = user.id
      }
    }

    // If no auth header, still save subscription (for guest users)
    // But ideally you'd require authentication

    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        user_id: userId,
      },
      { onConflict: "endpoint" }
    )

    if (error) {
      console.error("Supabase error:", error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Subscribe error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
