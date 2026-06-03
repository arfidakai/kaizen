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

    // Ensure subsequent DB requests are executed with the user's JWT so
    // row-level-security policies that check auth.uid / user_id pass.
    // This sets the Authorization header on the Supabase client for this request.
    try {
      // supabase.auth.setAuth is available on the client and will attach the
      // provided token to following requests.
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line
      supabase.auth.setAuth(token!)
    } catch (e) {
      // If setAuth isn't available for some reason, continue — the upsert will
      // likely fail due to RLS and the error will be returned below.
      console.warn("Failed to set auth on supabase client", e)
    }

    // Use Supabase REST endpoint with the user's JWT in Authorization header
    // so that row-level security policies evaluate auth.uid() correctly.
    const restUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/push_subscriptions?on_conflict=endpoint`
    const restRes = await fetch(restUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Provide the user's JWT so RLS sees auth.uid()
        Authorization: `Bearer ${token}`,
        // Provide anon key as apikey header (required by Supabase REST)
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        // Upsert (merge duplicates) and return representation for debugging
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify({
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      }),
    })

    if (!restRes.ok) {
      const text = await restRes.text()
      console.error("Subscribe REST error:", restRes.status, text)
      return Response.json({ error: `REST upsert failed: ${restRes.status}` }, { status: 500 })
    }

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ error: "Server error" }, { status: 500 })
  }
}
