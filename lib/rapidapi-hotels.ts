import type { HotelResult } from './types'

// Booking.com via RapidAPI (Apidojo)
// Host: apidojo-booking-v1.p.rapidapi.com
// Endpoint: /properties/list-by-map — bbox-based search, no dest_id lookup needed

const HOST = 'apidojo-booking-v1.p.rapidapi.com'

function headers() {
  return {
    'Content-Type':    'application/json',
    'x-rapidapi-key':  process.env.RAPIDAPI_KEY ?? '',
    'x-rapidapi-host': HOST,
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), ms)
  try { return await p } finally { clearTimeout(t) }
}

// Bounding boxes for popular holiday destinations: "south,north,west,east"
const DEST_BBOX: Record<string, string> = {
  // Canaries
  TFS: '27.95,28.55,-16.95,-16.25',   // Tenerife South
  ACE: '28.80,29.25,-13.85,-13.40',   // Lanzarote
  FUE: '28.00,28.55,-14.05,-13.75',   // Fuerteventura
  // Balearics
  PMI: '39.40,39.75,2.55,3.20',       // Palma Mallorca
  IBZ: '38.80,39.10,1.20,1.60',       // Ibiza
  MAH: '39.80,40.00,3.80,4.20',       // Menorca
  // Spain mainland
  AGP: '36.50,36.85,-4.65,-4.25',     // Malaga / Costa del Sol
  ALC: '38.20,38.55,-0.65,-0.20',     // Alicante
  BCN: '41.30,41.50,2.05,2.25',       // Barcelona
  MAD: '40.35,40.55,-3.75,-3.55',     // Madrid
  // Portugal
  FAO: '37.00,37.30,-8.20,-7.80',     // Algarve
  LIS: '38.65,38.80,-9.25,-9.10',     // Lisbon
  OPO: '41.10,41.25,-8.70,-8.55',     // Porto
  // Greece
  CFU: '39.50,39.80,19.75,20.20',     // Corfu
  RHO: '36.00,36.50,27.75,28.30',     // Rhodes
  HER: '35.20,35.55,24.80,25.35',     // Heraklion / Crete
  KGS: '36.70,37.00,26.90,27.35',     // Kos
  ZTH: '37.65,38.00,20.70,21.00',     // Zakynthos
  SKI: '39.10,39.25,23.40,23.55',     // Skiathos
  JMK: '37.35,37.55,25.25,25.45',     // Mykonos
  JTR: '36.35,36.55,25.35,25.55',     // Santorini
  ATH: '37.90,38.10,23.65,23.85',     // Athens
  // Cyprus
  PFO: '34.70,34.90,32.30,32.55',     // Paphos
  LCA: '34.85,35.05,33.55,33.75',     // Larnaca
  // Middle East
  DXB: '25.00,25.45,55.10,55.55',     // Dubai
  // Florida / USA
  MCO: '28.30,28.75,-81.65,-81.15',   // Orlando
  MIA: '25.60,26.00,-80.45,-80.10',   // Miami
  TPA: '27.85,28.10,-82.65,-82.40',   // Tampa
  FLL: '26.00,26.25,-80.25,-80.05',   // Fort Lauderdale
}

export async function searchHotelsBookingCom(
  destCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  minStars: number,
  maxResults = 10,
): Promise<HotelResult[]> {
  if (!process.env.RAPIDAPI_KEY) return []

  const bbox = DEST_BBOX[destCode]
  if (!bbox) return []

  const nights = Math.max(1,
    (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000,
  )

  // Build star filter: "class::3,class::4,class::5" for minStars=3
  const starClasses = minStars > 0
    ? Array.from({ length: 6 - minStars }, (_, i) => `class::${minStars + i}`).join(',')
    : 'class::1,class::2,class::3,class::4,class::5'

  const params = new URLSearchParams({
    bbox,
    checkin:                checkIn,
    checkout:               checkOut,
    room_qty:               '1',
    guest_qty:              String(adults),
    price_filter_currencycode: 'GBP',
    languagecode:           'en-gb',
    travel_purpose:         'leisure',
    order_by:               'popularity',
    categories_filter:      starClasses,
    offset:                 '0',
  })

  try {
    const res = await withTimeout(
      fetch(`https://${HOST}/properties/list-by-map?${params}`, { headers: headers() }),
      12000,
    )
    if (!res.ok) {
      console.warn('Booking.com hotels HTTP', res.status, await res.text().catch(() => ''))
      return []
    }

    const data = await res.json()
    const hotels: any[] = data.result ?? data.data ?? []

    return hotels
      .filter(h => !minStars || (h.class ?? 0) >= minStars)
      .slice(0, maxResults)
      .map((h: any): HotelResult => {
        const rawPrice  = h.composite_price_breakdown?.gross_amount_per_night?.value
          ?? h.min_total_price
          ?? 0
        const pricePerNight = Math.round(rawPrice)
        const total = Math.round(pricePerNight * nights)
        return {
          id:                `bc-${h.hotel_id ?? h.id}`,
          name:              h.hotel_name ?? h.name ?? 'Unknown Hotel',
          stars:             Math.round(h.class ?? minStars ?? 4),
          guestScore:        h.review_score ? Number(h.review_score) : undefined,
          guestScoreSource:  'Booking.com',
          boardOptions:      ['RO', 'BB'],
          roomTypes:         ['standard'],
          distanceBeachKm:   h.distance_to_beach,
          distanceAirportKm: undefined,
          facilities:        (h.hotel_facilities_limited ?? []).slice(0, 6)
            .map((f: any) => String(f).toLowerCase().replace(/\s+/g, '-')),
          pricePerNightGBP:  pricePerNight,
          totalPriceGBP:     total,
          atolProtected:     false,
          source:            'Booking.com',
          bookingUrl:        h.url ?? `https://www.booking.com/hotel/gb/${h.hotel_id}.html`,
          lat:               h.latitude,
          lng:               h.longitude,
          address:           h.city ?? h.address ?? '',
          imageUrl:          h.main_photo_url,
        }
      })
  } catch (e) {
    console.warn('Booking.com hotel search failed:', e)
    return []
  }
}
