'use client'
import { useEffect, useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import type { SearchResults, SearchParams } from '@/lib/types'
import SearchBar from '@/components/SearchBar'
import FilterPanel from '@/components/FilterPanel'
import PackageCard from '@/components/PackageCard'
import FlightCard from '@/components/FlightCard'
import CarCard from '@/components/CarCard'
import VillaCard from '@/components/VillaCard'
import SourceStatus from '@/components/SourceStatus'
import { RefreshCw, Plane, Building2, Car, Home, Package, Loader2 } from 'lucide-react'
import { cn, boardBasisLabel, formatDate } from '@/lib/utils'
import { type DateState, type PeopleState, buildDateSuffix } from '@/components/SearchBar'

type Tab = 'packages' | 'flights' | 'hotels' | 'cars' | 'villas'

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-green-700" /></div>}>
      <SearchPageInner />
    </Suspense>
  )
}

function SearchPageInner() {
  const sp = useSearchParams()
  const router = useRouter()
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('packages')
  const [filterParams, setFilterParams] = useState<Partial<SearchParams>>({})

  // Controlled SearchBar state
  const params: SearchParams | null = (() => {
    try { return JSON.parse(decodeURIComponent(sp.get('p') ?? '')) } catch { return null }
  })()
  const [sbQuery,  setSbQuery]  = useState('')
  const [sbDate,   setSbDate]   = useState<DateState>({ day: '', month: '', year: '', flexAfter: '0', flexBefore: '0' })
  const [sbPeople, setSbPeople] = useState<PeopleState>({ adults: params?.adults ?? 2, childCount: params?.children?.length ?? 0, childAges: params?.children ?? [] })

  const runSearch = useCallback(async (p: SearchParams) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `Search failed (${res.status})`)
      setResults(data as SearchResults)
      setFilterParams(p)
      if (data.params.isFloridaMode) setActiveTab('villas')
      else if (data.params.mode === 'flight-only') setActiveTab('flights')
      else if (data.params.mode === 'car-hire') setActiveTab('cars')
      else if (data.packages.length > 0) setActiveTab('packages')
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (params) runSearch(params)
  }, [sp.get('p')]) // eslint-disable-line

  const handleNewSearch = useCallback(async () => {
    setLoading(true)
    try {
      const fullQuery = sbQuery.trim() + buildDateSuffix(sbDate)
      const res = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery }),
      })
      const data = await res.json()
      if (!data.params) throw new Error(data.error ?? 'Could not parse search')
      const merged = { ...data.params, mode: filterParams.mode ?? data.params.mode, adults: sbPeople.adults, children: sbPeople.childAges }
      const encoded = encodeURIComponent(JSON.stringify(merged))
      router.push(`/search?p=${encoded}`)
    } catch (e: any) { setError(e.message ?? 'Search failed'); setLoading(false) }
  }, [router, sbQuery, sbDate, sbPeople])

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = results ? ([
    { id: 'packages' as Tab, label: 'Packages',  icon: <Package className="h-4 w-4" />, count: results.packages.length },
    { id: 'flights'  as Tab, label: 'Flights',   icon: <Plane className="h-4 w-4" />,   count: results.flights.length },
    { id: 'hotels'   as Tab, label: 'Hotels',    icon: <Building2 className="h-4 w-4" />,count: results.hotels.length },
    { id: 'cars'     as Tab, label: 'Car Hire',  icon: <Car className="h-4 w-4" />,      count: results.cars.length },
    { id: 'villas'   as Tab, label: 'Villas',    icon: <Home className="h-4 w-4" />,     count: results.villas.length },
  ] as { id: Tab; label: string; icon: React.ReactNode; count: number }[]).filter(t => t.count > 0 || t.id === activeTab) : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Search bar */}
      <SearchBar
        query={sbQuery}   onQueryChange={setSbQuery}
        date={sbDate}     onDateChange={setSbDate}
        people={sbPeople} onPeopleChange={setSbPeople}
        onSearch={handleNewSearch}
        loading={loading}
        className="mb-6"
      />

      {/* Filters */}
      {params && (
        <div className="mb-4">
          <FilterPanel
            params={filterParams}
            onChange={updated => {
              const merged = { ...params, ...updated }
              runSearch(merged as SearchParams)
            }}
          />
        </div>
      )}

      {/* Summary bar */}
      {params && !loading && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <span className="font-medium text-gray-900">{params.destination}</span>
          <span>·</span>
          <span>{formatDate(params.outboundDate)}</span>
          <span>·</span>
          <span>{params.durationNights[0]} nights</span>
          <span>·</span>
          <span>{params.adults} adult{params.adults > 1 ? 's' : ''}{params.children.length > 0 ? ` + ${params.children.length} child${params.children.length > 1 ? 'ren' : ''}` : ''}</span>
          <span>·</span>
          <span>{boardBasisLabel(params.boardBasis)}</span>
          {params.minStars > 0 && <><span>·</span><span>{params.minStars}★+</span></>}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-gray-500">
          <Loader2 className="h-10 w-10 animate-spin text-green-700" />
          <p className="text-lg font-medium">Searching 30+ sources…</p>
          <p className="text-sm">Comparing packages, flights, hotels, and scoring for value</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Search failed</p>
          <p className="mt-1 text-sm">{error}</p>
          <button onClick={() => params && runSearch(params)} className="mt-3 flex items-center gap-1 text-sm underline">
            <RefreshCw className="h-3 w-3" /> Try again
          </button>
        </div>
      )}

      {/* Results */}
      {results && !loading && (
        <>
          {/* Source status */}
          <div className="mb-4">
            <SourceStatus sources={results.sources} />
          </div>

          {/* Demo notice */}
          {results.cars.some(c => c.source === 'Demo') && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              ⚡ Car hire, transfers, and villa results are indicative pricing. Add a <strong>RAPIDAPI_KEY</strong> to <code>.env.local</code> for live car hire. Flights are live via Duffel.
            </div>
          )}

          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                    activeTab === tab.id
                      ? 'bg-green-700 text-white shadow'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  {tab.icon}
                  {tab.label}
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-xs',
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Package results */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              {results.packages.length === 0 ? (
                <EmptyState message="No packages found. Try adjusting your search or switching to self-build mode." />
              ) : (
                results.packages.map((pkg, i) => <PackageCard key={pkg.id} pkg={pkg} rank={i} allFlights={results.flights} params={filterParams as SearchParams} />)
              )}
            </div>
          )}

          {/* Flight results */}
          {activeTab === 'flights' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">Outbound flights</h3>
              {results.flights.length === 0 ? (
                <EmptyState message="No flights found. Try different dates or airports." />
              ) : (
                results.flights.map(f => <FlightCard key={f.id} flight={f} />)
              )}
              {results.returnFlights.length > 0 && (
                <>
                  <h3 className="mt-6 font-semibold text-gray-700">Return flights</h3>
                  {results.returnFlights.map(f => <FlightCard key={f.id} flight={f} />)}
                </>
              )}
            </div>
          )}

          {/* Hotel results */}
          {activeTab === 'hotels' && (
            <div className="space-y-3">
              {results.hotels.length === 0 ? (
                <EmptyState message="No hotels found for this destination. Try adjusting your star rating." />
              ) : (
                results.hotels.map(h => (
                  <div key={h.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{h.name}</h3>
                        <div className="mt-0.5 text-sm text-gray-500">{'★'.repeat(h.stars)} · {h.address ?? 'Location TBC'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold text-gray-900">£{Math.round(h.totalPriceGBP).toLocaleString()}</div>
                        <div className="text-xs text-gray-500">£{Math.round(h.pricePerNightGBP)}/night</div>
                      </div>
                    </div>
                    <a href={h.bookingUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800">
                      View hotel
                    </a>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Car hire results */}
          {activeTab === 'cars' && (
            <div className="grid gap-4 sm:grid-cols-2">
              {results.cars.length === 0 ? (
                <EmptyState message="No car hire results. Add a Rentalcars.com API key to enable live results." />
              ) : (
                results.cars.map(c => <CarCard key={c.id} car={c} />)
              )}
            </div>
          )}

          {/* Villa results */}
          {activeTab === 'villas' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {results.villas.length === 0 ? (
                <EmptyState message="No villas found. Try Florida or add a VRBO API key for live results." />
              ) : (
                results.villas.map(v => <VillaCard key={v.id} villa={v} />)
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
      <p>{message}</p>
    </div>
  )
}
