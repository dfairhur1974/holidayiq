'use client'
import type { CarResult } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Car, CheckCircle, XCircle, ExternalLink, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { car: CarResult; compact?: boolean }

export default function CarCard({ car, compact = false }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-gray-300 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-green-700" />
            <span className="font-semibold text-gray-900">{car.vehicleClass}</span>
          </div>
          <div className="mt-0.5 text-sm text-gray-500">{car.supplier} · {car.seats} seats · {car.doors} doors</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-gray-900">{formatPrice(car.totalPriceGBP)}</div>
          <div className="text-xs text-gray-500">{formatPrice(car.pricePerDayGBP)}/day</div>
        </div>
      </div>

      {!compact && (
        <div className="mt-3 grid grid-cols-2 gap-1.5 text-xs">
          <Feature ok={car.transmission === 'automatic'} label={car.transmission === 'automatic' ? 'Automatic' : 'Manual'} warn={false} />
          <Feature ok={car.airConditioning} label="Air conditioning" warn={!car.airConditioning} />
          <Feature ok={car.unlimitedMileage} label="Unlimited mileage" warn={!car.unlimitedMileage} />
          <Feature ok={car.cdwIncluded} label={car.cdwIncluded ? 'CDW included' : `CDW +${formatPrice(car.cdwCostGBP ?? 0)}/day`} warn={!car.cdwIncluded} />
          <span className="col-span-2 text-gray-500">Excess: {car.excessGBP === 0 ? 'None' : formatPrice(car.excessGBP)} · {car.fuelPolicy}</span>
          <span className="col-span-2 text-gray-500">{car.pickupLocation}{car.isAirportPickup ? ' (airport)' : ''}</span>
        </div>
      )}

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{car.source}</span>
        <a
          href={car.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-green-800"
        >
          Book <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

function Feature({ ok, label, warn }: { ok: boolean; label: string; warn: boolean }) {
  return (
    <div className={cn('flex items-center gap-1', warn ? 'text-amber-600' : ok ? 'text-green-700' : 'text-gray-400')}>
      {warn ? <AlertTriangle className="h-3 w-3" /> : ok ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
      {label}
    </div>
  )
}
