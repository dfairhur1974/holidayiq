'use client'
import { useEffect } from 'react'
import { Search, Sparkles, Loader2, CalendarDays, Users, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTHS   = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS     = Array.from({ length: 31 }, (_, i) => i + 1)
const CUR_YEAR = new Date().getFullYear()
const YEARS    = [CUR_YEAR, CUR_YEAR + 1, CUR_YEAR + 2]
const FLEX_OPTS = [0, 1, 2, 3, 7, 14]

export interface DateState {
  day: string; month: string; year: string
  flexAfter: string; flexBefore: string
}

export interface PeopleState {
  adults: number
  childCount: number
  childAges: number[]
}

/** Build the date suffix appended to the query before parsing */
export function buildDateSuffix(d: DateState): string {
  if (!d.day || !d.month || !d.year) return ''
  let s = ` departing ${d.day} ${d.month} ${d.year}`
  const after  = parseInt(d.flexAfter)
  const before = parseInt(d.flexBefore)
  if (after > 0 || before > 0) s += ` flex -${before} +${after} days`
  return s
}

interface Props {
  // Controlled state — all managed by parent
  query:       string
  onQueryChange: (q: string) => void
  date:        DateState
  onDateChange: (d: DateState) => void
  people:      PeopleState
  onPeopleChange: (p: PeopleState) => void

  onSearch:  () => void
  loading?:  boolean
  className?: string
}

function Select({
  value, onChange, children, className,
}: { value: string; onChange: (v: string) => void; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-gray-200 bg-white py-2 pl-3 pr-7 text-sm text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
    </div>
  )
}

export default function SearchBar({
  query, onQueryChange,
  date, onDateChange,
  people, onPeopleChange,
  onSearch, loading = false, className,
}: Props) {

  // Keep child ages array in sync with count
  useEffect(() => {
    const { childCount, childAges } = people
    if (childAges.length !== childCount) {
      const next = [...childAges]
      while (next.length < childCount) next.push(8)
      onPeopleChange({ ...people, childAges: next.slice(0, childCount) })
    }
  }, [people.childCount]) // eslint-disable-line

  function setDate<K extends keyof DateState>(key: K, val: string) {
    onDateChange({ ...date, [key]: val })
  }

  const dateComplete = !!(date.day && date.month && date.year)
  const canSearch    = (query.trim() || dateComplete) && !loading

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (canSearch) onSearch()
  }

  return (
    <div className={cn('w-full', className)}>
      <form onSubmit={handleSubmit}>
        <div className="rounded-2xl border-2 border-gray-200 bg-white shadow-lg focus-within:border-blue-500 focus-within:shadow-blue-100 transition-all">

          {/* ── Text input ───────────────────────────────────────────── */}
          <div className="flex items-start gap-3 px-4 pt-4 pb-3">
            <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
              <Sparkles className="h-4 w-4 text-blue-600" />
            </div>
            <textarea
              value={query}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e) } }}
              placeholder="Destination, board basis, room type — or describe your ideal holiday…"
              rows={2}
              className="flex-1 resize-none bg-transparent text-base text-gray-800 placeholder:text-gray-400 focus:outline-none"
            />
            {query && (
              <button type="button" onClick={() => onQueryChange('')}
                className="mt-1 rounded p-1 text-gray-300 hover:text-gray-500">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* ── Date row ─────────────────────────────────────────────── */}
          <div className="mx-4 border-t border-gray-100" />
          <div className="flex flex-wrap items-center gap-2 px-4 py-3">
            <CalendarDays className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Departure</span>

            <Select value={date.day} onChange={v => setDate('day', v)} className="w-20">
              <option value="">Day</option>
              {DAYS.map(d => <option key={d} value={String(d)}>{d}</option>)}
            </Select>
            <Select value={date.month} onChange={v => setDate('month', v)} className="w-32">
              <option value="">Month</option>
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select value={date.year} onChange={v => setDate('year', v)} className="w-24">
              <option value="">Year</option>
              {YEARS.map(y => <option key={y} value={String(y)}>{y}</option>)}
            </Select>

            <span className="hidden text-xs text-gray-300 sm:block">|</span>
            <span className="hidden text-xs font-medium text-gray-500 sm:block">Window</span>

            <Select value={date.flexBefore} onChange={v => setDate('flexBefore', v)} className="w-24">
              {FLEX_OPTS.map(n => <option key={n} value={String(n)}>− {n} day{n !== 1 ? 's' : ''}</option>)}
            </Select>
            <Select value={date.flexAfter} onChange={v => setDate('flexAfter', v)} className="w-24">
              {FLEX_OPTS.map(n => <option key={n} value={String(n)}>+ {n} day{n !== 1 ? 's' : ''}</option>)}
            </Select>

            {dateComplete && (
              <span className="ml-auto rounded-full bg-blue-50 px-3 py-0.5 text-xs font-medium text-blue-700">
                {parseInt(date.flexBefore) > 0 && `−${date.flexBefore}d / `}
                {date.day} {date.month.slice(0, 3)} {date.year}
                {parseInt(date.flexAfter) > 0 && ` / +${date.flexAfter}d`}
              </span>
            )}
          </div>

          {/* ── People row ───────────────────────────────────────────── */}
          <div className="mx-4 border-t border-gray-100" />
          <div className="flex flex-wrap items-center gap-3 px-4 py-3">
            <Users className="h-4 w-4 shrink-0 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">People</span>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Adults</span>
              <Select
                value={String(people.adults)}
                onChange={v => onPeopleChange({ ...people, adults: parseInt(v) })}
                className="w-16"
              >
                {[1,2,3,4,5,6,7,8].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">Children</span>
              <Select
                value={String(people.childCount)}
                onChange={v => onPeopleChange({ ...people, childCount: parseInt(v) })}
                className="w-16"
              >
                {[0,1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </Select>
            </div>

            {people.childAges.map((age, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-xs text-gray-400">Child {i+1}</span>
                <Select
                  value={String(age)}
                  onChange={v => {
                    const next = [...people.childAges]
                    next[i] = parseInt(v)
                    onPeopleChange({ ...people, childAges: next })
                  }}
                  className="w-20"
                >
                  {Array.from({length: 18}, (_, a) => (
                    <option key={a} value={a}>{a === 0 ? 'Under 1' : `${a} yrs`}</option>
                  ))}
                </Select>
              </div>
            ))}

            {/* Search button */}
            <button
              type="submit"
              disabled={!canSearch}
              className="ml-auto flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow transition hover:bg-blue-700 disabled:opacity-40"
            >
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" />Searching…</>
                : <><Search className="h-4 w-4" />Search</>}
            </button>
          </div>

        </div>
      </form>
    </div>
  )
}
