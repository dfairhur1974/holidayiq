'use client'
import { useState } from 'react'
import type { FlightResult } from '@/lib/types'
import { formatPrice, formatTime, formatDuration, airlineName } from '@/lib/utils'
import { Luggage, ChevronDown, ExternalLink, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const AIRPORT_NAME: Record<string, string> = {
  LHR:'Heathrow', LGW:'Gatwick', LTN:'Luton', STN:'Stansted', LCY:'City', SEN:'Southend',
  MAN:'Manchester', BHX:'Birmingham', EDI:'Edinburgh', GLA:'Glasgow', PIK:'Prestwick',
  BRS:'Bristol', NCL:'Newcastle', LPL:'Liverpool', EMA:'East Midlands',
  PMI:'Palma', TFS:'Tenerife South', ACE:'Lanzarote', FUE:'Fuerteventura', LPA:'Gran Canaria',
  CFU:'Corfu', RHO:'Rhodes', HER:'Heraklion', KGS:'Kos', ZTH:'Zante',
  PFO:'Paphos', LCA:'Larnaca', FAO:'Faro', DXB:'Dubai', HRG:'Hurghada',
  MCO:'Orlando', MIA:'Miami', TPA:'Tampa', FLL:'Fort Lauderdale',
  BCN:'Barcelona', MAD:'Madrid', AGP:'Malaga', ALC:'Alicante', IBZ:'Ibiza',
}

function apt(code: string) { return AIRPORT_NAME[code] ?? code }

function formatFlightDate(isoString: string): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function googleFlightsUrl(from: string, to: string, date: string): string {
  const d = new Date(date + 'T12:00:00Z')
  const fmt = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
  return `https://www.google.com/search?q=flights+from+${encodeURIComponent(apt(from))}+to+${encodeURIComponent(apt(to))}+${encodeURIComponent(fmt)}`
}

interface Props {
  flight: FlightResult
  onSelect?: () => void
  selected?: boolean
  showDate?: boolean
}

export default function FlightCard({ flight, onSelect, selected, showDate = true }: Props) {
  const [showLinks, setShowLinks] = useState(false)
  const depDate = flight.departureTime.slice(0, 10)

  const isDirect = flight.stops === 0
  const layoverCodes = flight.layovers?.map(l => l.airport).filter(Boolean) ?? []

  return (
    <div className={cn(
      'overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-md',
      selected ? 'border-green-600 ring-1 ring-green-600' : 'border-gray-200',
      onSelect && 'cursor-pointer',
    )} onClick={onSelect}>

      {/* Date banner — only shown in flex-search or multi-date results */}
      {showDate && flight.departureTime && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-500">
          {formatFlightDate(flight.departureTime)}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3">

        {/* Airline */}
        <div className="w-24 shrink-0">
          <div className="text-sm font-bold text-gray-900">{airlineName(flight.airlineCode)}</div>
          <div className="text-xs text-gray-400">{flight.airlineCode}</div>
        </div>

        {/* Route timeline */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          {/* Departure */}
          <div className="text-center shrink-0">
            <div className="text-xl font-bold tabular-nums text-gray-900">{formatTime(flight.departureTime)}</div>
            <div className="text-xs font-medium text-gray-500">{flight.departureAirport}</div>
            <div className="text-xs text-gray-400">{apt(flight.departureAirport)}</div>
          </div>

          {/* Flight line */}
          <div className="flex flex-1 flex-col items-center gap-0.5 min-w-0">
            <div className="text-xs text-gray-400">{formatDuration(flight.durationMinutes)}</div>
            <div className="relative flex w-full items-center">
              <div className="h-px flex-1 bg-gray-200" />
              {isDirect ? (
                <div className="mx-1 h-1.5 w-1.5 rounded-full bg-green-500" />
              ) : (
                layoverCodes.slice(0, 2).map((code, i) => (
                  <div key={i} className="mx-1 flex flex-col items-center">
                    <div className="h-2 w-2 rounded-full border-2 border-amber-400 bg-white" />
                    <div className="absolute -bottom-3.5 text-[10px] text-amber-600">{code}</div>
                  </div>
                ))
              )}
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className={cn(
              'text-xs font-semibold',
              isDirect ? 'text-green-600' : 'text-amber-600',
            )}>
              {isDirect ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
              {!isDirect && layoverCodes.length > 0 && (
                <span className="font-normal text-gray-400"> via {layoverCodes.join(', ')}</span>
              )}
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center shrink-0">
            <div className="text-xl font-bold tabular-nums text-gray-900">{formatTime(flight.arrivalTime)}</div>
            <div className="text-xs font-medium text-gray-500">{flight.arrivalAirport}</div>
            <div className="text-xs text-gray-400">{apt(flight.arrivalAirport)}</div>
          </div>
        </div>

        {/* Price + bags */}
        <div className="shrink-0 text-right">
          <div className="text-xl font-bold text-gray-900">{formatPrice(flight.pricePerPersonGBP)}</div>
          <div className="text-xs text-gray-400">per person</div>
          <div className={cn(
            'mt-1 flex items-center justify-end gap-1 text-xs',
            flight.bagsIncluded > 0 ? 'text-green-600' : 'text-amber-600',
          )}>
            <Luggage className="h-3 w-3" />
            {flight.bagsIncluded > 0 ? `${flight.bagsIncluded}kg incl.` : 'Bags extra'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-2">
        <span className="text-xs text-gray-400">
          Total {formatPrice(flight.totalPriceGBP)} · {flight.source}
        </span>

        <div className="flex items-center gap-2">
          {onSelect ? (
            <button
              onClick={e => { e.stopPropagation(); onSelect() }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                selected
                  ? 'bg-green-700 text-white'
                  : 'border border-green-700 text-green-700 hover:bg-green-50',
              )}
            >
              {selected ? 'Selected ✓' : 'Select'}
            </button>
          ) : (
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowLinks(v => !v) }}
                className="flex items-center gap-1.5 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800"
              >
                Book <ChevronDown className={cn('h-3 w-3 transition', showLinks && 'rotate-180')} />
              </button>

              {showLinks && (
                <div className="absolute bottom-full right-0 z-20 mb-1 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
                  <a
                    href={flight.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50"
                  >
                    <span className="text-base">🔵</span>
                    <div>
                      <div className="font-semibold text-gray-900">Skyscanner</div>
                      <div className="text-xs text-gray-400">Compare all airlines</div>
                    </div>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-400" />
                  </a>
                  <a
                    href={googleFlightsUrl(flight.departureAirport, flight.arrivalAirport, depDate)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2.5 border-t border-gray-100 px-4 py-2.5 text-sm hover:bg-gray-50"
                  >
                    <span className="text-base">🔴</span>
                    <div>
                      <div className="font-semibold text-gray-900">Google Flights</div>
                      <div className="text-xs text-gray-400">Price comparison</div>
                    </div>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-400" />
                  </a>
                  <a
                    href={`https://www.skyscanner.net/transport/flights/${flight.departureAirport.toLowerCase()}/${flight.arrivalAirport.toLowerCase()}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="flex items-center gap-2.5 border-t border-gray-100 px-4 py-2.5 text-sm hover:bg-gray-50"
                  >
                    <Search className="h-4 w-4 text-gray-400" />
                    <div>
                      <div className="font-semibold text-gray-900">Search all dates</div>
                      <div className="text-xs text-gray-400">{flight.departureAirport} → {flight.arrivalAirport}</div>
                    </div>
                    <ExternalLink className="ml-auto h-3.5 w-3.5 text-gray-400" />
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
