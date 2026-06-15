'use client'
import type { ValueBreakdown } from '@/lib/types'
import { scoreColour, scoreBg } from '@/lib/scoring'
import { useState } from 'react'

interface Props { score: ValueBreakdown; compact?: boolean }

const FACTOR_LABELS: Record<keyof Omit<ValueBreakdown, 'total' | 'label'>, string> = {
  stars: 'Star rating', board: 'Board basis', roomType: 'Room type',
  bags: 'Baggage', stops: 'Flight stops', flightDuration: 'Flight duration',
  atol: 'ATOL protection', guestScore: 'Guest rating', transfer: 'Transfer',
  priceEfficiency: 'Price efficiency',
}

export default function ValueScoreBadge({ score, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const colour = scoreColour(score.label)
  const bg     = scoreBg(score.label)

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold transition-all hover:opacity-90"
        style={{ backgroundColor: bg, color: colour, border: `1px solid ${colour}` }}
      >
        <span className="text-lg font-bold">{score.total}</span>
        {!compact && <span className="text-xs">{score.label}</span>}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
            <h4 className="mb-3 font-semibold text-gray-800">Score breakdown</h4>
            <div className="space-y-2">
              {(Object.entries(FACTOR_LABELS) as [keyof typeof FACTOR_LABELS, string][]).map(([key, label]) => {
                const val = score[key] as number
                if (val === 0 && key !== 'stops') return null
                return (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{label}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.min(100, (val / 40) * 100)}%`, backgroundColor: colour }}
                        />
                      </div>
                      <span className="w-6 text-right font-medium" style={{ color: colour }}>{val}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 border-t pt-3 text-center">
              <span className="text-2xl font-bold" style={{ color: colour }}>{score.total}</span>
              <span className="ml-2 text-sm text-gray-500">/ 100 — {score.label}</span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
