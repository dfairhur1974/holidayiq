'use client'
import type { VillaResult } from '@/lib/types'
import { formatPrice } from '@/lib/utils'
import { Waves, Star, ExternalLink, MapPin, Thermometer, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props { villa: VillaResult }

export default function VillaCard({ villa }: Props) {
  return (
    <div className={cn(
      'overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md',
      villa.isFeatured ? 'border-green-600' : 'border-gray-200'
    )}>
      {villa.isFeatured && (
        <div className="flex items-center gap-2 bg-green-700 px-4 py-1.5 text-xs font-semibold text-white">
          <Star className="h-3 w-3" /> Featured Partner Property
        </div>
      )}

      {villa.imageUrl && (
        <img src={villa.imageUrl} alt={villa.name} className="h-48 w-full object-cover" />
      )}

      {!villa.imageUrl && (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
          <Waves className="h-12 w-12 text-green-200" />
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900">{villa.name}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3 w-3" />{villa.location}
            </div>
          </div>
          {villa.reviewScore && (
            <div className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-sm font-semibold text-green-700">
              <Star className="h-3.5 w-3.5" />{villa.reviewScore.toFixed(1)}
              <span className="text-xs font-normal text-green-600">({villa.reviewCount})</span>
            </div>
          )}
        </div>

        {/* Key specs */}
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Spec icon={<Users className="h-3 w-3" />} label={`Sleeps ${villa.sleeps}`} />
          <Spec label={`${villa.bedrooms} bed · ${villa.bathrooms} bath`} />
          <Spec
            icon={<Waves className="h-3 w-3" />}
            label={
              villa.poolType === 'private-heated' ? 'Private heated pool'
              : villa.poolType === 'private' ? 'Private pool'
              : villa.poolType === 'shared' ? 'Shared pool'
              : 'No pool'
            }
            highlight={villa.poolType !== 'none'}
          />
          {villa.hotTub && <Spec icon={<Thermometer className="h-3 w-3" />} label="Hot tub" highlight />}
        </div>

        {/* Distance badges */}
        {villa.distanceDisneyKm !== undefined && (
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">
              🏰 {villa.distanceDisneyKm}km to Disney
            </span>
            {villa.distanceAirportKm && (
              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">
                ✈ {villa.distanceAirportKm}km to airport
              </span>
            )}
          </div>
        )}

        {/* Features */}
        <div className="mt-3 flex flex-wrap gap-1">
          {villa.features.slice(0, 4).map(f => (
            <span key={f} className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-600">{f}</span>
          ))}
          {villa.features.length > 4 && (
            <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-400">+{villa.features.length - 4} more</span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="mt-4 flex items-end justify-between border-t pt-3">
          <div>
            <div className="text-2xl font-bold text-gray-900">{formatPrice(villa.weeklyPriceGBP)}</div>
            <div className="text-sm text-gray-500">per week</div>
            <div className="mt-0.5 text-xs text-gray-400">{villa.cancellationPolicy}</div>
          </div>
          <a
            href={villa.bookingUrl === '#contact-debbies-villa' ? 'mailto:info@debbiesvilla.com' : villa.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-green-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-green-800"
          >
            {villa.isFeatured ? 'Enquire' : 'Book'}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        <p className="mt-1.5 text-xs text-gray-400">via {villa.source}</p>
      </div>
    </div>
  )
}

function Spec({ icon, label, highlight }: { icon?: React.ReactNode; label: string; highlight?: boolean }) {
  return (
    <span className={cn(
      'flex items-center gap-1 rounded-full px-2.5 py-1',
      highlight ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
    )}>
      {icon}{label}
    </span>
  )
}
