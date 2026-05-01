"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { formatDate } from "@/lib/utils"
import ThemePicker from "@/components/ThemePicker"
import PushNotificationToggle from "@/components/PushNotificationToggle"
import ProfilePhotoUploader from "@/components/ProfilePhotoUploader"
import {
  Loader2, LogOut, Edit3, Bell, CheckCircle2, Flame,
  Calendar, X, Save, TrendingUp, Award, Target,
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

function getMilestone(streak: number): { label: string; icon: string; color: string } {
  if (streak >= 100) return { label: "Legend", icon: "🏆", color: "#f59e0b" }
  if (streak >= 30)  return { label: "On Fire", icon: "🔥", color: "#ff7043" }
  if (streak >= 7)   return { label: "Consistent", icon: "⚡", color: "#64b5f6" }
  return { label: "Getting Started", icon: "🌱", color: "#81c784" }
}

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
  const [uploadError, setUploadError] = useState<string | null>(null)

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
    const updateData: Record<string, string> = {
      username: editUsername.trim() || profile.username,
    }
    if (!editAvatar.includes("http")) {
      updateData.avatar_url = editAvatar
    }
    await supabase.from("users").update(updateData).eq("id", profile.id)
    setSaving(false)
    setEditing(false)
    setUploadError(null)
    await fetchProfile()
  }

  async function handlePhotoUploadSuccess(url: string) {
    if (!profile) return
    setProfile({ ...profile, avatar_url: url })
    setUploadError(null)
    try {
      const { data, error } = await supabase.from("users").update({ avatar_url: url }).eq("id", profile.id).select()
      if (error) {
        setUploadError(error.message || "Gagal memperbarui profil")
      } else {
        const serverRow = Array.isArray(data) && data[0] ? data[0] : null
        if (serverRow) setProfile(prev => ({ ...(prev || {}), ...serverRow, email: profile.email }))
        await fetchProfile()
      }
    } catch (e) {
      setUploadError(String(e))
    }
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

  const milestone = getMilestone(stats.currentStreak)
  const streakPct = Math.min(100, (stats.currentStreak / Math.max(stats.bestStreak, 1)) * 100)
  const displayName = profile?.username || profile?.email?.split("@")[0] || "User"
  const isPhotoUrl = profile?.avatar_url?.includes("http")

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "1rem", paddingBottom: "1rem" }}>

      {/* Hero Banner */}
      <div style={{
        position: "relative",
        borderRadius: "1.25rem",
        overflow: "hidden",
        border: "1px solid var(--border-color)",
        background: "var(--card)",
      }}>
        {/* gradient strip */}
        <div style={{
          height: 80,
          background: "linear-gradient(135deg, var(--accent-soft) 0%, rgba(100,181,246,0.08) 100%)",
          borderBottom: "1px solid var(--border-color)",
        }} />

        {/* avatar bubble */}
        <div style={{
          position: "absolute",
          top: 40,
          left: "50%",
          transform: "translateX(-50%)",
          width: 80,
          height: 80,
          borderRadius: "50%",
          border: "3px solid var(--card)",
          background: "var(--accent-soft)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "2.2rem",
          overflow: "hidden",
          boxShadow: "var(--accent-glow)",
        }}>
          {isPhotoUrl ? (
            <img src={profile!.avatar_url!} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            profile?.avatar_url || "🧑"
          )}
        </div>

        {/* edit button */}
        <button
          onClick={() => setEditing(true)}
          style={{
            position: "absolute",
            top: "0.75rem",
            right: "0.75rem",
            background: "var(--accent-dim)",
            border: "1px solid var(--accent-border)",
            borderRadius: "0.6rem",
            padding: "0.35rem 0.65rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.35rem",
            color: "var(--accent)",
            fontSize: "0.75rem",
            fontWeight: 600,
          }}
        >
          <Edit3 size={13} />
          Edit
        </button>

        {/* name block */}
        <div style={{ paddingTop: 52, paddingBottom: "1.25rem", textAlign: "center", paddingLeft: "1rem", paddingRight: "1rem" }}>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {displayName}
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.78rem", fontFamily: "'Space Mono', monospace", marginTop: "0.2rem" }}>
            {profile?.email}
          </p>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem", marginTop: "0.6rem" }}>
            {/* milestone badge */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              background: `${milestone.color}18`,
              border: `1px solid ${milestone.color}40`,
              color: milestone.color,
              borderRadius: 100,
              padding: "0.2rem 0.65rem",
              fontSize: "0.7rem",
              fontWeight: 600,
              fontFamily: "'Space Mono', monospace",
            }}>
              {milestone.icon} {milestone.label}
            </span>

            {/* member since */}
            <span style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              background: "var(--accent-dim)",
              border: "1px solid var(--border-color)",
              color: "var(--text-muted)",
              borderRadius: 100,
              padding: "0.2rem 0.65rem",
              fontSize: "0.68rem",
              fontFamily: "'Space Mono', monospace",
            }}>
              <Calendar size={10} />
              {profile?.created_at ? formatDate(profile.created_at, "MMM yyyy") : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem" }}>
        {[
          { icon: <Flame size={16} color="#ff7043" />, value: stats.currentStreak, label: "Streak", sub: "hari" },
          { icon: <Target size={16} style={{ color: "var(--accent)" }} />, value: stats.totalHabits, label: "Habit", sub: "total" },
          { icon: <CheckCircle2 size={16} color="#64b5f6" />, value: stats.totalActive, label: "Aktif", sub: "hari" },
        ].map((s, i) => (
          <div key={i} className="card" style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "0.15rem", padding: "0.9rem 0.5rem",
          }}>
            {s.icon}
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "1.35rem", fontWeight: 700, color: "var(--text-primary)", lineHeight: 1 }}>
              {s.value}
            </span>
            <span style={{ fontSize: "0.62rem", color: "var(--text-secondary)", fontFamily: "'Space Mono', monospace", letterSpacing: "0.04em" }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Streak Progress */}
      <div className="card" style={{ padding: "1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <TrendingUp size={14} style={{ color: "var(--accent)" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>Streak Progress</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ fontSize: "0.72rem", fontFamily: "'Space Mono', monospace", color: "var(--text-secondary)" }}>
              {stats.currentStreak} / {stats.bestStreak} hari
            </span>
            {stats.currentStreak >= stats.bestStreak && stats.bestStreak > 0 && (
              <Award size={14} color="#f59e0b" />
            )}
          </div>
        </div>
        <div style={{ height: 7, background: "var(--border-color)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${streakPct}%`,
            background: "linear-gradient(90deg, var(--accent), var(--accent-hover))",
            borderRadius: 4,
            transition: "width 1s ease",
          }} />
        </div>
        <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "0.4rem", fontFamily: "'Space Mono', monospace" }}>
          {stats.bestStreak > 0
            ? `Best streak: ${stats.bestStreak} hari${stats.currentStreak >= stats.bestStreak ? " 🏆 Record baru!" : ""}`
            : "Mulai streak pertamamu hari ini!"}
        </p>
      </div>

      {/* Settings */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <p className="section-title">PENGATURAN</p>

        {/* Theme */}
        <div className="card" style={{ padding: "1rem" }}>
          <p style={{ fontSize: "0.75rem", fontFamily: "'Space Mono', monospace", color: "var(--text-secondary)", marginBottom: "0.75rem", letterSpacing: "0.08em" }}>TEMA WARNA</p>
          <ThemePicker />
        </div>

        {/* Push Notif */}
        <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "0.6rem", background: "rgba(100,181,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={17} color="#64b5f6" />
            </div>
            <div>
              <p style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Push Notifications</p>
              <p style={{ fontSize: "0.7rem", color: "var(--text-secondary)", margin: 0 }}>Reminder harian kebiasaan</p>
            </div>
          </div>
          <PushNotificationToggle />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            padding: "0.875rem 1rem",
            background: "rgba(239,68,68,0.04)",
            border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: "0.875rem",
            cursor: "pointer",
            width: "100%",
            textAlign: "left",
            transition: "border-color 0.2s ease",
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)" }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.15)" }}
        >
          <div style={{ width: 36, height: 36, borderRadius: "0.6rem", background: "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogOut size={17} color="#ef4444" />
          </div>
          <span style={{ flex: 1, fontWeight: 500, fontSize: "0.88rem", color: "#ef4444" }}>Keluar</span>
        </button>
      </div>

      <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.65rem", fontFamily: "'Space Mono', monospace" }}>
        1% Daily v1.0.1
      </p>

      {/* Edit Modal */}
      {editing && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "flex-end", justifyContent: "center",
          }}
          onClick={() => setEditing(false)}
        >
          <div
            className="animate-fade-in"
            onClick={e => e.stopPropagation()}
            style={{
              width: "100%", maxWidth: 390,
              background: "var(--card)",
              borderTopLeftRadius: "1.5rem", borderTopRightRadius: "1.5rem",
              padding: "1.5rem",
              border: "1px solid var(--border-color)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* handle bar */}
            <div style={{ width: 36, height: 4, background: "var(--border-color)", borderRadius: 2, margin: "0 auto 1.25rem" }} />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h2 style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text-primary)", margin: 0 }}>Edit Profil</h2>
              <button
                onClick={() => setEditing(false)}
                style={{ background: "var(--border-color)", border: "none", cursor: "pointer", color: "var(--text-secondary)", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <ProfilePhotoUploader
                currentPhotoUrl={isPhotoUrl ? profile?.avatar_url ?? undefined : undefined}
                onUploadSuccess={handlePhotoUploadSuccess}
                onError={setUploadError}
              />

              {uploadError && (
                <div style={{
                  padding: "0.75rem", background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)", borderRadius: "0.5rem",
                  color: "#ef4444", fontSize: "0.82rem",
                  display: "flex", alignItems: "center", gap: "0.5rem",
                }}>
                  <X size={15} /> {uploadError}
                </div>
              )}

              <div>
                <label className="section-title">PILIH AVATAR EMOJI</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
                  {AVATARS.map(av => (
                    <button
                      key={av}
                      onClick={() => setEditAvatar(av)}
                      style={{
                        width: 44, height: 44, fontSize: "1.4rem",
                        borderRadius: "0.6rem", border: "none", cursor: "pointer",
                        background: editAvatar === av && !editAvatar.includes("http") ? "var(--accent-soft)" : "var(--border-color)",
                        outline: editAvatar === av && !editAvatar.includes("http") ? "2px solid var(--accent)" : "none",
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
                  style={{ marginTop: "0.5rem" }}
                />
              </div>

              <button className="btn-primary" onClick={handleSave} disabled={saving} style={{ marginTop: "0.25rem" }}>
                {saving
                  ? <><Loader2 size={15} className="animate-spin" style={{ marginRight: "0.5rem" }} />Menyimpan...</>
                  : <><Save size={15} style={{ marginRight: "0.5rem" }} />Simpan Perubahan</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
