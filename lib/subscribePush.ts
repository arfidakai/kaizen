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
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
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

    // Register service worker
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    })

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })

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
    console.error("Subscribe to push error:", error)
    return false
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
