'use client'
import { useState, useEffect } from 'react'
import type { PackageResult, FlightResult, SearchParams } from '@/lib/types'
import { buildOtaLinks } from '@/lib/ota-links'
import { destinationToIata } from '@/lib/utils'
import { formatPrice, formatTime, formatDuration, boardBasisLabel, airlineName } from '@/lib/utils'
import { X, Plane, Hotel, Luggage, Shield, ShieldOff, ExternalLink, Loader2, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OtaPrice { name: string; priceGBP: number | null; isEstimate: boolean; note: string }

interface Props {
  pkg: PackageResult
  allFlights: FlightResult[]
  params: SearchParams
  onClose: () => void
}

const BOARD_OPTIONS = [
  { value: 'AI', label: 'All Inclusive' },
  { value: 'FB', label: 'Full Board' },
  { value: 'HB', label: 'Half Board' },
  { value: 'BB', label: 'Bed & Breakfast' },
  { value: 'RO', label: 'Room Only' },
]

const BAG_OPTIONS = [
  { kg: 0,  label: 'Cabin only' },
  { kg: 15, label: '15kg' },
  { kg: 20, label: '20kg' },
  { kg: 23, label: '23kg' },
]

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export default function PackageDetailModal({ pkg, allFlights, params, onClose }: Props) {
  const [selectedFlight, setSelectedFlight]         = useState<FlightResult>(pkg.flight)
  const [selectedBoardBasis, setSelectedBoardBasis] = useState(pkg.boardBasis)
  const [selectedBags, setSelectedBags]             = useState(pkg.bagsIncluded)
  const [otaPrices, setOtaPrices]                   = useState<OtaPrice[] | null>(null)
  const [otaLoading, setOtaLoading]                 = useState(false)

  const passengers  = params.adults + params.children.length
  const destIata    = destinationToIata(params.destination)
  const returnDate  = addDays(params.outboundDate, pkg.nights)

  // Price adjustments from user's selections
  const flightDiff  = selectedFlight.totalPriceGBP - pkg.flight.totalPriceGBP
  const bagCostExtra = selectedBags > (selectedFlight.bagsIncluded > 0 ? 20 : 0)
    ? (selectedFlight.bagCostGBP ?? 28) * passengers : 0
  const adjustedTotal = pkg.totalPriceGBP + flightDiff + bagCostExtra

  // Self-build price breakdown
  const selfBuildFlight = selectedFlight.totalPriceGBP
  const selfBuildHotel  = pkg.hotel.totalPriceGBP
  const selfBuildTotal  = selfBuildFlight + selfBuildHotel + bagCostExtra

  const otaLinks = buildOtaLinks(
    params.destination,
    selectedFlight.departureAirport,
    destIata,
    params.outboundDate,
    pkg.nights,
    params.adults,
    params.children,
  )

  const otherFlights = allFlights.filter(f => f.id !== selectedFlight.id).slice(0, 5)

  // Fetch OTA prices on mount
  useEffect(() => {
    setOtaLoading(true)
    fetch('/api/ota-prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originIata:    selectedFlight.departureAirport,
        destIata,
        outboundDate:  params.outboundDate,
        returnDate,
        adults:        params.adults,
        children:      params.children,
        selfBuildPrice: selfBuildTotal,
      }),
    })
      .then(r => r.json())
      .then(d => setOtaPrices(d.results ?? null))
      .catch(() => setOtaPrices(null))
      .finally(() => setOtaLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function priceDiffIcon(otaPrice: number | null) {
    if (!otaPrice) return null
    const diff = otaPrice - selfBuildTotal
    if (Math.abs(diff) < 30) return <Minus className="h-3.5 w-3.5 text-gray-400" />
    if (diff < 0) return <TrendingDown className="h-3.5 w-3.5 text-green-600" />
    return <TrendingUp className="h-3.5 w-3.5 text-red-500" />
  }

  function priceDiffLabel(otaPrice: number | null) {
    if (!otaPrice) return null
    const diff = otaPrice - selfBuildTotal
    if (Math.abs(diff) < 30) return <span className="text-gray-400 text-xs">≈ same</span>
    const sign = diff < 0 ? '−' : '+'
    return (
      <span className={cn('text-xs font-medium', diff < 0 ? 'text-green-600' : 'text-red-500')}>
        {sign}{formatPrice(Math.abs(diff))} vs self-build
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-gray-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{pkg.hotel.name}</h2>
            <p className="text-sm text-gray-500">
              {'★'.repeat(pkg.hotel.stars)} · {params.destination} · {pkg.nights} nights
            </p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">

          {/* Self-build price breakdown */}
          <section className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="mb-3 text-sm font-semibold text-blue-900">Your self-build price</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center justify-between text-gray-700">
                <span className="flex items-center gap-2"><Plane className="h-3.5 w-3.5 text-blue-600" /> {airlineName(selectedFlight.airlineCode)} flight ({params.adults + params.children.length} pax)</span>
                <span className="font-medium">{formatPrice(selfBuildFlight)}</span>
              </div>
              <div className="flex items-center justify-between text-gray-700">
                <span className="flex items-center gap-2"><Hotel className="h-3.5 w-3.5 text-blue-600" /> {pkg.hotel.name} · {pkg.nights} nights</span>
                <span className="font-medium">{formatPrice(selfBuildHotel)}</span>
              </div>
              {bagCostExtra > 0 && (
                <div className="flex items-center justify-between text-gray-700">
                  <span className="flex items-center gap-2"><Luggage className="h-3.5 w-3.5 text-blue-600" /> Hold luggage</span>
                  <span className="font-medium">{formatPrice(bagCostExtra)}</span>
                </div>
              )}
              <div className="mt-2 flex items-center justify-between border-t border-blue-200 pt-2 font-bold text-blue-900">
                <span>Total self-build</span>
                <span className="text-lg">{formatPrice(selfBuildTotal)}</span>
              </div>
              <div className="text-xs text-blue-600">{formatPrice(Math.round(selfBuildTotal / passengers))} per person · booking flight &amp; hotel separately</div>
            </div>
          </section>

          {/* Flight options */}
          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Plane className="h-4 w-4 text-green-700" /> Change outbound flight
            </h3>
            <div className="space-y-2">
              {[selectedFlight, ...otherFlights].map(flight => (
                <button
                  key={flight.id}
                  onClick={() => setSelectedFlight(flight)}
                  className={cn(
                    'w-full rounded-xl border p-3 text-left transition',
                    selectedFlight.id === flight.id
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        'h-4 w-4 rounded-full border-2 shrink-0',
                        selectedFlight.id === flight.id ? 'border-green-600 bg-green-600' : 'border-gray-300'
                      )} />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {airlineName(flight.airlineCode)} · {formatTime(flight.departureTime)} → {formatTime(flight.arrivalTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDuration(flight.durationMinutes)}
                          {flight.stops === 0
                            ? <span className="ml-2 text-green-700 font-medium">Direct</span>
                            : <span className="ml-2 text-amber-600">{flight.stops} stop{flight.stops > 1 ? 's' : ''}</span>
                          }
                          {flight.bagsIncluded > 0 && <span className="ml-2">· {flight.bagsIncluded}kg incl.</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">{formatPrice(flight.totalPriceGBP)}</div>
                      {flight.id !== pkg.flight.id && (
                        <div className={cn('text-xs', flight.totalPriceGBP > pkg.flight.totalPriceGBP ? 'text-red-500' : 'text-green-600')}>
                          {flight.totalPriceGBP > pkg.flight.totalPriceGBP ? '+' : ''}
                          {formatPrice(flight.totalPriceGBP - pkg.flight.totalPriceGBP)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {allFlights.length === 0 && (
                <p className="text-sm text-gray-400 italic">No alternative flights available for this date.</p>
              )}
            </div>
          </section>

          {/* Board basis */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Board basis</h3>
            <div className="flex flex-wrap gap-2">
              {BOARD_OPTIONS.map(opt => (
                <button key={opt.value} onClick={() => setSelectedBoardBasis(opt.value as typeof selectedBoardBasis)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs font-medium transition border',
                    selectedBoardBasis === opt.value
                      ? 'border-green-600 bg-green-700 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  )}>
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Bags */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">Hold luggage per person</h3>
            <div className="flex flex-wrap gap-2">
              {BAG_OPTIONS.map(opt => {
                const isIncluded = selectedFlight.bagsIncluded >= opt.kg
                const addCost    = !isIncluded && opt.kg > 0 ? (selectedFlight.bagCostGBP ?? 28) * passengers : 0
                return (
                  <button key={opt.kg} onClick={() => setSelectedBags(opt.kg)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition border',
                      selectedBags === opt.kg
                        ? 'border-green-600 bg-green-700 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    )}>
                    {opt.label}
                    {addCost > 0 && selectedBags !== opt.kg && <span className="ml-1 text-amber-600">+{formatPrice(addCost)}</span>}
                    {isIncluded && opt.kg > 0 && <span className="ml-1 text-green-400">✓</span>}
                  </button>
                )
              })}
            </div>
          </section>

          {/* ATOL notice */}
          <div className={cn(
            'flex items-start gap-2 rounded-xl border p-3 text-xs',
            pkg.atolProtected ? 'border-green-200 bg-green-50 text-green-800' : 'border-amber-200 bg-amber-50 text-amber-800'
          )}>
            {pkg.atolProtected ? <Shield className="mt-0.5 h-4 w-4 shrink-0" /> : <ShieldOff className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>
              {pkg.atolProtected
                ? 'ATOL protected — your money is safe if the operator fails.'
                : 'Self-build is not ATOL protected. Book via an ATOL-licensed OTA below for full financial protection.'
              }
            </span>
          </div>

          {/* OTA price comparison + booking */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Compare &amp; book on OTAs</h3>
              {otaLoading && <div className="flex items-center gap-1 text-xs text-gray-400"><Loader2 className="h-3 w-3 animate-spin" /> Fetching prices…</div>}
            </div>

            <div className="space-y-2">
              {otaLinks.map(link => {
                const otaData = otaPrices?.find(p => p.name === link.name)
                return (
                  <a key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition hover:border-gray-300 hover:shadow-md">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: link.colour }} />
                      <div>
                        <div className="font-semibold text-gray-900">{link.name}</div>
                        {otaData?.note && <div className="text-xs text-gray-400">{otaData.note}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-right">
                      {otaLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-300" />
                      ) : otaData?.priceGBP ? (
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1">
                            {priceDiffIcon(otaData.priceGBP)}
                            <span className="text-base font-bold text-gray-900">{formatPrice(otaData.priceGBP)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {priceDiffLabel(otaData.priceGBP)}
                            {otaData.isEstimate && <span className="text-xs text-gray-400 ml-1">est.</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          Visit for price <ExternalLink className="h-3.5 w-3.5" />
                        </div>
                      )}
                    </div>
                  </a>
                )
              })}
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Prices shown are indicative. Click through to confirm live price and availability on each OTA.
              Estimated prices derived from Skyscanner market data where available.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
