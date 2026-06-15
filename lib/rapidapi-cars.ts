import type { CarResult } from './types'

// Car hire via Sky-Scrapper on RapidAPI
// Requires RAPIDAPI_KEY — already subscribed via sky-scrapper.p.rapidapi.com

const HOST = 'sky-scrapper.p.rapidapi.com'

// Cache city → entityId lookups so each destination only costs one API call ever
const ENTITY_CACHE = new Map<string, string>()

// Pre-seeded entity IDs for common holiday destinations (avoids lookup call)
const KNOWN_ENTITIES: Record<string, string> = {
  // Canaries
  TFS: '95673828', ACE: '95673556', FUE: '95673845',
  // Balearics
  PMI: '95674027', IBZ: '95673916', MAH: '95673978',
  // Spain mainland
  AGP: '95673558', ALC: '95673573', BCN: '95673634', MAD: '95673970',
  // Portugal
  FAO: '95673831', LIS: '95673955', OPO: '95674015',
  // Greece
  CFU: '95673752', RHO: '95674046', HER: '95673893', KGS: '95673931',
  ATH: '95673623',
  // Cyprus
  PFO: '95674028', LCA: '95673941',
  // Florida / USA
  MCO: '95673984', MIA: '95673987', TPA: '95674099', FLL: '95673848',
  // Other popular
  DXB: '95673793', CDG: '95673710', FCO: '95673835',
}

function headers() {
  return {
    'x-rapidapi-key':  process.env.RAPIDAPI_KEY ?? '',
    'x-rapidapi-host': HOST,
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try { return await p } finally { clearTimeout(t) }
}

async function getEntityId(iata: string): Promise<string | null> {
  if (KNOWN_ENTITIES[iata]) return KNOWN_ENTITIES[iata]
  if (ENTITY_CACHE.has(iata)) return ENTITY_CACHE.get(iata)!

  try {
    const res = await fetch(
      `https://${HOST}/api/v1/cars/searchLocation?query=${iata}&locale=en-US`,
      { headers: headers() },
    )
    if (!res.ok) return null
    const data = await res.json()
    const places: any[] = data.data ?? []
    const match = places.find((p: any) => p.iata === iata || p.skyId === iata) ?? places[0]
    if (!match) return null
    const id = match.entityId ?? match.navigation?.entityId
    if (id) ENTITY_CACHE.set(iata, String(id))
    return id ? String(id) : null
  } catch {
    return null
  }
}

export async function searchCarsRapid(
  destCode: string,
  pickupDate: string,
  dropoffDate: string,
  isUSA: boolean,
): Promise<CarResult[]> {
  if (!process.env.RAPIDAPI_KEY) return []

  const days = Math.max(1,
    (new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / 86400000,
  )

  try {
    const entityId = await withTimeout(getEntityId(destCode), 6000)
    if (!entityId) return []

    const params = new URLSearchParams({
      pickUpEntityId:   entityId,
      dropOffEntityId:  entityId,
      pickUpDate:       pickupDate,
      dropOffDate:      dropoffDate,
      currency:         'GBP',
      market:           'UK',
      locale:           'en-GB',
    })

    const res = await withTimeout(
      fetch(`https://${HOST}/api/v1/cars/searchCars?${params}`, { headers: headers() }),
      10000,
    )
    if (!res.ok) return []

    const data = await res.json()
    const quotes: any[] = data?.data?.quotes ?? data?.quotes ?? []

    return quotes.slice(0, 16).map((q: any, i: number): CarResult => ({
      id:               `car-live-${i}`,
      supplier:         q.agent?.name ?? q.provider?.name ?? q.vendorName ?? 'Car Hire',
      vehicleClass:     q.vehicleInfo?.class ?? q.vehicleClass ?? 'Economy',
      seats:            q.vehicleInfo?.seats ?? q.seats ?? 5,
      doors:            q.vehicleInfo?.doors ?? q.doors ?? 4,
      transmission:     (q.vehicleInfo?.transmission ?? q.transmission ?? 'automatic').toLowerCase(),
      airConditioning:  q.vehicleInfo?.airConditioning ?? true,
      unlimitedMileage: !!q.vehicleInfo?.unlimitedMileage,
      fuelPolicy:       q.vehicleInfo?.fuelPolicy ?? 'Full-to-Full',
      excessGBP:        q.vehicleInfo?.excessAmount ?? (isUSA ? 0 : 1000),
      cdwIncluded:      q.vehicleInfo?.cdwIncluded != null ? !!q.vehicleInfo.cdwIncluded : isUSA,
      cdwCostGBP:       (q.vehicleInfo?.cdwIncluded ?? isUSA) ? 0 : 12,
      pricePerDayGBP:   Math.round((q.price?.amount ?? q.totalPrice ?? 0) / days),
      totalPriceGBP:    Math.round(q.price?.amount ?? q.totalPrice ?? 0),
      pickupLocation:   `${destCode} Airport`,
      isAirportPickup:  true,
      source:           'RapidAPI',
      bookingUrl:       q.deepLink ?? q.bookingUrl ?? `https://www.skyscanner.net/car-hire`,
    }))
  } catch (e) {
    console.warn('RapidAPI car search failed:', e)
    return []
  }
}
