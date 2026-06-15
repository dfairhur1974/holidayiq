'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchBar, { type DateState, type PeopleState, buildDateSuffix } from '@/components/SearchBar'
import { FLORIDA_AREAS } from '@/lib/types'
import { MapPin, Car, Thermometer, Star, AlertTriangle, Plane } from 'lucide-react'

export default function FloridaPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [sbQuery,  setSbQuery]  = useState('')
  const [sbDate,   setSbDate]   = useState<DateState>({ day: '', month: '', year: '', flexAfter: '0', flexBefore: '0' })
  const [sbPeople, setSbPeople] = useState<PeopleState>({ adults: 2, childCount: 0, childAges: [] })

  const handleSearch = async () => {
    setLoading(true)
    try {
      const fullQuery = sbQuery.trim() + buildDateSuffix(sbDate) + ' Florida'
      const res = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery }),
      })
      const data = await res.json()
      const merged = { ...(data.params ?? {}), isFloridaMode: true, mode: 'villa', adults: sbPeople.adults, children: sbPeople.childAges }
      const encoded = encodeURIComponent(JSON.stringify(merged))
      router.push(`/search?p=${encoded}`)
    } catch { setLoading(false) }
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-700 px-4 py-20 text-white">
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="text-5xl">🌴</div>
          <h1 className="mt-4 text-4xl font-bold">Florida Holiday Planner</h1>
          <p className="mt-3 text-lg text-blue-100">
            Villas, car hire, theme park planning and AI itineraries — everything you need for a Florida holiday, including Debbie&apos;s Villa.
          </p>
          <div className="mt-8">
            <SearchBar
              query={sbQuery}   onQueryChange={setSbQuery}
              date={sbDate}     onDateChange={setSbDate}
              people={sbPeople} onPeopleChange={setSbPeople}
              onSearch={handleSearch}
              loading={loading}
              className="max-w-2xl mx-auto"
            />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {['2 adults 2 kids 14 nights', '4 adults villa with pool 2 weeks', 'Family Disney trip budget £8,000'].map(q => (
              <button key={q} onClick={() => setSbQuery(q)}
                className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-white/20">
                {q}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Debbie's Villa featured */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="overflow-hidden rounded-2xl border-2 border-green-600 bg-white shadow-lg">
          <div className="flex items-center gap-3 bg-green-700 px-6 py-3 text-white">
            <Star className="h-4 w-4" />
            <span className="font-semibold">Featured Partner Property</span>
          </div>
          <div className="grid gap-6 p-6 md:grid-cols-2">
            <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-blue-50 to-green-50">
              <div className="text-center text-gray-400">
                <Thermometer className="mx-auto h-12 w-12 text-green-200" />
                <p className="mt-2 text-sm">Photos coming soon</p>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Debbie&apos;s Florida Villa</h2>
              <div className="mt-1 flex items-center gap-1 text-gray-500">
                <MapPin className="h-4 w-4" /> Kissimmee, Florida
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {['4 bedrooms', '3 bathrooms', 'Sleeps 8', 'Private heated pool', 'Games room', 'Free WiFi', 'BBQ', '8 min from Disney'].map(f => (
                  <span key={f} className="rounded-full bg-green-50 px-3 py-1 text-green-700">{f}</span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">9.4 ★ guests (47 reviews)</span>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-bold text-gray-900">£1,495<span className="text-lg font-normal text-gray-500">/week</span></div>
                <div className="mt-1 text-sm text-gray-500">Free cancellation up to 60 days before arrival</div>
              </div>
              <div className="mt-5 flex gap-3">
                <a href="mailto:info@debbiesvilla.com"
                  className="rounded-xl bg-green-700 px-6 py-2.5 font-semibold text-white transition hover:bg-green-800">
                  Enquire now
                </a>
                <button onClick={() => { setSbQuery('villa Kissimmee 4 bedrooms 2 weeks'); handleSearch() }}
                  className="rounded-xl border border-green-700 px-6 py-2.5 font-semibold text-green-700 transition hover:bg-green-50">
                  Search with flights
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Florida area guide */}
      <section className="border-t border-gray-200 bg-white px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Florida Villa Areas Guide</h2>
          <p className="mb-6 text-sm text-gray-500">All areas are within 30 minutes of Walt Disney World. Choose based on budget, vibe, and park preference.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FLORIDA_AREAS.map(area => (
              <div key={area.name} className="rounded-xl border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900">{area.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{area.description}</p>
                <div className="mt-3 flex flex-col gap-1 text-xs text-gray-600">
                  <span>🏰 {area.distanceDisneyMiles} miles to Disney</span>
                  <span>🎢 {area.distanceUniversalMiles} miles to Universal</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {area.highlights.map(h => (
                    <span key={h} className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700">{h}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Need-to-know */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-6 text-xl font-semibold text-gray-900">Florida essentials</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Car className="h-5 w-5 text-blue-700" />, title: 'Car hire is essential', body: 'Florida has almost no public transport. You need a car for everything. Automatic transmission is standard. SUV recommended for families.' },
            { icon: <Plane className="h-5 w-5 text-blue-700" />, title: 'UK departure airports', body: 'Fly to MCO (Orlando), MIA (Miami), TPA (Tampa), or FLL (Fort Lauderdale). LHR, MAN, LGW, BHX, and EDI all have direct routes.' },
            { icon: <AlertTriangle className="h-5 w-5 text-amber-600" />, title: 'Travel insurance', body: 'US medical costs are extremely high. Get at least $3m medical cover. Hurricane season runs June–November — make sure cancellation is covered.' },
            { icon: <MapPin className="h-5 w-5 text-green-700" />, title: 'Driving licence', body: 'Your UK licence is valid in Florida. An International Driving Permit (IDP) is recommended and cheap to get from the Post Office.' },
          ].map(({ icon, title, body }) => (
            <div key={title} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-gray-50">{icon}</div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <p className="mt-1 text-sm text-gray-500">{body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
