import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import BottomNav from "@/components/BottomNav"
import FeedbackButton from "@/components/FeedbackButton"
import { KaizenIcon } from "@/components/KaizenLogo"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <>
      <header style={{
        position: "sticky",
        top: 0,
        zIndex: 10,
        background: "var(--nav-bg)",
        borderBottom: "1px solid var(--nav-border)",
        padding: "1rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}>
        <KaizenIcon size={32} />
        <span style={{
          fontSize: "0.9rem",
          fontWeight: 700,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          letterSpacing: "-0.5px",
        }}>
          kaizen
        </span>
      </header>
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
      <FeedbackButton />
    </>
  )
}
