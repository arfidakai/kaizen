import { createClient } from "@/lib/supabase"

/**
 * Subscribe untuk push notifications
 * Harus dipanggil setelah user memberikan permission
 */
export async function subscribeToPush() {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service Workers tidak didukung di browser ini")
    return false
  }

  if (!("PushManager" in window)) {
    console.warn("Push Notifications tidak didukung di browser ini")
    return false
  }

  // Validate VAPID key
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
  if (!vapidKey) {
    console.error("NEXT_PUBLIC_VAPID_PUBLIC_KEY tidak di-set")
    return false
  }

  try {
    // Check notification permission
    if (Notification.permission === "denied") {
      console.warn("User telah menolak push notifications")
      return false
    }

    // Request permission jika belum
    if (Notification.permission !== "granted") {
      const permission = await Notification.requestPermission()
      if (permission !== "granted") {
        console.warn("User menolak push notification permission")
        return false
      }
    }

    // Register service worker dan ambil registration yang aktif
    console.log("[Push] Registering service worker...")
    await navigator.serviceWorker.register("/sw.js", { scope: "/" })
    console.log("[Push] Waiting for service worker ready...")
    const registration = await navigator.serviceWorker.ready
    
    // Wait untuk service worker fully active dengan timeout 3 detik
    try {
      await Promise.race([
        new Promise<void>(resolve => {
          if (navigator.serviceWorker.controller) {
            resolve()
          } else {
            navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true })
          }
        }),
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error("Controller timeout")), 3000))
      ])
      console.log("[Push] Service worker controller is active")
    } catch (controllerErr) {
      console.warn("[Push] Service worker controller wait timeout or failed, proceeding anyway:", controllerErr)
    }

    const applicationServerKey = urlBase64ToUint8Array(vapidKey)
    console.log("[Push] VAPID key converted, attempting subscribe...")

    // Reuse subscription yang sudah ada kalau browser sudah pernah subscribe
    let subscription = await registration.pushManager.getSubscription()
    console.log("[Push] Existing subscription check:", subscription ? "Found" : "Not found")

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        })
        console.log("[Push] Subscribe success")
      } 
      catch (subscribeError) {
        console.error("[Push] First subscribe error:", subscribeError)
        throw subscribeError
      }
    }

    // Ambil session untuk Authorization header
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()

    // Kirim subscription ke backend
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Backend error: ${response.status} - ${errorData.error || response.statusText}`)
    }

    return true
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        console.error("[Push] AbortError - push service error. Cek: 1) Browser modern (Chrome 50+, Firefox 48+), 2) HTTPS atau localhost:3000, 3) Notification permission granted, 4) Browser push service (FCM/Mozilla Push).")
      } else {
        console.error("[Push] Subscribe error:", error.message)
      }
    } else {
      console.error("[Push] Subscribe error:", error)
    }
    return false
  }
}

async function resetPushState() {
  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(
      registrations.map(async registration => {
        try {
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            await subscription.unsubscribe()
          }
        } catch {
          // Ignore cleanup errors and continue unregistering.
        }

        try {
          await registration.unregister()
        } catch {
          // Ignore cleanup errors and continue.
        }
      })
    )
  } catch {
    // Ignore cleanup errors.
  }
}

/**
 * Convert VAPID key dari base64 ke Uint8Array
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

/**
 * Check apakah sudah subscribe
 */
export async function isSubscribed() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false
  }

  try {
    
    const registrations = await navigator.serviceWorker.getRegistrations()
    if (!registrations.length) return false

    const subscription = await registrations[0].pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}

/**
 * Unsubscribe dari push notifications
 */
export async function unsubscribeFromPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return false
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    if (!registrations.length) return true

    const subscription = await registrations[0].pushManager.getSubscription()
    if (subscription) await subscription.unsubscribe()

    return true
  } catch {
    return false
  }
}
