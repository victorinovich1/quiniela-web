import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import BottomNav from '@/components/BottomNav'
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister'
import NotificationProvider from '@/components/NotificationProvider'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Quiniela Mundial 2026',
  description: 'Pronostica y compite con tus amigos.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/images/favicon.ico' },
      { url: '/images/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/images/favicon.ico',
    apple: [
      { url: '/images/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    title: 'Quiniela 2026',
    statusBarStyle: 'black-translucent',
  },
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
    isAdmin = ['admin', 'manager'].includes(profile?.role ?? '')
  }

  return (
    <html lang="es" className="dark" style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <ServiceWorkerRegister />
        <NotificationProvider userId={user?.id ?? null}>
          <Navbar isAuthed={!!user} isAdmin={isAdmin} />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
            {children}
          </main>
          <BottomNav isAuthed={!!user} isAdmin={isAdmin} />
        </NotificationProvider>
      </body>
    </html>
  )
}
