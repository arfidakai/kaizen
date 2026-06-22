"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { KaizenIcon } from "@/components/KaizenLogo"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false) 
  const [error, setError] = useState("")

  // Fungsi Login / Register pakai Google
  async function handleGoogleLogin() {
    setError("")
    setGoogleLoading(true)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

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
        <KaizenIcon size={56} />
        <h1 className="text-2xl font-bold" style={{ marginTop: "1rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          kaizen
        </h1>
        <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.25rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          1% Better Every Day
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

        <button type="submit" className="btn-primary" disabled={loading || googleLoading} style={{ marginTop: "0.5rem" }}>
          {loading ? <Loader2 size={18} className="animate-spin" style={{ marginRight: "0.5rem" }} /> : null}
          {loading ? "Masuk..." : "Masuk"}
        </button>

        {/* --- PEMBATAS VISUAL DAN TOMBOL GOOGLE OAUTH --- */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "0.5rem 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#2e2e2e" }} />
          <span style={{ fontSize: "0.75rem", color: "#666", fontFamily: "'Space Mono', monospace" }}>ATAU</span>
          <div style={{ flex: 1, height: "1px", background: "#2e2e2e" }} />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading || googleLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem",
            background: "#242424",
            border: "1px solid #2e2e2e",
            borderRadius: "0.75rem",
            color: "#f5f5f5",
            fontSize: "0.875rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s"
          }}
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.33 0 3.353 2.655 1.41 6.527l3.856 3.238z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.796-.073-1.56-.206-2.291H12v4.342h6.443a5.513 5.513 0 0 1-2.392 3.614l3.738 2.897c2.186-2.014 3.449-4.978 3.449-8.562z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A7.054 7.054 0 0 1 4.91 12c0-.791.137-1.55.356-2.235L1.41 6.527A11.916 11.916 0 0 0 0 12c0 1.98.483 3.85 1.325 5.517l3.941-3.282z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.956-1.08 7.942-2.916l-3.738-2.897c-1.036.696-2.364 1.105-4.204 1.105-3.235 0-5.975-2.186-6.958-5.132l-3.94 3.282C3.125 21.218 7.15 24 12 24z"
              />
            </svg>
          )}
          {googleLoading ? "Menghubungkan..." : "Lanjutkan dengan Google"}
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