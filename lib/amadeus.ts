import type { FlightResult, HotelResult } from './types'

// Amadeus self-service free tier — sign up at developers.amadeus.com
// Covers: Flight Offers Search, Hotel List, Hotel Offers Search

const BASE = 'https://test.api.amadeus.com'

let _token: string | null = null
let _tokenExpiry = 0

async function getToken(): Promise<string> {
  if (_token && Date.now() < _tokenExpiry) return _token

  const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID ?? '',
      client_secret: process.env.AMADEUS_CLIENT_SECRET ?? '',
    }),
  })

  if (!res.ok) throw new Error(`Amadeus auth failed: ${res.status}`)
  const data = await res.json()
  _token = data.access_token
  _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000
  return _token!
}

async function amadeusGet(path: string, params: Record<string, string>): Promise<any> {
  const token = await getToken()
  const url = `${BASE}${path}?${new URLSearchParams(params)}`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Amadeus ${path} failed ${res.status}: ${err}`)
  }
  return res.json()
}

// ─── Flights ─────────────────────────────────────────────────────────────────

export async function searchFlights(
  origins: string[],
  destination: string,
  date: string,
  adults: number,
  children: number[],
  maxResults = 20,
): Promise<FlightResult[]> {
  const results: FlightResult[] = []

  for (const origin of origins.slice(0, 3)) { // limit to 3 airports per call
    try {
      const params: Record<string, string> = {
        originLocationCode: origin,
        destinationLocationCode: destination,
        departureDate: date,
        adults: String(adults),
        max: String(maxResults),
        currencyCode: 'GBP',
      }
      if (children.length > 0) params.children = String(children.length)

      const data = await amadeusGet('/v2/shopping/flight-offers', params)
      const offers = data.data ?? []

      for (const offer of offers.slice(0, 5)) {
        const itinerary = offer.itineraries?.[0]
        if (!itinerary) continue
        const segments = itinerary.segments ?? []
        const first = segments[0]
        const last = segments[segments.length - 1]

        const durationStr: string = itinerary.duration ?? 'PT0H'
        const durationMinutes = parseDuration(durationStr)

        const price = Number(offer.price?.grandTotal ?? 0)
        const total = price * (adults + children.length)

        results.push({
          id: offer.id,
          airline: first?.carrierCode ?? '',
          airlineCode: first?.carrierCode ?? '',
          departureAirport: first?.departure?.iataCode ?? origin,
          departureTime: first?.departure?.at ?? '',
          arrivalAirport: last?.arrival?.iataCode ?? destination,
          arrivalTime: last?.arrival?.at ?? '',
          durationMinutes,
          stops: segments.length - 1,
          layovers: segments.slice(0, -1).map((s: any) => ({
            airport: s.arrival?.iataCode ?? '',
            durationMinutes: 0,
          })),
          bagsIncluded: 0, // Amadeus free tier doesn't always include ancillary
          pricePerPersonGBP: price,
          totalPriceGBP: total,
          source: 'Amadeus',
          bookingUrl: `https://www.skyscanner.net/transport/flights/${origin}/${destination}/${date.replace(/-/g, '')}`,
          isReturn: false,
        })
      }
    } catch (e) {
      console.warn(`Amadeus flight search failed for ${origin}:`, e)
    }
  }

  return results
}

// ─── Hotels ──────────────────────────────────────────────────────────────────

export async function searchHotels(
  cityCode: string,
  checkIn: string,
  checkOut: string,
  adults: number,
  minStars: number,
  maxResults = 20,
): Promise<HotelResult[]> {
  try {
    // Step 1: get hotel list for city
    const listData = await amadeusGet('/v1/reference-data/locations/hotels/by-city', {
      cityCode,
      ratings: String(minStars),
    })
    const hotels = (listData.data ?? []).slice(0, maxResults)
    const hotelIds = hotels.map((h: any) => h.hotelId).join(',')
    if (!hotelIds) return []

    // Step 2: get offers for those hotels
    const offersData = await amadeusGet('/v3/shopping/hotel-offers', {
      hotelIds,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults: String(adults),
      currency: 'GBP',
      bestRateOnly: 'true',
    })

    const nights = Math.max(1,
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000
    )

    return (offersData.data ?? []).slice(0, maxResults).map((item: any): HotelResult => {
      const hotel = item.hotel
      const offer = item.offers?.[0]
      const ppn = Number(offer?.price?.total ?? 0) / nights

      return {
        id: hotel.hotelId,
        name: hotel.name ?? 'Unknown Hotel',
        stars: Number(hotel.rating ?? minStars),
        guestScore: hotel.score ? Number(hotel.score) : undefined,
        guestScoreSource: 'Amadeus',
        boardOptions: ['RO'],
        roomTypes: ['standard'],
        distanceBeachKm: undefined,
        distanceAirportKm: undefined,
        facilities: [],
        pricePerNightGBP: ppn,
        totalPriceGBP: Number(offer?.price?.total ?? 0),
        atolProtected: false,
        source: 'Amadeus',
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(hotel.name)}`,
        lat: hotel.latitude,
        lng: hotel.longitude,
        address: hotel.address?.cityName,
      }
    })
  } catch (e) {
    console.warn('Amadeus hotel search failed:', e)
    return []
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseDuration(iso: string): number {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!m) return 0
  return (Number(m[1] ?? 0) * 60) + Number(m[2] ?? 0)
}
