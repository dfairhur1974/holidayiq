'use client'
import { useState } from 'react'
import type { PackageResult, FlightResult, SearchParams } from '@/lib/types'
import ValueScoreBadge from './ValueScoreBadge'
import PackageDetailModal from './PackageDetailModal'
import { formatPrice, formatTime, formatDuration, boardBasisLabel, roomTypeLabel, airlineName, starsDisplay } from '@/lib/utils'
import { Plane, Shield, ShieldOff, Luggage, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  pkg: PackageResult
  rank: number
  allFlights?: FlightResult[]
  params?: SearchParams
}

export default function PackageCard({ pkg, rank, allFlights = [], params }: Props) {
  const [showDetail, setShowDetail] = useState(false)
  const isTop = rank === 0

  return (
    <>
      <div className={cn(
        'relative overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md cursor-pointer',
        isTop && 'border-green-600 shadow-green-100'
      )} onClick={() => setShowDetail(true)}>
        {isTop && (
          <div className="flex items-center gap-1.5 bg-green-700 px-4 py-1.5 text-xs font-semibold text-white">
            <span>⭐</span> Best Value Pick
          </div>
        )}

        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{pkg.hotel.name}</h3>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-gray-500">
                <span className="text-yellow-500">{starsDisplay(pkg.hotel.stars)}</span>
                {pkg.hotel.guestScore && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {pkg.hotel.guestScore.toFixed(1)} ★ guests
                  </span>
                )}
                <span>{boardBasisLabel(pkg.boardBasis)}</span>
                {pkg.roomType !== 'standard' && <span>· {roomTypeLabel(pkg.roomType)}</span>}
              </div>
            </div>
            <ValueScoreBadge score={pkg.valueScore} />
          </div>

          {/* Flight info */}
          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            <div className="flex items-center gap-3 text-sm">
              <Plane className="h-4 w-4 shrink-0 text-green-700" />
              <div className="flex flex-1 items-center justify-between">
                <div>
                  <span className="font-medium">{airlineName(pkg.flight.airlineCode)}</span>
                  <span className="ml-2 text-gray-500">
                    {formatTime(pkg.flight.departureTime)} → {formatTime(pkg.flight.arrivalTime)}
                  </span>
                </div>
                <div className="text-right text-xs text-gray-500">
                  {formatDuration(pkg.flight.durationMinutes)}
                  {pkg.flight.stops === 0
                    ? <span className="ml-2 text-green-700 font-medium">Direct</span>
                    : <span className="ml-2 text-amber-600">{pkg.flight.stops} stop{pkg.flight.stops > 1 ? 's' : ''}</span>
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {pkg.bagsIncluded > 0
              ? <Tag icon={<Luggage className="h-3 w-3" />} text={`${pkg.bagsIncluded}kg bag included`} colour="green" />
              : <Tag icon={<Luggage className="h-3 w-3" />} text="Bags extra" colour="amber" />
            }
            {pkg.atolProtected
              ? <Tag icon={<Shield className="h-3 w-3" />} text="ATOL protected" colour="green" />
              : <Tag icon={<ShieldOff className="h-3 w-3" />} text="Check protection" colour="gray" />
            }
            <Tag text={`${pkg.nights} nights`} colour="blue" />
            <Tag text={pkg.flight.departureAirport} colour="blue" />
          </div>

          {/* Price + CTA */}
          <div className="mt-4 flex items-end justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{formatPrice(pkg.totalPriceGBP)}</div>
              <div className="text-sm text-gray-500">{formatPrice(pkg.pricePerPersonGBP)} per person · all in</div>
            </div>
            <button
              onClick={e => { e.stopPropagation(); setShowDetail(true) }}
              className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-800"
            >
              View &amp; Book <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-400">via {pkg.operator} · click to compare OTA prices &amp; book</p>
        </div>
      </div>

      {showDetail && params && (
        <PackageDetailModal
          pkg={pkg}
          allFlights={allFlights}
          params={params}
          onClose={() => setShowDetail(false)}
        />
      )}
    </>
  )
}

function Tag({ icon, text, colour }: { icon?: React.ReactNode; text: string; colour: 'green' | 'amber' | 'blue' | 'gray' }) {
  const colours = {
    green: 'bg-green-50 text-green-700',
    amber: 'bg-amber-50 text-amber-700',
    blue:  'bg-blue-50 text-blue-700',
    gray:  'bg-gray-100 text-gray-600',
  }
  return (
    <span className={cn('flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', colours[colour])}>
      {icon}{text}
    </span>
  )
}
