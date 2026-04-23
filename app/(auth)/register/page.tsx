"use client"

export const dynamic = "force-dynamic"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase"
import { KaizenIcon } from "@/components/KaizenLogo"
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    if (password.length < 6) {
      setError("Password minimal 6 karakter.")
      return
    }
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    })

    if (error) {
      setError(error.message)
    } else if (data.user) {
      await supabase.from("users").update({ username }).eq("id", data.user.id)
      setSuccess(true)
      setTimeout(() => router.push("/dashboard"), 1500)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="w-full text-center animate-scale-in" style={{ maxWidth: 360 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <CheckCircle2 size={56} style={{ color: "var(--accent)" }} />
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--accent)" }}>Akun dibuat!</h2>
          <p style={{ color: "#888", fontSize: "0.875rem" }}>Mengarahkan ke dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full animate-fade-in" style={{ maxWidth: 360 }}>
      {/* Logo */}
      <div className="text-center mb-8">
        <KaizenIcon size={56} />
        <h1 className="text-2xl font-bold" style={{ marginTop: "1rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Mulai perjalananmu
        </h1>
        <p style={{ color: "#888", fontSize: "0.85rem", marginTop: "0.25rem", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Daftar gratis, tumbuh setiap hari
        </p>
      </div>

      <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div>
          <label style={{ display: "block", fontSize: "0.8rem", color: "#888", marginBottom: "0.4rem", fontFamily: "'Space Mono', monospace", letterSpacing: "0.05em" }}>
            USERNAME
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="nama panggilanmu"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={30}
            autoComplete="username"
          />
        </div>

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
              placeholder="min. 6 karakter"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
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
          {password.length > 0 && (
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "4px" }}>
              {[1, 2, 3].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: password.length >= i * 4 ? "var(--accent)" : "#2e2e2e",
                  transition: "background 0.2s"
                }} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "0.75rem", padding: "0.75rem 1rem", color: "#f87171", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "0.5rem" }}>
          {loading ? <Loader2 size={18} className="animate-spin" style={{ marginRight: "0.5rem" }} /> : null}
          {loading ? "Membuat akun..." : "Daftar Sekarang"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#888", fontSize: "0.875rem" }}>
        Sudah punya akun?{" "}
        <Link href="/login" style={{ color: "var(--accent)", fontWeight: 600, textDecoration: "none" }}>
          Masuk
        </Link>
      </p>
    </div>
  )
}
