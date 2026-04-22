"use client"

import { useEffect, useState } from "react"
import { Clock, X } from "lucide-react"

interface ReminderSettingsModalProps {
  isOpen: boolean
  habitName: string
  currentTime: string | null
  onSave: (time: string) => void
  onClose: () => void
  onDelete?: () => void
}

export default function ReminderSettingsModal({
  isOpen,
  habitName,
  currentTime,
  onSave,
  onClose,
  onDelete,
}: ReminderSettingsModalProps) {
  const [time, setTime] = useState(currentTime || "09:00")
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(isOpen)
    if (isOpen && currentTime) {
      setTime(currentTime)
    }
  }, [isOpen, currentTime])

  const handleSave = () => {
    onSave(time)
    setVisible(false)
  }

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
        onClick={onClose}
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
          onClick={onClose}
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

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              marginBottom: "1.5rem",
            }}
          >
            <Clock size={24} color="#60a5fa" />
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#f5f5f5" }}>
              Set Reminder
            </h2>
          </div>

          <p style={{ color: "#888", fontSize: "0.875rem", marginBottom: "1rem" }}>
            Notifikasi akan muncul setiap hari pada jam yang ditentukan jika habit belum selesai.
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", fontSize: "0.75rem", color: "#888", marginBottom: "0.5rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
              JAM REMINDER
            </label>
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "#242424",
                border: "1px solid #3e3e3e",
                borderRadius: "0.5rem",
                color: "#f5f5f5",
                fontSize: "1rem",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            />
            <p style={{ color: "#666", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Contoh: 09:00 = jam 9 pagi
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexDirection: "column" }}>
            <button
              onClick={handleSave}
              style={{
                width: "100%",
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
              Simpan Reminder
            </button>

            {onDelete && (
              <button
                onClick={onDelete}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  background: "#2e2e2e",
                  border: "1px solid #3e3e3e",
                  borderRadius: "0.5rem",
                  color: "#ef4444",
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
                Hapus Reminder
              </button>
            )}

            <button
              onClick={onClose}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                background: "transparent",
                border: "1px solid #3e3e3e",
                borderRadius: "0.5rem",
                color: "#f5f5f5",
                fontSize: "0.875rem",
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "#2e2e2e"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              Batal
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
