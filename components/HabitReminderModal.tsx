"use client"

import { useEffect, useState } from "react"
import { Bell, X } from "lucide-react"

interface HabitReminderModalProps {
  isOpen: boolean
  habitName: string
  habitIcon: string
  onComplete: () => void
  onDismiss: () => void
}

export default function HabitReminderModal({
  isOpen,
  habitName,
  habitIcon,
  onComplete,
  onDismiss,
}: HabitReminderModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isOpen)
  }, [isOpen])

  if (!visible) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 40,
          animation: "fadeIn 0.2s ease-out",
        }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "#1c1c1c",
          border: "1px solid #2e2e2e",
          borderRadius: "1rem",
          padding: "2rem",
          maxWidth: "400px",
          width: "90%",
          zIndex: 50,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
          animation: "slideIn 0.3s ease-out",
        }}
      >
        <button
          onClick={onDismiss}
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#888",
            padding: "0.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
            }}
          >
            <Bell size={24} color="#60a5fa" />
            <span style={{ fontSize: "1.5rem" }}>{habitIcon}</span>
          </div>

          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "0.5rem", color: "#f5f5f5" }}>
            Time for {habitName}!
          </h2>

          <p style={{ color: "#888", marginBottom: "2rem", fontSize: "0.875rem" }}>
            Don't break your streak. Complete this habit now.
          </p>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={onDismiss}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                background: "#2e2e2e",
                border: "1px solid #3e3e3e",
                borderRadius: "0.5rem",
                color: "#f5f5f5",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#3e3e3e"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#2e2e2e"
              }}
            >
              Later
            </button>

            <button
              onClick={onComplete}
              style={{
                flex: 1,
                padding: "0.75rem 1rem",
                background: "var(--accent)",
                border: "1px solid var(--accent-border)",
                borderRadius: "0.5rem",
                color: "#0f0f0f",
                fontSize: "0.875rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.opacity = "0.9"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.opacity = "1"
              }}
            >
              Complete Now
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translate(-50%, -48%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </>
  )
}
