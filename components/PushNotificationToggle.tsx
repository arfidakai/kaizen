"use client"

import { useState, useEffect } from "react"
import { Bell, BellOff, Loader2 } from "lucide-react"
import { subscribeToPush, unsubscribeFromPush, isSubscribed } from "@/lib/subscribePush"
import { useNotification } from "@/context/NotificationContext"

export default function PushNotificationToggle() {
  const { addNotification } = useNotification()
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkSubscription()
  }, [])

  async function checkSubscription() {
    const isSubbed = await isSubscribed()
    setSubscribed(isSubbed)
    setLoading(false)
  }

  async function handleToggle() {
    setLoading(true)
    try {
      if (subscribed) {
        await unsubscribeFromPush()
        setSubscribed(false)
        addNotification("Push notifications dimatikan", "info", 2000)
      } else {
        const success = await subscribeToPush()
        if (success) {
          setSubscribed(true)
          addNotification("Push notifications diaktifkan! ✨", "success", 2000)
        } else {
          addNotification("Gagal mengaktifkan push notifications", "error", 3000)
        }
      }
    } catch (error) {
      console.error(error)
      addNotification("Terjadi kesalahan", "error", 3000)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "0.5rem",
          border: "1px solid #2e2e2e",
          background: "#1c1c1c",
          color: "#888",
          fontSize: "0.875rem",
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          cursor: "not-allowed",
        }}
      >
        <Loader2 size={16} className="animate-spin" />
        Loading...
      </button>
    )
  }

  return (
    <button
      onClick={handleToggle}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "0.5rem",
        border: subscribed ? "1px solid var(--accent)" : "1px solid #2e2e2e",
        background: subscribed ? "var(--accent-dim)" : "transparent",
        color: subscribed ? "var(--accent)" : "#888",
        fontSize: "0.875rem",
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--accent)"
        if (!subscribed) e.currentTarget.style.background = "var(--accent-dim)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = subscribed ? "var(--accent)" : "#2e2e2e"
        if (!subscribed) e.currentTarget.style.background = "transparent"
      }}
    >
      {subscribed ? <Bell size={16} /> : <BellOff size={16} />}
      {subscribed ? "Notif aktif" : "Aktifkan notif"}
    </button>
  )
}
