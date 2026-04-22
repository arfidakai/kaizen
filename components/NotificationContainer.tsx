"use client"

import { useNotification, NotificationType } from "@/context/NotificationContext"
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from "lucide-react"

function getNotificationColors(type: NotificationType) {
  switch (type) {
    case "success":
      return { bg: "#1a5f3f", border: "#2d9970", text: "#6ee7b7" }
    case "error":
      return { bg: "#5f1a1a", border: "#9f2d2d", text: "#f87171" }
    case "warning":
      return { bg: "#5f4a1a", border: "#9f7a2d", text: "#fbbf24" }
    case "info":
    default:
      return { bg: "#1a3f5f", border: "#2d6f9f", text: "#60a5fa" }
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "success":
      return <CheckCircle size={18} />
    case "error":
      return <AlertCircle size={18} />
    case "warning":
      return <AlertTriangle size={18} />
    case "info":
    default:
      return <Info size={18} />
  }
}

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification()

  return (
    <div
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 50,
        pointerEvents: "none",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        maxWidth: "400px",
      }}
    >
      {notifications.map(notification => {
        const colors = getNotificationColors(notification.type)
        return (
          <div
            key={notification.id}
            style={{
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              borderRadius: "0.5rem",
              padding: "1rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.75rem",
              color: colors.text,
              fontSize: "0.875rem",
              fontWeight: 500,
              pointerEvents: "all",
              animation: "slideInUp 0.3s ease-out",
            }}
          >
            <span style={{ marginTop: "0.125rem", flexShrink: 0 }}>
              {getNotificationIcon(notification.type)}
            </span>
            <span style={{ flex: 1 }}>{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "inherit",
                padding: "0.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(1rem);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
