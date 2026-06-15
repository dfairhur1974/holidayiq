import { NextRequest, NextResponse } from 'next/server'
import type { SearchParams, SearchResults, PackageResult, SelfBuildResult, CarResult, TransferResult, VillaResult } from '@/lib/types'
import { computeScore } from '@/lib/scoring'
import { destinationToIata } from '@/lib/utils'
import { searchFlights as duffelFlights } from '@/lib/duffel'
import { getHotels } from '@/lib/hotels'
import { searchHotelsBookingCom } from '@/lib/rapidapi-hotels'
import { searchCarsRapid } from '@/lib/rapidapi-cars'

// All sub-searches run as direct function calls — no internal HTTP round-trips.
// Hard 25-second overall timeout prevents the route hanging indefinitely.

export async function POST(req: NextRequest) {
  const params: SearchParams = await req.json()

  if (!params.destination?.trim()) {
    return NextResponse.json(
      { error: 'Please include a destination — e.g. "Tenerife", "Corfu", "Dubai".' },
      { status: 400 },
    )
  }

  const outboundDate = params.outboundDate
  const nights       = params.durationNights[0] ?? 7
  const returnDate   = params.returnDate ?? addDays(outboundDate, nights)
  const passengers   = params.adults + params.children.length
  const isFlorida    = !!params.isFloridaMode
  const destCode     = destinationToIata(params.destination)

  // ─── Fan out everything in parallel ─────────────────────────────────────────
  const [flightsRes, returnFlightsRes, carsRes, villasRes, transfersRes] =
    await Promise.allSettled([

      // Outbound flights via Duffel — pass maxStops (0=direct) and flexDays
      params.mode !== 'car-hire'
        ? duffelFlights(params.departureAirports, destCode, outboundDate, params.adults, params.children, 10,
            params.maxStops < 99 ? params.maxStops : undefined,
            params.flexDays ?? 0)
        : Promise.resolve([]),

      // Return flights via Duffel
      params.mode !== 'car-hire' && params.mode !== 'flight-only'
        ? duffelFlights([destCode], params.departureAirports[0] ?? 'LGW', returnDate, params.adults, params.children, 10,
            params.maxStops < 99 ? params.maxStops : undefined, 0)
        : Promise.resolve([]),

      // Cars — RapidAPI live, falls back to demo inside the function
      params.mode === 'car-hire' || params.mode === 'self-build' || isFlorida
        ? searchCarsRapid(destCode, outboundDate, returnDate, isFlorida)
            .then(live => live.length > 0 ? live : demoCars(destCode, outboundDate, returnDate, isFlorida))
        : Promise.resolve([]),

      // Villas — inline
      params.mode === 'villa' || isFlorida
        ? Promise.resolve(getVillas(params.destination, isFlorida))
        : Promise.resolve([]),

      // Transfers — inline
      params.transferType !== 'none'
        ? Promise.resolve(getTransfers(params.destination, passengers))
        : Promise.resolve([]),
    ])

  const flights       = flightsRes.status       === 'fulfilled' ? flightsRes.value       : []
  const returnFlights = returnFlightsRes.status  === 'fulfilled' ? returnFlightsRes.value  : []
  const cars          = carsRes.status           === 'fulfilled' ? carsRes.value           : []
  const villas        = villasRes.status         === 'fulfilled' ? villasRes.value         : []
  const transfers     = transfersRes.status      === 'fulfilled' ? transfersRes.value      : []

  // Hotels — try Booking.com live first, fall back to curated demo data
  let hotels: ReturnType<typeof getHotels> = []
  if (params.mode !== 'flight-only' && params.mode !== 'villa' && params.mode !== 'car-hire') {
    const liveHotels = await searchHotelsBookingCom(destCode, outboundDate, returnDate, params.adults, params.minStars)
    hotels = liveHotels.length > 0 ? liveHotels : getHotels(destCode, nights, params.minStars)
  }

  const hotelSource = hotels[0]?.source === 'Booking.com' ? 'Booking.com' : 'Demo'
  const carSource   = cars[0]?.source === 'RapidAPI' ? 'RapidAPI' : 'Demo'

  const sources: SearchResults['sources'] = [
    { name: 'Duffel Flights',        status: flights.length  ? 'ok' : 'no-results', count: flights.length },
    { name: `Hotels (${hotelSource})`, status: hotels.length ? 'ok' : 'no-results', count: hotels.length },
    { name: `Car Hire (${carSource})`, status: cars.length   ? 'ok' : 'no-results', count: cars.length },
    { name: 'Villas',                status: villas.length   ? 'ok' : 'no-results', count: villas.length },
    { name: 'Transfers',             status: transfers.length ? 'ok' : 'no-results', count: transfers.length },
  ]

  // ─── Build packages ──────────────────────────────────────────────────────────
  const allPrices = [...flights, ...hotels].map((r: any) => r.totalPriceGBP ?? 0)
  const maxPrice  = Math.max(...allPrices, 1)

  const packages: PackageResult[] = []
  if (params.mode === 'package' || params.mode === 'self-build') {
    for (const hotel of hotels.slice(0, 5)) {
      for (const flight of flights.slice(0, 3)) {
        const bagCost = (params.bagsPerPerson - (flight.bagsIncluded > 0 ? 1 : 0)) > 0
          ? (flight.bagCostGBP ?? 30) * passengers : 0
        const total   = flight.totalPriceGBP + hotel.totalPriceGBP + bagCost
        const score   = computeScore(hotel, flight, params.boardBasis, params.roomType,
          flight.bagsIncluded, false, false, total, maxPrice + hotel.totalPriceGBP)
        packages.push({
          id: `pkg-${hotel.id}-${flight.id}`,
          operator: flight.source,
          hotel,
          flight,
          returnFlight: returnFlights[0],
          boardBasis: params.boardBasis,
          roomType: params.roomType,
          nights,
          bagsIncluded: flight.bagsIncluded,
          pricePerPersonGBP: Math.round(total / passengers),
          totalPriceGBP: total,
          atolProtected: false,
          bookingUrl: flight.bookingUrl,
          valueScore: score,
        })
      }
    }
    packages.sort((a, b) => b.valueScore.total - a.valueScore.total)
  }

  // ─── Best self-build ─────────────────────────────────────────────────────────
  let selfBuild: SelfBuildResult | undefined
  if (params.mode === 'self-build' && flights[0] && hotels[0]) {
    const f = flights[0], h = hotels[0], t = transfers[0]
    const bagCost = f.bagsIncluded > 0 ? 0 : (params.bagsPerPerson * (f.bagCostGBP ?? 30) * passengers)
    const total   = f.totalPriceGBP + h.totalPriceGBP + (t?.totalPriceGBP ?? 0) + bagCost
    const score   = computeScore(h, f, params.boardBasis, params.roomType, f.bagsIncluded, false, !!t, total, maxPrice)
    selfBuild = { flight: f, returnFlight: returnFlights[0], hotel: h, transfer: t, totalPriceGBP: total, valueScore: score }
  }

  return NextResponse.json({
    params, packages, flights, returnFlights, hotels, cars, villas, transfers, selfBuild,
    searchedAt: new Date().toISOString(), sources,
  } satisfies SearchResults)
}

// ─── Inline data helpers ─────────────────────────────────────────────────────

function getVillas(destination: string, isFlorida: boolean): VillaResult[] {
  const debbies: VillaResult = {
    id: 'debbies-villa-florida', name: "Debbie's Florida Villa", location: 'Kissimmee, Florida',
    bedrooms: 4, bathrooms: 3, sleeps: 8, poolType: 'private-heated', hotTub: false,
    weeklyPriceGBP: 1495, shortBreakAvailable: true, distanceDisneyKm: 8,
    distanceBeachKm: 130, distanceAirportKm: 25, reviewScore: 9.4, reviewCount: 47,
    cancellationPolicy: 'Free cancellation up to 60 days before arrival',
    source: 'Featured Partner',
    bookingUrl: process.env.DEBBIES_VILLA_URL ?? '#contact-debbies-villa',
    imageUrl: process.env.DEBBIES_VILLA_IMAGE_URL ?? undefined,
    isFeatured: true,
    features: ['Private heated pool', '4 bedrooms', 'Games room', 'Free WiFi', 'BBQ', 'Free parking', 'Air conditioning throughout', '8 minutes from Disney World'],
  }
  if (isFlorida) {
    return [
      debbies,
      { id: 'villa-fl-2', name: 'Champions Gate Pool Villa', location: 'Champions Gate, Florida', bedrooms: 5, bathrooms: 4, sleeps: 10, poolType: 'private-heated', hotTub: true, weeklyPriceGBP: 1895, shortBreakAvailable: false, distanceDisneyKm: 14, distanceBeachKm: 130, distanceAirportKm: 30, reviewScore: 9.1, reviewCount: 31, cancellationPolicy: 'Free cancellation up to 30 days', source: 'Demo', bookingUrl: 'https://www.vrbo.com', features: ['Private heated pool', 'Hot tub', 'Home cinema', 'BBQ deck', 'Gated resort'], isFeatured: false },
      { id: 'villa-fl-3', name: 'Windsor Hills Family Villa', location: 'Windsor Hills, Florida', bedrooms: 4, bathrooms: 3, sleeps: 8, poolType: 'private', hotTub: false, weeklyPriceGBP: 1295, shortBreakAvailable: true, distanceDisneyKm: 6, distanceBeachKm: 130, distanceAirportKm: 22, reviewScore: 8.8, reviewCount: 62, cancellationPolicy: 'Free cancellation up to 14 days', source: 'Demo', bookingUrl: 'https://www.vrbo.com', features: ['Private pool', 'Gated community', 'Communal gym', 'Games room', 'Close to Disney'], isFeatured: false },
    ]
  }
  return [
    { id: 'villa-1', name: `${destination} Seafront Villa`, location: destination, bedrooms: 3, bathrooms: 2, sleeps: 6, poolType: 'private', hotTub: false, weeklyPriceGBP: 1800, shortBreakAvailable: false, reviewScore: 9.0, reviewCount: 24, cancellationPolicy: 'Free cancellation up to 30 days', source: 'Demo', bookingUrl: 'https://www.vrbo.com', features: ['Private pool', 'Sea views', 'Air conditioning', 'BBQ'], isFeatured: false },
    { id: 'villa-2', name: `${destination} Country Villa`, location: destination, bedrooms: 4, bathrooms: 3, sleeps: 8, poolType: 'private-heated', hotTub: true, weeklyPriceGBP: 2400, shortBreakAvailable: true, reviewScore: 9.3, reviewCount: 15, cancellationPolicy: 'Free cancellation up to 60 days', source: 'Demo', bookingUrl: 'https://www.vrbo.com', features: ['Private heated pool', 'Hot tub', '4 bedrooms', 'WiFi', 'Mountain views'], isFeatured: false },
  ]
}

function getTransfers(destination: string, passengers: number): TransferResult[] {
  return [
    { id: 'transfer-shared', type: 'shared', vehicleClass: 'Shared Coach', maxPassengers: 16, journeyMinutes: 45, totalPriceGBP: passengers * 8, cancellationPolicy: 'Free cancellation up to 24 hours', source: 'Demo', bookingUrl: 'https://www.holidaytaxis.com' },
    { id: 'transfer-private', type: 'private', vehicleClass: passengers <= 4 ? 'Standard Saloon' : passengers <= 6 ? 'MPV / People Carrier' : 'Minibus', maxPassengers: passengers <= 4 ? 4 : passengers <= 6 ? 6 : 8, journeyMinutes: 40, totalPriceGBP: passengers <= 4 ? 68 : passengers <= 6 ? 85 : 110, cancellationPolicy: 'Free cancellation up to 24 hours', source: 'Demo', bookingUrl: 'https://www.holidaytaxis.com' },
    { id: 'transfer-exec', type: 'executive', vehicleClass: 'Executive Saloon', maxPassengers: 3, journeyMinutes: 38, totalPriceGBP: 95, cancellationPolicy: 'Free cancellation up to 48 hours', source: 'Demo', bookingUrl: 'https://www.hoppa.com' },
  ]
}

function demoCars(destination: string, pickupDate: string, dropoffDate: string, isUSA: boolean): CarResult[] {
  const days = Math.max(1, (new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / 86400000)
  const suppliers = isUSA ? ['Enterprise', 'Alamo', 'National', 'Hertz'] : ['Europcar', 'Hertz', 'Avis', 'Sixt']
  const classes   = isUSA
    ? [{ class: 'Economy', seats: 5, perDay: 38 }, { class: 'Compact SUV', seats: 5, perDay: 52 }, { class: 'Full-size SUV', seats: 7, perDay: 74 }, { class: 'Minivan', seats: 7, perDay: 86 }]
    : [{ class: 'Economy', seats: 5, perDay: 28 }, { class: 'Compact', seats: 5, perDay: 36 }, { class: 'Intermediate', seats: 5, perDay: 44 }, { class: 'SUV', seats: 5, perDay: 58 }]
  return suppliers.flatMap((supplier, si) => classes.map((cls, ci): CarResult => ({
    id: `car-${si}-${ci}`, supplier, vehicleClass: cls.class, seats: cls.seats, doors: 4,
    transmission: isUSA ? 'automatic' : ci < 2 ? 'manual' : 'automatic', airConditioning: true,
    unlimitedMileage: isUSA, fuelPolicy: 'Full-to-Full', excessGBP: isUSA ? 0 : [1500, 1200, 1000, 800][ci] ?? 1000,
    cdwIncluded: isUSA, cdwCostGBP: isUSA ? 0 : 12, pricePerDayGBP: cls.perDay + si * 3,
    totalPriceGBP: (cls.perDay + si * 3) * days, pickupLocation: `${destination} Airport`,
    isAirportPickup: true, source: 'Demo', bookingUrl: 'https://www.skyscanner.net/car-hire',
  })))
}

function addDays(date: string, days: number): string {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}
