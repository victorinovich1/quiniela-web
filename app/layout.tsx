import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Quiniela Mundial 2026',
  description: 'Pronostica los partidos del Mundial 2026 y compite con tus amigos.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <Navbar isAuthed={!!user} isAdmin={isAdmin} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
          {children}
        </main>
        <BottomNav isAuthed={!!user} isAdmin={isAdmin} />
      </body>
    </html>
  )
}
