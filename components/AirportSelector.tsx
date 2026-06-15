'use client'
import { useState } from 'react'
import { AIRPORT_GROUPS, AIRPORT_NAMES } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChevronDown, X, Plane } from 'lucide-react'

interface Props {
  value: string[]
  groupKey?: string
  onChange: (airports: string[], groupKey?: string) => void
}

export default function AirportSelector({ value, groupKey, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'groups' | 'individual'>('groups')

  const ALL_AIRPORTS = Object.values(AIRPORT_GROUPS).flatMap(g => g.airports)
    .filter((v, i, a) => a.indexOf(v) === i)

  const label = groupKey
    ? AIRPORT_GROUPS[groupKey]?.label
    : value.length === 1
    ? AIRPORT_NAMES[value[0]] ?? value[0]
    : value.length > 1
    ? `${value.length} airports selected`
    : 'Select departure airport'

  function selectGroup(key: string) {
    onChange(AIRPORT_GROUPS[key].airports, key)
    setOpen(false)
  }

  function toggleAirport(iata: string) {
    const next = value.includes(iata) ? value.filter(a => a !== iata) : [...value, iata]
    onChange(next, undefined)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-600"
      >
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-green-700" />
          <span className={cn('text-sm', value.length === 0 ? 'text-gray-400' : 'text-gray-800')}>{label}</span>
        </div>
        <ChevronDown className={cn('h-4 w-4 text-gray-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
            {/* Tabs */}
            <div className="flex border-b">
              {(['groups', 'individual'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    'flex-1 py-2.5 text-sm font-medium capitalize transition',
                    tab === t ? 'border-b-2 border-green-700 text-green-700' : 'text-gray-500 hover:text-gray-700'
                  )}
                >
                  {t === 'groups' ? 'Airport Groups' : 'Individual'}
                </button>
              ))}
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {tab === 'groups' ? (
                Object.entries(AIRPORT_GROUPS).map(([key, group]) => (
                  <button
                    key={key}
                    onClick={() => selectGroup(key)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-green-50',
                      groupKey === key && 'bg-green-50 font-medium text-green-700'
                    )}
                  >
                    <span>{group.label}</span>
                    <span className="text-xs text-gray-400">{group.airports.join(', ')}</span>
                  </button>
                ))
              ) : (
                <div className="grid grid-cols-2 gap-1">
                  {ALL_AIRPORTS.map(iata => (
                    <button
                      key={iata}
                      onClick={() => toggleAirport(iata)}
                      className={cn(
                        'flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition hover:bg-gray-50',
                        value.includes(iata) && 'bg-green-50 font-medium text-green-700'
                      )}
                    >
                      <span className="font-mono font-bold">{iata}</span>
                      <span className="truncate text-gray-500">{AIRPORT_NAMES[iata]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {value.length > 0 && (
              <div className="border-t p-2">
                <button
                  onClick={() => { onChange([], undefined); setOpen(false) }}
                  className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs text-gray-500 hover:bg-gray-50"
                >
                  <X className="h-3 w-3" /> Clear selection
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
