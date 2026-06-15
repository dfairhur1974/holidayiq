import type { FlightResult } from './types'

const BASE = 'https://api.duffel.com'

function headers() {
  const key = process.env.DUFFEL_API_KEY
  if (!key) throw new Error('DUFFEL_API_KEY not set')
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Duffel-Version': 'v2',
    Accept: 'application/json',
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

// Build a Skyscanner deep-link for a specific flight (best consumer booking page)
function skyscannerUrl(from: string, to: string, date: string): string {
  // Skyscanner format: /transport/flights/{from}/{to}/{YYMMDD}/
  const [y, m, d] = date.split('-')
  const yymmdd = `${y.slice(2)}${m}${d}`
  return `https://www.skyscanner.net/transport/flights/${from.toLowerCase()}/${to.toLowerCase()}/${yymmdd}/`
}

// Google Flights deep-link
function googleFlightsUrl(from: string, to: string, date: string): string {
  return `https://www.google.com/travel/flights/search?tfs=CBwQARowEgoyMDI2LTA5LTEyagwIAxIIL2cvMTFjc3lmKhIIARIMCgIgARABGAEiAkdC&q=flights+from+${from}+to+${to}+on+${date}`
}

// ─── Public search function ───────────────────────────────────────────────────

export async function searchFlights(
  origins: string[],
  destination: string,
  date: string,
  adults: number,
  children: number[],
  maxResults = 10,
  maxStops?: number,   // 0 = direct only, undefined = any
  flexDays = 0,        // search ±N days in addition to exact date
): Promise<FlightResult[]> {
  const passengers = [
    ...Array(adults).fill({ type: 'adult' }),
    ...children.map(() => ({ type: 'child' })),
  ]

  // Build list of dates to search (main date + flex window, capped at ±3 to limit API calls)
  const daysToSearch = buildDateRange(date, Math.min(flexDays, 3))

  // Search all origin airports × all dates in parallel
  const tasks = origins.flatMap(origin =>
    daysToSearch.map(d => searchOneOrigin(origin, destination, d, passengers, maxResults, maxStops))
  )

  const results = await Promise.allSettled(tasks)
  const all: FlightResult[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  // De-duplicate by id, sort by: date → price
  const seen = new Set<string>()
  const deduped = all.filter(f => {
    if (seen.has(f.id)) return false
    seen.add(f.id)
    return true
  })

  return deduped.sort((a, b) => {
    const da = a.departureTime.slice(0, 10)
    const db = b.departureTime.slice(0, 10)
    if (da !== db) return da < db ? -1 : 1
    return a.totalPriceGBP - b.totalPriceGBP
  })
}

function buildDateRange(date: string, flex: number): string[] {
  const dates: string[] = []
  for (let d = -flex; d <= flex; d++) {
    const dt = new Date(date + 'T12:00:00Z')
    dt.setUTCDate(dt.getUTCDate() + d)
    dates.push(dt.toISOString().split('T')[0])
  }
  return dates
}

async function searchOneOrigin(
  origin: string,
  destination: string,
  date: string,
  passengers: { type: string }[],
  maxResults: number,
  maxStops?: number,
): Promise<FlightResult[]> {
  const slice: Record<string, any> = { origin, destination, departure_date: date }
  if (maxStops !== undefined) slice.max_connections = maxStops

  const reqRes = await fetchWithTimeout(`${BASE}/air/offer_requests`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      data: { slices: [slice], passengers, cabin_class: 'economy' },
    }),
  })

  if (!reqRes.ok) {
    const err = await reqRes.text()
    throw new Error(`Duffel offer_request ${reqRes.status}: ${err}`)
  }

  const reqData = await reqRes.json()
  const requestId: string = reqData.data?.id
  if (!requestId) return []

  const offerRes = await fetchWithTimeout(
    `${BASE}/air/offers?offer_request_id=${requestId}&limit=${maxResults}&sort=total_amount`,
    { headers: headers() },
  )

  if (!offerRes.ok) {
    const err = await offerRes.text()
    throw new Error(`Duffel offers ${offerRes.status}: ${err}`)
  }

  const offerData = await offerRes.json()
  const offers: any[] = offerData.data ?? []
  const totalPassengers = passengers.length

  return offers.slice(0, 5).flatMap((offer): FlightResult[] => {
    const slice = offer.slices?.[0]
    if (!slice) return []
    const segments: any[] = slice.segments ?? []
    const first = segments[0]
    const last  = segments[segments.length - 1]
    if (!first || !last) return []

    const durationMinutes = parseISO(slice.duration ?? 'PT0H')
    const currency: string = offer.total_currency ?? 'GBP'
    const priceGBP  = toGBP(Number(offer.total_amount ?? 0), currency)
    const perPerson = priceGBP / totalPassengers
    const bags = (offer.passengers?.[0]?.baggages ?? [])
      .filter((b: any) => b.type === 'checked' && b.quantity > 0)
      .reduce((n: number, b: any) => n + (b.quantity ?? 0), 0)

    const depAirport = first?.origin?.iata_code ?? origin
    const arrAirport = last?.destination?.iata_code ?? destination
    const depDate    = (first?.departing_at ?? date).slice(0, 10)

    return [{
      id:               offer.id,
      airline:          first?.marketing_carrier?.name ?? '',
      airlineCode:      first?.marketing_carrier?.iata_code ?? '',
      departureAirport: depAirport,
      departureTime:    first?.departing_at ?? '',
      arrivalAirport:   arrAirport,
      arrivalTime:      last?.arriving_at ?? '',
      durationMinutes,
      stops: segments.length - 1,
      layovers: segments.slice(0, -1).map((s: any) => ({
        airport: s.destination?.iata_code ?? '',
        durationMinutes: 0,
      })),
      bagsIncluded:      bags,
      bagCostGBP:        bags === 0 ? 28 : undefined,
      pricePerPersonGBP: Math.round(perPerson),
      totalPriceGBP:     Math.round(priceGBP),
      source: 'Duffel',
      // Skyscanner deep-link — takes user straight to the flight search on Skyscanner
      bookingUrl: skyscannerUrl(depAirport, arrAirport, depDate),
      isReturn: false,
    }]
  })
}

export async function searchHotels(): Promise<never[]> {
  return []
}

function parseISO(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return 0
  return (Number(m[1] ?? 0) * 60) + Number(m[2] ?? 0)
}

const FX: Record<string, number> = { GBP: 1, EUR: 0.86, USD: 0.79, AED: 0.22 }
function toGBP(amount: number, currency: string): number {
  return amount * (FX[currency] ?? 0.79)
}
