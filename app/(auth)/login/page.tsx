"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Cek email Anda dan klik link konfirmasi.")
      } else if (error.message === "Invalid login credentials") {
        setError("Email atau password salah.")
      } else {
        setError(error.message)
      }
    } else {
      router.push("/dashboard")
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="w-full animate-fade-in" style={{ maxWidth: 360 }}>
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 glow-accent"
          style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)" }}>
          <span className="text-2xl font-bold" style={{ color: "#0f0f0f", fontFamily: "'Space Mono', monospace" }}>1%</span>
        </div>
        <h1 className="text-2xl font-bold text-gradient" style={{ fontFamily: "'Space Mono', monospace" }}>
          1% Daily
        </h1>
        <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.25rem" }}>
          Tumbuh 1% setiap hari
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#888", marginBottom: "0.4rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
            EMAIL
          </label>
          <input
            type="email"
            className="input-field"
            placeholder="kamu@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#888", marginBottom: "0.4rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
            PASSWORD
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{ paddingRight: "3rem" }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{ position: "absolute", right: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "#888", background: "none", border: "none", cursor: "pointer", padding: 0 }}
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
          {loading ? <Loader2 size={18} className="animate-spin" style={{ marginRight: "0.5rem" }} /> : null}
          {loading ? "Masuk..." : "Masuk"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#888", fontSize: "0.875rem" }}>
        Belum punya akun?{" "}
        <Link href="/register" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          Daftar sekarang
        </Link>
      </p>
    </div>
  )
}
