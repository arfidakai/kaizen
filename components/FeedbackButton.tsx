"use client"

import { useState } from "react"
import { MessageCircle, X, Send, Loader2, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase"
import { useTheme } from "@/context/ThemeContext"

type State = "idle" | "open" | "sending" | "done"

export default function FeedbackButton() {
  const { theme } = useTheme()
  const [state, setState] = useState<State>("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit() {
    if (!message.trim()) return
    setState("sending")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from("feedback").insert({
      user_id: user?.id ?? null,
      message: message.trim(),
    })

    setState("done")
    setMessage("")
    setTimeout(() => setState("idle"), 2000)
  }

  function handleClose() {
    setState("idle")
    setMessage("")
  }

  return (
    <>
      {/* Floating trigger button */}
      {state === "idle" && (
        <button
          onClick={() => setState("open")}
          aria-label="Beri masukan"
          style={{
            position: "fixed",
            bottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            right: "1rem",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: theme.accent,
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 4px 16px ${theme.accent}55`,
            zIndex: 40,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = "scale(1.08)"
            e.currentTarget.style.boxShadow = `0 6px 20px ${theme.accent}77`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = "scale(1)"
            e.currentTarget.style.boxShadow = `0 4px 16px ${theme.accent}55`
          }}
        >
          <MessageCircle size={20} color="#ffffff" strokeWidth={2} />
        </button>
      )}

      {/* Bottom sheet modal */}
      {(state === "open" || state === "sending" || state === "done") && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onClick={state !== "sending" ? handleClose : undefined}
        >
          <div
            className="animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 390,
              background: theme.card,
              borderTopLeftRadius: "1.5rem",
              borderTopRightRadius: "1.5rem",
              padding: "1.5rem",
              border: `1px solid ${theme.border}`,
              paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))",
              transition: "background-color 0.2s ease",
            }}
          >
            {state === "done" ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}>
                <CheckCircle2 size={36} style={{ color: theme.accent }} />
                <p style={{ fontWeight: 700, fontSize: "1rem", color: theme.textPrimary }}>Terima kasih!</p>
                <p style={{ fontSize: "0.85rem", color: theme.textSecondary, textAlign: "center" }}>
                  Masukanmu sudah kami terima.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
                  <div>
                    <h2 style={{ fontWeight: 700, fontSize: "1rem", color: theme.textPrimary }}>Masukan & Pesan</h2>
                    <p style={{ fontSize: "0.75rem", color: theme.textSecondary, marginTop: "0.2rem" }}>
                      Fitur apa yang ingin kamu lihat?
                    </p>
                  </div>
                  <button
                    onClick={handleClose}
                    style={{ background: "none", border: "none", cursor: "pointer", color: theme.textSecondary, padding: "0.25rem" }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <textarea
                  placeholder="Tulis ide, saran, atau bug yang kamu temukan..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  maxLength={500}
                  rows={4}
                  style={{
                    width: "100%",
                    background: theme.inputBg,
                    border: `1px solid ${theme.border}`,
                    borderRadius: "0.75rem",
                    color: theme.textPrimary,
                    padding: "0.75rem 1rem",
                    fontSize: "0.9rem",
                    fontFamily: "'Sora', sans-serif",
                    resize: "none",
                    outline: "none",
                    transition: "border-color 0.2s ease",
                    lineHeight: 1.6,
                  }}
                  onFocus={e => { e.currentTarget.style.borderColor = theme.accent }}
                  onBlur={e => { e.currentTarget.style.borderColor = theme.border }}
                />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.5rem" }}>
                  <span style={{ fontSize: "0.7rem", color: theme.textMuted, fontFamily: "'Space Mono', monospace" }}>
                    {message.length}/500
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || state === "sending"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      padding: "0.6rem 1.2rem",
                      borderRadius: "0.75rem",
                      border: "none",
                      cursor: message.trim() ? "pointer" : "not-allowed",
                      background: message.trim() ? theme.accent : theme.border,
                      color: message.trim() ? "#ffffff" : theme.textMuted,
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      transition: "all 0.2s ease",
                      opacity: state === "sending" ? 0.7 : 1,
                    }}
                  >
                    {state === "sending"
                      ? <><Loader2 size={14} className="animate-spin" />Mengirim...</>
                      : <><Send size={14} />Kirim</>
                    }
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
