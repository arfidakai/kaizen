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
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
      ),
    })

    // Kirim subscription ke backend
    const response = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(subscription),
    })

    if (!response.ok) {
      throw new Error("Failed to subscribe on backend")
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
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch (error) {
    console.error("Check subscription error:", error)
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
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
    }

    return true
  } catch (error) {
    console.error("Unsubscribe error:", error)
    return false
  }
}
