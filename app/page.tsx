'use client'
import { useState, useCallback, useRef } from 'react'
import SearchBar, { buildDateSuffix, type DateState, type PeopleState } from '@/components/SearchBar'
import FilterPanel from '@/components/FilterPanel'
import PackageCard from '@/components/PackageCard'
import FlightCard from '@/components/FlightCard'
import CarCard from '@/components/CarCard'
import VillaCard from '@/components/VillaCard'
import SourceStatus from '@/components/SourceStatus'
import type { SearchResults, SearchParams } from '@/lib/types'
import { cn, boardBasisLabel, formatDate } from '@/lib/utils'
import { Plane, Building2, Car, Home, Package, RefreshCw, Globe } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type ModeId = 'any' | 'package' | 'self-build' | 'flight-only' | 'villa' | 'car-hire' | 'florida'
type Tab    = 'packages' | 'flights' | 'hotels' | 'cars' | 'villas'

interface ModeConfig {
  id: ModeId; label: string; emoji: string
  presets: Partial<SearchParams>
  hint?: string
}

// ─── Mode configs ─────────────────────────────────────────────────────────────

const MODES: ModeConfig[] = [
  { id: 'any',         label: 'Any',              emoji: '🌍', presets: { mode: 'package',      boardBasis: 'any', minStars: 0,  isFloridaMode: false } },
  { id: 'package',     label: 'Package Holidays', emoji: '✈️',  presets: { mode: 'package',      boardBasis: 'AI',  minStars: 4,  isFloridaMode: false }, hint: 'All-inclusive 4-star with a swim-up pool, flying from London to Greece or Cyprus' },
  { id: 'self-build',  label: 'Self-Build',       emoji: '🔧', presets: { mode: 'self-build',   isFloridaMode: false },                                   hint: 'Self-build holiday to Mallorca, 4-star sea view, London airports' },
  { id: 'flight-only', label: 'Flights Only',     emoji: '🛫', presets: { mode: 'flight-only',  isFloridaMode: false },                                   hint: 'Direct flights to Mallorca from Gatwick' },
  { id: 'villa',       label: 'Villas',           emoji: '🏠', presets: { mode: 'villa',        isFloridaMode: false },                                   hint: 'Private villa with pool in Corfu' },
  { id: 'car-hire',    label: 'Car Hire',         emoji: '🚗', presets: { mode: 'car-hire',     isFloridaMode: false },                                   hint: 'Car hire in Tenerife' },
  { id: 'florida',     label: 'Florida',          emoji: '🎢', presets: { mode: 'package',      boardBasis: 'any', minStars: 0,  isFloridaMode: true  },  hint: 'Family Florida holiday, Disney area, villa with pool' },
]

// ─── Quick-search chips ───────────────────────────────────────────────────────

const QUICK_SEARCHES = [
  'Direct flights to PMI from LGW',
  'All Inclusive holidays from London Airports to Tenerife',
  'All-inclusive 4-star swim-up pool, flying from London to Greece or Cyprus',
]

// ─── Filter defaults ──────────────────────────────────────────────────────────

const DEFAULT_FILTER: Partial<SearchParams> = {
  mode: 'package', boardBasis: 'AI', minStars: 4, roomType: 'standard',
  bagsPerPerson: 1, maxStops: 99, transferType: 'none', flexDays: 0,
  durationNights: [7],
  departureAirports: ['LHR','LGW','LTN','STN','LCY','SEN'],
  departureGroup: 'london',
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // ── Lifted search-bar state (single source of truth) ──────────────────────
  const [query,  setQuery]  = useState('')
  const [date,   setDate]   = useState<DateState>({ day: '', month: '', year: '', flexAfter: '0', flexBefore: '0' })
  const [people, setPeople] = useState<PeopleState>({ adults: 2, childCount: 0, childAges: [] })

  // ── Filter / mode state ───────────────────────────────────────────────────
  const [selectedMode,  setSelectedMode]  = useState<ModeId>('package')
  const [filterParams,  setFilterParams]  = useState<Partial<SearchParams>>(DEFAULT_FILTER)

  // ── Results state ─────────────────────────────────────────────────────────
  const [results,    setResults]    = useState<SearchResults | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [activeTab,  setActiveTab]  = useState<Tab>('packages')
  const [lastParams, setLastParams] = useState<SearchParams | null>(null)

  const resultsRef = useRef<HTMLDivElement>(null)

  // ── Mode button ────────────────────────────────────────────────────────────
  function handleModeSelect(cfg: ModeConfig) {
    setSelectedMode(cfg.id)
    setFilterParams(prev => ({ ...prev, ...cfg.presets }))
    if (cfg.hint) setQuery(cfg.hint)
  }

  // ── Core search executor ──────────────────────────────────────────────────
  const execSearch = useCallback(async (
    q: string,
    d: DateState,
    p: PeopleState,
    fp: Partial<SearchParams>,
  ) => {
    setLoading(true)
    setError(null)
    try {
      // Build full query string including date suffix from dropdowns
      const fullQuery = q.trim() + buildDateSuffix(d)

      // 1. Parse natural language → params
      const parseRes = await fetch('/api/parse-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: fullQuery }),
      })
      const parseData = await parseRes.json()
      if (!parseData.params) throw new Error(parseData.error ?? 'Could not parse search')

      // 2. Merge: defaults → filter panel → parsed query
      //    Adults/children ALWAYS from dropdowns, mode ALWAYS from mode button (fp), never from text parsing
      const merged: SearchParams = {
        ...(DEFAULT_FILTER as SearchParams),
        ...fp,
        ...parseData.params,
        mode:     fp.mode     ?? parseData.params.mode,    // UI mode button wins
        adults:   p.adults,
        children: p.childAges,
        rawQuery: fullQuery,
      } as SearchParams

      // 3. Run search
      const searchRes = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(merged),
      })
      const data = await searchRes.json()
      if (!searchRes.ok) throw new Error(data.error ?? `Search failed (${searchRes.status})`)

      setResults(data as SearchResults)
      setLastParams(merged)

      // Auto-select tab
      const r = data as SearchResults
      if (merged.isFloridaMode)         setActiveTab('villas')
      else if (merged.mode === 'flight-only') setActiveTab('flights')
      else if (merged.mode === 'car-hire')    setActiveTab('cars')
      else if (merged.mode === 'villa')       setActiveTab('villas')
      else if (r.packages.length > 0)         setActiveTab('packages')
      else if (r.flights.length > 0)          setActiveTab('flights')
      else                                    setActiveTab('packages')

      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    } catch (e: any) {
      setError(e.message ?? 'Search failed')
    } finally {
      setLoading(false)
    }
  }, [])

  // ── SearchBar submit (uses current page state) ────────────────────────────
  const handleSearch = useCallback(() => {
    execSearch(query, date, people, filterParams)
  }, [query, date, people, filterParams, execSearch])

  // ── Quick chips: pre-fill text only, don't auto-search ───────────────────
  function handleChip(text: string) {
    setQuery(text)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Destination tile: search immediately with current people/date ─────────
  function handleDestTile(dest: string) {
    const q = `All-inclusive package holiday to ${dest}`
    setQuery(q)
    execSearch(q, date, people, filterParams)
  }

  // ── Tabs ──────────────────────────────────────────────────────────────────
  const tabs = results
    ? ([
        { id: 'packages' as Tab, label: 'Packages', icon: <Package className="h-4 w-4" />,   count: results.packages.length },
        { id: 'flights'  as Tab, label: 'Flights',  icon: <Plane className="h-4 w-4" />,     count: results.flights.length },
        { id: 'hotels'   as Tab, label: 'Hotels',   icon: <Building2 className="h-4 w-4" />, count: results.hotels.length },
        { id: 'cars'     as Tab, label: 'Car Hire', icon: <Car className="h-4 w-4" />,       count: results.cars.length },
        { id: 'villas'   as Tab, label: 'Villas',   icon: <Home className="h-4 w-4" />,      count: results.villas.length },
      ]).filter(t => t.count > 0)
    : []

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-14 text-white"
        style={{ background: 'linear-gradient(135deg, #0077b6 0%, #0096c7 40%, #00b4d8 70%, #48cae4 100%)' }}>

        <div className="pointer-events-none absolute -top-24 right-0 h-96 w-96 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #ffd60a 0%, transparent 70%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 opacity-20"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 60\'%3E%3Cpath d=\'M0 30 Q150 0 300 30 Q450 60 600 30 Q750 0 900 30 Q1050 60 1200 30 L1200 60 L0 60Z\' fill=\'white\'/%3E%3C/svg%3E")', backgroundSize: '100% 100%' }} />

        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold leading-tight drop-shadow sm:text-5xl">
            Your best-value holiday,<br />
            <span className="text-yellow-300">found in seconds.</span>
          </h1>
          <p className="mt-3 text-lg text-blue-100">
            Describe what you want — SunSeeker searches packages, flights, hotels, villas and car hire simultaneously.
          </p>
        </div>

        {/* ── Mode buttons ────────────────────────────────────────────────── */}
        <div className="relative mx-auto mt-7 max-w-3xl flex flex-wrap justify-center gap-2">
          {MODES.map(cfg => (
            <button key={cfg.id} onClick={() => handleModeSelect(cfg)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition',
                selectedMode === cfg.id
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'border border-white/30 bg-white/20 text-white backdrop-blur hover:bg-white/30',
              )}>
              <span>{cfg.emoji}</span>{cfg.label}
            </button>
          ))}
        </div>

        {/* ── Search box (fully controlled) ───────────────────────────────── */}
        <div className="relative mx-auto mt-5 max-w-3xl">
          <SearchBar
            query={query}           onQueryChange={setQuery}
            date={date}             onDateChange={setDate}
            people={people}         onPeopleChange={setPeople}
            onSearch={handleSearch}
            loading={loading}
          />
        </div>

        {/* ── Quick-search chips ──────────────────────────────────────────── */}
        <div className="relative mx-auto mt-3 max-w-3xl flex flex-wrap justify-center gap-2">
          {QUICK_SEARCHES.map(text => (
            <button key={text} onClick={() => handleChip(text)}
              className="rounded-full border border-white/40 bg-white/15 px-3 py-1.5 text-xs text-white backdrop-blur transition hover:bg-white/25">
              {text}
            </button>
          ))}
        </div>

        {/* ── Filters & Options ───────────────────────────────────────────── */}
        <div className="relative mx-auto mt-5 max-w-3xl">
          <FilterPanel
            params={filterParams}
            onChange={updated => setFilterParams(prev => ({ ...prev, ...updated }))}
          />
        </div>

      </section>

      {/* ── Results ───────────────────────────────────────────────────────── */}
      <div ref={resultsRef} className="mx-auto max-w-6xl px-4 py-8">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="relative h-16 w-16">
              <div className="h-16 w-16 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
            </div>
            <p className="text-lg font-medium text-gray-700">Searching 30+ sources…</p>
            <p className="text-sm text-gray-400">
              Comparing packages, <span className="text-orange-500">flights</span>, <span className="text-blue-500">hotels</span>, and scoring for value
            </p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-semibold">Search failed</p>
            <p className="mt-1 text-sm">{error}</p>
            {lastParams && (
              <button onClick={() => execSearch(query, date, people, filterParams)}
                className="mt-3 flex items-center gap-1.5 text-sm font-medium underline">
                <RefreshCw className="h-3.5 w-3.5" /> Try again
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <>
            {/* Summary bar */}
            {lastParams && (
              <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{lastParams.destination ?? 'Results'}</span>
                {lastParams.outboundDate && <><span>·</span><span>{formatDate(lastParams.outboundDate)}</span></>}
                <span>·</span><span>{lastParams.durationNights?.[0] ?? 7} nights</span>
                <span>·</span>
                <span>
                  {lastParams.adults} adult{lastParams.adults !== 1 ? 's' : ''}
                  {lastParams.children.length > 0 && ` + ${lastParams.children.length} child${lastParams.children.length > 1 ? 'ren' : ''}`}
                </span>
                {lastParams.boardBasis && lastParams.boardBasis !== 'any' && (
                  <><span>·</span><span>{boardBasisLabel(lastParams.boardBasis)}</span></>
                )}
                {(lastParams.minStars ?? 0) > 0 && <><span>·</span><span>{lastParams.minStars}★+</span></>}
              </div>
            )}

            <div className="mb-4"><SourceStatus sources={results.sources} /></div>

            {/* Tabs */}
            {tabs.length > 0 ? (
              <>
                <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                  {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        'flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition',
                        activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-50',
                      )}>
                      {tab.icon}{tab.label}
                      <span className={cn('rounded-full px-1.5 py-0.5 text-xs',
                        activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500')}>
                        {tab.count}
                      </span>
                    </button>
                  ))}
                </div>

                {activeTab === 'packages' && (
                  <div className="space-y-4">
                    {results.packages.length === 0
                      ? <EmptyState msg="No packages found. Adjust board basis, star rating, or switch to self-build." />
                      : results.packages.map((pkg, i) => <PackageCard key={pkg.id} pkg={pkg} rank={i} allFlights={results.flights} params={lastParams ?? undefined} />)}
                  </div>
                )}
                {activeTab === 'flights' && (
                  <FlightsView flights={results.flights} returnFlights={results.returnFlights} params={lastParams} />
                )}
                {activeTab === 'hotels' && (
                  <div className="space-y-3">
                    {results.hotels.length === 0
                      ? <EmptyState msg="No hotels found. Try adjusting your star rating." />
                      : results.hotels.map(h => (
                          <div key={h.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                            <div className="flex justify-between gap-4">
                              <div className="min-w-0">
                                <h3 className="truncate font-semibold text-gray-900">{h.name}</h3>
                                <div className="mt-0.5 text-sm text-gray-500">{'★'.repeat(h.stars)} · {h.address ?? 'Location TBC'}</div>
                                {h.guestScore && <div className="mt-1 text-xs text-gray-400">{h.guestScoreSource}: {h.guestScore}/10</div>}
                              </div>
                              <div className="shrink-0 text-right">
                                <div className="text-xl font-bold text-gray-900">£{Math.round(h.totalPriceGBP).toLocaleString()}</div>
                                <div className="text-xs text-gray-500">£{Math.round(h.pricePerNightGBP)}/night · {h.source}</div>
                              </div>
                            </div>
                            <a href={h.bookingUrl} target="_blank" rel="noopener noreferrer"
                              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                              View hotel →
                            </a>
                          </div>
                        ))}
                  </div>
                )}
                {activeTab === 'cars' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {results.cars.length === 0
                      ? <EmptyState msg="No car hire results found." />
                      : results.cars.map(c => <CarCard key={c.id} car={c} />)}
                  </div>
                )}
                {activeTab === 'villas' && (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {results.villas.length === 0
                      ? <EmptyState msg="No villas found. Try the Florida mode." />
                      : results.villas.map(v => <VillaCard key={v.id} villa={v} />)}
                  </div>
                )}
              </>
            ) : (
              <EmptyState msg="No results found. Try a different destination, date, or adjust filters." />
            )}
          </>
        )}

        {/* Idle state — popular destinations */}
        {!results && !loading && !error && (
          <div className="mt-2">
            <h2 className="mb-4 text-lg font-semibold text-gray-700">Popular destinations</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {[
                { dest: 'Tenerife',  emoji: '🌊', desc: 'AI from £699pp' },
                { dest: 'Lanzarote',emoji: '🌋', desc: 'AI from £799pp' },
                { dest: 'Majorca',   emoji: '🏖️', desc: 'HB from £549pp' },
                { dest: 'Corfu',     emoji: '🫒', desc: 'AI from £749pp' },
                { dest: 'Orlando',   emoji: '🎢', desc: 'Villa from £1,295/wk' },
                { dest: 'Dubai',     emoji: '🏙️', desc: '5★ from £1,099pp' },
              ].map(({ dest, emoji, desc }) => (
                <button key={dest} onClick={() => handleDestTile(dest)}
                  className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm transition hover:border-blue-300 hover:shadow-md">
                  <div className="text-3xl">{emoji}</div>
                  <div className="mt-2 text-sm font-semibold text-gray-800">{dest}</div>
                  <div className="mt-0.5 text-xs text-gray-400">{desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-12 text-center text-gray-400">
      <Globe className="mx-auto mb-3 h-8 w-8 opacity-40" />
      <p>{msg}</p>
    </div>
  )
}

// ── Flights view — grouped by airport, with date range headers ────────────────
function FlightsView({
  flights,
  returnFlights,
  params,
}: {
  flights: import('@/lib/types').FlightResult[]
  returnFlights: import('@/lib/types').FlightResult[]
  params: import('@/lib/types').SearchParams | null
}) {
  const [activeApt, setActiveApt] = useState<string>('all')

  if (flights.length === 0) {
    return <EmptyState msg="No flights found. Try different dates, airports, or remove the direct-only filter." />
  }

  // Build airport groups
  const airports = ['all', ...Array.from(new Set(flights.map(f => f.departureAirport)))]
  const filtered = activeApt === 'all' ? flights : flights.filter(f => f.departureAirport === activeApt)

  // Group by date
  const byDate = filtered.reduce<Record<string, typeof flights>>((acc, f) => {
    const date = f.departureTime.slice(0, 10)
    ;(acc[date] ??= []).push(f)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort()

  const multiAirport = airports.length > 2
  const flexSearch   = params && (params.flexDays ?? 0) > 0

  return (
    <div>
      {/* Flex notice */}
      {flexSearch && (
        <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-700">
          Showing flights ±{params!.flexDays} days from {new Date(params!.outboundDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Cheapest dates highlighted.
        </div>
      )}

      {/* Airport filter tabs */}
      {multiAirport && (
        <div className="mb-4 flex flex-wrap gap-2">
          {airports.map(apt => (
            <button key={apt} onClick={() => setActiveApt(apt)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition border',
                activeApt === apt
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}>
              {apt === 'all' ? `All airports (${flights.length})` : `${apt} (${flights.filter(f => f.departureAirport === apt).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Results grouped by date */}
      <div className="space-y-6">
        {dates.map(date => {
          const dayFlights = byDate[date]
          const cheapest = Math.min(...dayFlights.map(f => f.totalPriceGBP))
          const d = new Date(date + 'T12:00:00Z')
          const label = d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
          return (
            <div key={date}>
              <div className="mb-2 flex items-center gap-3">
                <h3 className="font-semibold text-gray-800">{label}</h3>
                <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  from {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(cheapest / (params?.adults ?? 1))} pp
                </span>
                <span className="text-xs text-gray-400">{dayFlights.length} flight{dayFlights.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="space-y-2">
                {dayFlights.map(f => <FlightCard key={f.id} flight={f} showDate={false} />)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Return flights */}
      {returnFlights.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 font-semibold text-gray-800">Return flights</h3>
          <div className="space-y-2">
            {returnFlights.map(f => <FlightCard key={f.id} flight={f} />)}
          </div>
        </div>
      )}
    </div>
  )
}
