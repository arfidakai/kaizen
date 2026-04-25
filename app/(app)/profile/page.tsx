"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import ThemePicker from "@/components/ThemePicker"
import PushNotificationToggle from "@/components/PushNotificationToggle"
import {
  Loader2, LogOut, Edit3, Bell, ChevronRight, CheckCircle2, Flame, Calendar, X, Save
} from "lucide-react"

interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  email: string
}

interface Stats {
  totalActive: number
  currentStreak: number
  bestStreak: number
  totalHabits: number
}

const AVATARS = ["🧑","👩","👨","🧑‍💻","👩‍💻","🦊","🐼","🐨","🦁","🐸","🌸","⭐","🚀","🌿","🎯"]

export default function ProfilePage() {
  const supabase = createClient()
  const router = useRouter()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats>({ totalActive: 0, currentStreak: 0, bestStreak: 0, totalHabits: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editUsername, setEditUsername] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [saving, setSaving] = useState(false)

  const fetchProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [profileRes, streakRes, activeRes, habitsRes] = await Promise.all([
      supabase.from("users").select("id, username, avatar_url, created_at").eq("id", user.id).single(),
      supabase.from("streaks").select("current_streak, best_streak").eq("user_id", user.id).single(),
      supabase.from("habit_logs").select("date", { count: "estimated" }).eq("user_id", user.id).eq("completed", true),
      supabase.from("habits").select("id", { count: "estimated" }).eq("user_id", user.id),
    ])

    const p = profileRes.data
    if (p) {
      setProfile({ ...p, email: user.email || "" })
      setEditUsername(p.username || "")
      setEditAvatar(p.avatar_url || "🧑")
    }

    const uniqueDays = new Set(activeRes.data?.map(l => l.date) || []).size
    setStats({
      totalActive: uniqueDays,
      currentStreak: streakRes.data?.current_streak || 0,
      bestStreak: streakRes.data?.best_streak || 0,
      totalHabits: habitsRes.count || 0,
    })
    setLoading(false)
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  async function handleSave() {
    if (!profile) return
    setSaving(true)
    await supabase.from("users").update({
      username: editUsername.trim() || profile.username,
      avatar_url: editAvatar,
    }).eq("id", profile.id)
    setSaving(false)
    setEditing(false)
    await fetchProfile()
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
        <Loader2 size={32} style={{ color: "var(--accent)" }} className="animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

      {/* Avatar + Name */}
      <div style={{ textAlign: "center", paddingTop: "0.5rem" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "var(--accent-soft)",
          border: "2px solid var(--accent-border)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "2.5rem", margin: "0 auto 0.75rem",
        }}>
          {profile?.avatar_url || "🧑"}
        </div>
        <h1 style={{ fontSize: "1.3rem", fontWeight: 700 }}>
          {profile?.username || profile?.email?.split("@")[0] || "User"}
        </h1>
        <p style={{ color: "#888", fontSize: "0.8rem", fontFamily: "'Space Mono', monospace", marginTop: "0.2rem" }}>
          {profile?.email}
        </p>
        <p style={{ color: "#555", fontSize: "0.75rem", marginTop: "0.2rem" }}>
          Bergabung {profile?.created_at ? formatDate(profile.created_at, "MMMM yyyy") : "—"}
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        {[
          { icon: <Calendar size={14} style={{ color: "var(--accent)" }} />, value: stats.totalActive, label: "Aktif" },
          { icon: <Flame size={14} color="#ff7043" />, value: stats.currentStreak, label: "Streak" },
          { icon: <CheckCircle2 size={14} color="#64b5f6" />, value: stats.totalHabits, label: "Habit" },
        ].map((s, i) => (
          <div key={i} className="card" style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "0.2rem", padding: "0.75rem 0.5rem",
          }}>
            {s.icon}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.25rem", fontWeight: 700 }}>{s.value}</span>
            <span style={{ fontSize: "0.65rem", color: "#666", fontFamily: "'Space Mono', monospace" }}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Progress bar: best streak */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: "#ccc" }}>Best Streak</span>
          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.8rem", color: "var(--accent)" }}>
            {stats.bestStreak} hari
          </span>
        </div>
        <div style={{ height: 6, background: "#2e2e2e", borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${Math.min(100, (stats.currentStreak / Math.max(stats.bestStreak, 1)) * 100)}%`,
            background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
            borderRadius: 3, transition: "width 1s ease",
          }} />
        </div>
        <p style={{ fontSize: "0.7rem", color: "#555", marginTop: "0.35rem" }}>
          Streak sekarang: {stats.currentStreak} hari
        </p>
      </div>

      {/* Theme Picker */}
      <div>
        <p className="section-title">TEMA WARNA</p>
        <ThemePicker />
      </div>

      {/* Menu */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p className="section-title">PENGATURAN</p>

        <MenuButton
          icon={<Edit3 size={18} style={{ color: "var(--accent)" }} />}
          label="Edit Profil"
          onClick={() => setEditing(true)}
        />
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Bell size={18} color="#64b5f6" />
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>Push Notifications</span>
          </div>
          <PushNotificationToggle />
        </div>
        <MenuButton
          icon={<LogOut size={18} color="#ef4444" />}
          label="Keluar"
          onClick={handleLogout}
          danger
        />
      </div>

      <p style={{ textAlign: "center", color: "#333", fontSize: "0.7rem", fontFamily: "'Space Mono', monospace", paddingTop: "0.5rem" }}>
        1% Daily v1.0.0
      </p>

      {/* Edit Modal */}
      {editing && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "flex-end", justifyContent: "center",
        }} onClick={() => setEditing(false)}>
          <div
            className="animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 390,
              background: "#1c1c1c",
              borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem",
              padding: "1.5rem",
              border: "1px solid #2e2e2e",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem" }}>Edit Profil</h2>
              <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#888" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="section-title">PILIH AVATAR</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => setEditAvatar(av)}
                      style={{
                        width: 42, height: 42, fontSize: "1.4rem",
                        borderRadius: "0.5rem", border: "none", cursor: "pointer",
                        background: editAvatar === av ? "var(--accent-soft)" : "#242424",
                        outline: editAvatar === av ? `2px solid var(--accent)` : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="section-title">USERNAME</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Username kamu"
                  value={editUsername}
                  onChange={e => setEditUsername(e.target.value)}
                  maxLength={30}
                />
              </div>

              <button className="btn-primary" onClick={handleSave} disabled={saving}>
                {saving
                  ? <><Loader2 size={16} className="animate-spin" style={{ marginRight: "0.5rem" }} />Menyimpan...</>
                  : <><Save size={16} style={{ marginRight: "0.5rem" }} />Simpan Perubahan</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuButton({ icon, label, onClick, danger = false, disabled = false, badge }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  badge?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "flex", alignItems: "center", gap: "0.75rem",
        padding: "0.875rem 1rem",
        background: "#1c1c1c",
        border: "1px solid #2e2e2e",
        borderRadius: "0.875rem",
        cursor: disabled ? "not-allowed" : "pointer",
        width: "100%",
        transition: "all 0.2s",
        opacity: disabled ? 0.5 : 1,
        textAlign: "left",
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = danger ? "rgba(239,68,68,0.4)" : "var(--accent-border)" }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e" }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: "0.6rem",
        background: danger ? "rgba(239,68,68,0.1)" : "var(--accent-dim)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ flex: 1, fontWeight: 500, fontSize: "0.9rem", color: danger ? "#ef4444" : "#f5f5f5" }}>
        {label}
      </span>
      {badge && (
        <span style={{
          fontSize: "0.6rem", fontFamily: "'Space Mono', monospace",
          background: "#2e2e2e", color: "#888",
          padding: "2px 8px", borderRadius: 100,
        }}>
          {badge}
        </span>
      )}
      {!badge && <ChevronRight size={16} color="#444" />}
    </button>
  )
}
