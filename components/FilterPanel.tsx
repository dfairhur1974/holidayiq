'use client'
import { useState } from 'react'
import type { SearchParams, BoardBasis, RoomType } from '@/lib/types'
import AirportSelector from './AirportSelector'
import { cn, boardBasisLabel, roomTypeLabel } from '@/lib/utils'
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  params:   Partial<SearchParams>
  onChange: (updated: Partial<SearchParams>) => void
}

const BOARD_OPTIONS: BoardBasis[] = ['AI', 'FB', 'HB', 'BB', 'SC', 'RO', 'any']
const ROOM_OPTIONS:  RoomType[]   = ['any', 'swim-up', 'sea-view', 'pool-view', 'suite', 'family', 'standard']

export default function FilterPanel({ params, onChange }: Props) {
  const [open, setOpen] = useState(true)   // open by default
  const p = params

  function update<K extends keyof SearchParams>(key: K, val: SearchParams[K]) {
    onChange({ ...p, [key]: val })
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-blue-600" />
          <span>Filters &amp; Options</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t px-4 pb-4 pt-3">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Board basis */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Board Basis</label>
              <div className="flex flex-wrap gap-1.5">
                {BOARD_OPTIONS.map(b => (
                  <button key={b} onClick={() => update('boardBasis', b)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition',
                      p.boardBasis === b
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600',
                    )}>
                    {boardBasisLabel(b)}
                  </button>
                ))}
              </div>
            </div>

            {/* Min stars */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Min Stars: {p.minStars ?? 4}★
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => update('minStars', s)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition',
                      (p.minStars ?? 4) === s
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-500',
                    )}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Room type */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Room Type</label>
              <div className="flex flex-wrap gap-1.5">
                {ROOM_OPTIONS.map(r => (
                  <button key={r} onClick={() => update('roomType', r)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition',
                      p.roomType === r
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-500 hover:text-blue-600',
                    )}>
                    {roomTypeLabel(r)}
                  </button>
                ))}
              </div>
            </div>

            {/* Departure airport */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Departure Airport</label>
              <AirportSelector
                value={p.departureAirports ?? []}
                groupKey={p.departureGroup}
                onChange={(airports, groupKey) => onChange({ ...p, departureAirports: airports, departureGroup: groupKey })}
              />
            </div>

            {/* Duration */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Duration (nights)</label>
              <div className="flex flex-wrap gap-1.5">
                {[3, 7, 10, 14, 21].map(n => (
                  <button key={n} onClick={() => update('durationNights', [n])}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition',
                      (p.durationNights?.[0] ?? 7) === n
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-500',
                    )}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Budget (total £)</label>
              <input
                type="number"
                value={p.budgetTotal ?? ''}
                onChange={e => update('budgetTotal', Number(e.target.value) || undefined)}
                placeholder="e.g. 4000"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Bags */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Bags per person</label>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(n => (
                  <button key={n} onClick={() => update('bagsPerPerson', n)}
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition',
                      (p.bagsPerPerson ?? 1) === n
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-500',
                    )}>
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Max stops */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">Max stops</label>
              <div className="flex gap-1.5">
                {[0, 1, 99].map(n => (
                  <button key={n} onClick={() => update('maxStops', n)}
                    className={cn(
                      'rounded-full border px-3 py-1 text-xs transition',
                      (p.maxStops ?? 99) === n
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-blue-500',
                    )}>
                    {n === 0 ? 'Direct' : n === 1 ? '1 stop' : 'Any'}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
