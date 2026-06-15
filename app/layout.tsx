import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SunSeeker — AI Holiday Search',
  description: 'Find your best-value holiday. AI-powered search across packages, flights, hotels, villas, and car hire.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <header className="sticky top-0 z-30 border-b border-orange-100 bg-white/95 backdrop-blur shadow-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <a href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm font-bold shadow">☀</div>
              <span className="text-lg font-bold text-slate-900">Sun<span className="text-orange-500">Seeker</span></span>
            </a>
            <nav className="hidden items-center gap-6 text-sm text-slate-600 sm:flex">
              <a href="/" className="hover:text-orange-500 transition-colors">Search</a>
              <a href="/florida" className="hover:text-orange-500 transition-colors">🌴 Florida</a>
              <a href="/florida" className="rounded-full bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-1.5 text-white hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm">Debbie&apos;s Villa</a>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-400">
          <p>SunSeeker earns a commission when you book via our links. This does not affect the price you pay.</p>
          <p className="mt-1">Prices are live and may change. Always confirm before booking. ATOL protection status shown per result.</p>
        </footer>
      </body>
    </html>
  )
}
