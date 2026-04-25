import webpush from "web-push"
import { createClient } from "@supabase/supabase-js"

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(req: Request) {
  try {
    const { title, body } = await req.json()

    if (!title || !body) {
      return Response.json(
        { error: "Title and body are required" },
        { status: 400 }
      )
    }

    // Ambil semua subscription dari Supabase
    const { data: subscriptions, error: fetchError } = await supabase
      .from("push_subscriptions")
      .select("*")

    if (fetchError) {
      console.error("Fetch subscriptions error:", fetchError)
      return Response.json(
        { error: fetchError.message },
        { status: 500 }
      )
    }

    if (!subscriptions || subscriptions.length === 0) {
      return Response.json({ success: true, sent: 0 })
    }

    // Kirim ke semua device
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify({ title, body })
        )
      )
    )

    // Hapus subscription yang expired/invalid
    const failed = results
      .map((r, i) => (r.status === "rejected" ? subscriptions[i].endpoint : null))
      .filter(Boolean) as string[]

    if (failed.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("endpoint", failed)
    }

    const sent = results.filter((r) => r.status === "fulfilled").length

    return Response.json({ success: true, sent })
  } catch (error) {
    console.error("Send notification error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
