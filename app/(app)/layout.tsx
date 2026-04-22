import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import BottomNav from "@/components/BottomNav"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  return (
    <>
      <main className="page-content">
        {children}
      </main>
      <BottomNav />
    </>
  )
}
