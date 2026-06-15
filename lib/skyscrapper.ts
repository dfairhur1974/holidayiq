import type { FlightResult } from './types'

// Sky-Scrapper via RapidAPI — real airline data (EasyJet, Ryanair, BA, TUI, etc.)
// Docs: https://rapidapi.com/apiheya/api/sky-scrapper
// Requires: RAPIDAPI_KEY in .env.local

const BASE    = 'https://sky-scrapper.p.rapidapi.com/api/v1'
const HOST    = 'sky-scrapper.p.rapidapi.com'

// In-process cache for airport entity lookups — avoids repeat API calls
const ENTITY_CACHE = new Map<string, { skyId: string; entityId: string }>()

// Well-known UK departure airports — pre-seeded to skip lookup API call
const KNOWN: Record<string, { skyId: string; entityId: string }> = {
  LHR: { skyId: 'LHR', entityId: '95565050' },
  LGW: { skyId: 'LGW', entityId: '95565051' },
  LTN: { skyId: 'LTN', entityId: '95565058' },
  STN: { skyId: 'STN', entityId: '95565067' },
  LCY: { skyId: 'LCY', entityId: '95565041' },
  SEN: { skyId: 'SEN', entityId: '95565064' },
  MAN: { skyId: 'MAN', entityId: '95565056' },
  BHX: { skyId: 'BHX', entityId: '95565029' },
  BRS: { skyId: 'BRS', entityId: '95565031' },
  NCL: { skyId: 'NCL', entityId: '95565060' },
  EDI: { skyId: 'EDI', entityId: '95565038' },
  GLA: { skyId: 'GLA', entityId: '95565042' },
  // Popular holiday destinations
  TFS: { skyId: 'TFS', entityId: '95565068' },
  ACE: { skyId: 'ACE', entityId: '95565019' },
  PMI: { skyId: 'PMI', entityId: '95565063' },
  AGP: { skyId: 'AGP', entityId: '95565020' },
  ALC: { skyId: 'ALC', entityId: '95565021' },
  CFU: { skyId: 'CFU', entityId: '95565033' },
  RHO: { skyId: 'RHO', entityId: '95565065' },
  HER: { skyId: 'HER', entityId: '95565047' },
  KGS: { skyId: 'KGS', entityId: '95565053' },
  ZTH: { skyId: 'ZTH', entityId: '95565074' },
  PFO: { skyId: 'PFO', entityId: '95565062' },
  LCA: { skyId: 'LCA', entityId: '95565054' },
  MCO: { skyId: 'MCO', entityId: '95565059' },
  MIA: { skyId: 'MIA', entityId: '95565057' },
  TPA: { skyId: 'TPA', entityId: '95565069' },
  DXB: { skyId: 'DXB', entityId: '95565036' },
  FAO: { skyId: 'FAO', entityId: '95565040' },
  IBZ: { skyId: 'IBZ', entityId: '95565049' },
}

function headers() {
  return {
    'x-rapidapi-key':  process.env.RAPIDAPI_KEY ?? '',
    'x-rapidapi-host': HOST,
    'Content-Type':    'application/json',
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), ms)
  try { return await p } finally { clearTimeout(timer) }
}

async function getAirportIds(iata: string): Promise<{ skyId: string; entityId: string } | null> {
  if (KNOWN[iata]) return KNOWN[iata]
  if (ENTITY_CACHE.has(iata)) return ENTITY_CACHE.get(iata)!

  try {
    const res = await fetch(`${BASE}/flights/searchAirport?query=${iata}&locale=en-US`, { headers: headers() })
    if (!res.ok) return null
    const data = await res.json()
    const places: any[] = data.data ?? []
    const match = places.find((p: any) =>
      p.presentation?.subtitle?.toUpperCase().includes(iata) ||
      p.navigation?.localizedName?.toUpperCase().includes(iata) ||
      p.skyId === iata
    )
    if (!match) return null
    const result = { skyId: match.skyId, entityId: match.entityId }
    ENTITY_CACHE.set(iata, result)
    return result
  } catch {
    return null
  }
}

async function searchOneRoute(
  originIata: string,
  destIata: string,
  date: string,
  adults: number,
  children: number[],
): Promise<FlightResult[]> {
  const [originIds, destIds] = await Promise.all([
    getAirportIds(originIata),
    getAirportIds(destIata),
  ])
  if (!originIds || !destIds) return []

  const params = new URLSearchParams({
    originSkyId:          originIds.skyId,
    destinationSkyId:     destIds.skyId,
    originEntityId:       originIds.entityId,
    destinationEntityId:  destIds.entityId,
    date,
    adults:               String(adults),
    currency:             'GBP',
    market:               'UK',
    locale:               'en-GB',
    cabinClass:           'economy',
    sortBy:               'best',
    limit:                '10',
  })
  if (children.length > 0) params.set('children', String(children.length))

  const res = await fetch(`${BASE}/flights/searchFlights?${params}`, { headers: headers() })
  if (!res.ok) return []

  const data = await res.json()
  const itineraries: any[] = data.data?.itineraries ?? []
  const totalPassengers = adults + children.length

  return itineraries.slice(0, 6).flatMap((it: any): FlightResult[] => {
    const leg  = it.legs?.[0]
    if (!leg) return []
    const segs: any[] = leg.segments ?? []
    const first = segs[0]
    const last  = segs[segs.length - 1]
    if (!first || !last) return []

    const priceGBP   = Number(it.price?.raw ?? 0)
    const perPerson  = Math.round(priceGBP / totalPassengers)
    const durationMin = Math.round((leg.durationInMinutes ?? 0))

    // Bags: check if carry-on or checked bag included in cheapest fare
    const fareOptions: any[] = it.farePolicy ?? []
    const bagsIncluded = fareOptions.some((f: any) => f.isChangeAllowed || f.name?.toLowerCase().includes('bag')) ? 1 : 0

    return [{
      id:               it.id ?? `ss-${originIata}-${destIata}-${Date.now()}`,
      airline:          first.marketingCarrier?.name ?? leg.carriers?.marketing?.[0]?.name ?? '',
      airlineCode:      first.marketingCarrier?.alternateId ?? leg.carriers?.marketing?.[0]?.alternateId ?? '',
      departureAirport: leg.origin?.displayCode ?? originIata,
      departureTime:    leg.departure ?? '',
      arrivalAirport:   leg.destination?.displayCode ?? destIata,
      arrivalTime:      leg.arrival ?? '',
      durationMinutes:  durationMin,
      stops:            leg.stopCount ?? (segs.length - 1),
      layovers:         segs.slice(0, -1).map((s: any) => ({ airport: s.destination?.displayCode ?? '', durationMinutes: 0 })),
      bagsIncluded,
      pricePerPersonGBP: perPerson,
      totalPriceGBP:    Math.round(priceGBP),
      source:           'Sky-Scrapper',
      bookingUrl:       `https://www.skyscanner.net/transport/flights/${originIata.toLowerCase()}/${destIata.toLowerCase()}/${date.replace(/-/g,'')}/`,
      isReturn:         false,
    }]
  })
}

export async function searchFlightsRapid(
  origins: string[],
  destination: string,
  date: string,
  adults: number,
  children: number[],
): Promise<FlightResult[]> {
  if (!process.env.RAPIDAPI_KEY) return []

  const results = await Promise.allSettled(
    origins.slice(0, 3).map(origin =>
      withTimeout(searchOneRoute(origin, destination, date, adults, children), 10000)
    )
  )

  const all: FlightResult[] = []
  for (const r of results) {
    if (r.status === 'fulfilled') all.push(...r.value)
  }

  return all.sort((a, b) => a.totalPriceGBP - b.totalPriceGBP)
}
