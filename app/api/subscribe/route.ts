import { createClient } from "@supabase/supabase-js"
import { NextRequest } from "next/server"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const subscription = await req.json()

    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    const { data: { user }, error: authError } = await supabase.auth.getUser(token!)
    if (authError || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }, {
        onConflict: "endpoint"
      })

    if (error) {
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}
