import { NextRequest, NextResponse } from 'next/server'
import type { HotelResult } from '@/lib/types'
import { destinationToIata } from '@/lib/utils'

// Hotel search — Duffel is flights-only.
// Live hotel data: add BOOKING_COM_AFFILIATE_ID to enable Booking.com API,
// or RAPIDAPI_KEY to use the Hotels.com/Expedia feed via RapidAPI.
// Until then, realistic demo data is returned (flagged in the UI).

const DEMO_HOTELS: Record<string, Omit<HotelResult, 'id' | 'totalPriceGBP'>[]> = {
  // Canaries
  TFS: [
    { name: 'Bahia Principe Fantasia Tenerife', stars: 5, guestScore: 8.9, guestScoreSource: 'Booking.com', boardOptions: ['AI'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.1, distanceAirportKm: 22, facilities: ['swim-up-bar', 'spa', 'kids-club', 'multiple-pools'], pricePerNightGBP: 185, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Hard Rock Hotel Tenerife', stars: 5, guestScore: 8.7, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 20, facilities: ['swim-up-rooms', 'spa', 'live-music', 'casino'], pricePerNightGBP: 220, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Iberostar Selection Anthelia', stars: 5, guestScore: 9.1, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'junior-suite'], distanceBeachKm: 0.2, distanceAirportKm: 18, facilities: ['adults-only', 'spa', 'pools'], pricePerNightGBP: 198, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Gran Meliá Palacio de Isora', stars: 5, guestScore: 9.3, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.3, distanceAirportKm: 30, facilities: ['infinity-pool', 'spa', 'golf-nearby'], pricePerNightGBP: 260, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Jardines del Teide', stars: 4, guestScore: 8.4, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 19, facilities: ['swim-up-rooms', 'pools', 'animation'], pricePerNightGBP: 130, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  ACE: [
    { name: 'Gran Meliá Volcan Lanzarote', stars: 5, guestScore: 9.2, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 12, facilities: ['swim-up-rooms', 'spa', 'volcano-views'], pricePerNightGBP: 210, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Iberostar Lanzarote Park', stars: 4, guestScore: 8.8, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'junior-suite'], distanceBeachKm: 0.05, distanceAirportKm: 14, facilities: ['beachfront', 'spa', 'pools', 'kids-club'], pricePerNightGBP: 155, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'H10 Timanfaya Palace', stars: 4, guestScore: 8.6, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 13, facilities: ['adults-only', 'swim-up-rooms', 'pools'], pricePerNightGBP: 145, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Barcelo Teguise Beach', stars: 4, guestScore: 8.2, guestScoreSource: 'Booking.com', boardOptions: ['AI'], roomTypes: ['standard'], distanceBeachKm: 0.2, distanceAirportKm: 10, facilities: ['beach-club', 'pools', 'animation'], pricePerNightGBP: 118, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  PMI: [
    { name: 'Hotel Formentor — A Royal Hideaway Hotel', stars: 5, guestScore: 9.4, guestScoreSource: 'TripAdvisor', boardOptions: ['HB', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 70, facilities: ['historic', 'private-beach', 'spa', 'fine-dining'], pricePerNightGBP: 420, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Melia Calvia Beach', stars: 4, guestScore: 8.5, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 25, facilities: ['swim-up-rooms', 'beach-club', 'spa'], pricePerNightGBP: 175, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Hipotels Mediterraneo', stars: 4, guestScore: 8.1, guestScoreSource: 'Booking.com', boardOptions: ['AI'], roomTypes: ['standard'], distanceBeachKm: 0.2, distanceAirportKm: 55, facilities: ['pools', 'spa', 'animation', 'kids-club'], pricePerNightGBP: 120, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  AGP: [
    { name: 'Finca Cortesin Hotel Golf & Spa', stars: 5, guestScore: 9.5, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['suite'], distanceBeachKm: 2, distanceAirportKm: 65, facilities: ['golf', 'spa', 'private-pool', 'fine-dining'], pricePerNightGBP: 480, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Senator Marbella Spa Hotel', stars: 4, guestScore: 8.6, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB', 'BB'], roomTypes: ['standard', 'junior-suite'], distanceBeachKm: 0.3, distanceAirportKm: 55, facilities: ['spa', 'pools', 'beach-club'], pricePerNightGBP: 160, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Elba Motril Beach & Business Hotel', stars: 4, guestScore: 8.2, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard'], distanceBeachKm: 0.1, distanceAirportKm: 70, facilities: ['beachfront', 'pools', 'spa'], pricePerNightGBP: 115, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Florida
  MCO: [
    { name: 'Loews Sapphire Falls Resort', stars: 4, guestScore: 8.9, guestScoreSource: 'TripAdvisor', boardOptions: ['RO', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: undefined, distanceAirportKm: 25, facilities: ['universal-onsite', 'pools', 'waterslide', 'spa'], pricePerNightGBP: 195, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Walt Disney World Swan Reserve', stars: 4, guestScore: 9.1, guestScoreSource: 'Booking.com', boardOptions: ['RO', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: undefined, distanceAirportKm: 30, facilities: ['disney-benefits', 'pools', 'spa', 'fine-dining'], pricePerNightGBP: 225, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Rosen Shingle Creek', stars: 4, guestScore: 8.7, guestScoreSource: 'TripAdvisor', boardOptions: ['RO', 'BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: undefined, distanceAirportKm: 18, facilities: ['golf', 'spa', 'multiple-pools', 'convention'], pricePerNightGBP: 155, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Greece
  CFU: [
    { name: 'Domes Miramare Corfu', stars: 5, guestScore: 9.4, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB'], roomTypes: ['suite', 'villa'], distanceBeachKm: 0.05, distanceAirportKm: 35, facilities: ['private-beach', 'spa', 'fine-dining', 'adults-only'], pricePerNightGBP: 350, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Ikos Dassia', stars: 5, guestScore: 9.2, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'suite', 'bungalow'], distanceBeachKm: 0.1, distanceAirportKm: 15, facilities: ['ai-luxury', 'private-beach', 'watersports', 'spa', 'kids-club'], pricePerNightGBP: 290, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Kontokali Bay Resort & Spa', stars: 5, guestScore: 8.9, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB', 'AI'], roomTypes: ['standard', 'bungalow'], distanceBeachKm: 0.05, distanceAirportKm: 8, facilities: ['watersports', 'pools', 'spa', 'private-beach'], pricePerNightGBP: 195, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Dubai
  DXB: [
    { name: 'Atlantis The Palm', stars: 5, guestScore: 8.8, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 40, facilities: ['waterpark', 'private-beach', 'casino', 'fine-dining', 'spa'], pricePerNightGBP: 380, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Jumeirah Beach Hotel', stars: 5, guestScore: 9.0, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite', 'club'], distanceBeachKm: 0.05, distanceAirportKm: 30, facilities: ['private-beach', 'burj-al-arab-access', 'pools', 'spa'], pricePerNightGBP: 310, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Address Beach Resort', stars: 5, guestScore: 9.3, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.1, distanceAirportKm: 28, facilities: ['infinity-pool', 'private-beach', 'spa', 'fine-dining'], pricePerNightGBP: 275, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
}

// Generic fallback for any destination not in DEMO_HOTELS
function genericHotels(cityCode: string, minStars: number): Omit<HotelResult, 'id' | 'totalPriceGBP'>[] {
  return [
    { name: `Grand Resort ${cityCode}`, stars: Math.max(4, minStars), guestScore: 8.5, guestScoreSource: 'TripAdvisor', boardOptions: ['AI', 'HB'], roomTypes: ['standard'], distanceBeachKm: 0.5, distanceAirportKm: 20, facilities: ['pool', 'spa', 'restaurant'], pricePerNightGBP: 140, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: `Sunset Hotel ${cityCode}`, stars: Math.max(4, minStars), guestScore: 8.1, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB'], roomTypes: ['standard'], distanceBeachKm: 1, distanceAirportKm: 15, facilities: ['pool', 'restaurant'], pricePerNightGBP: 110, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { destination, checkIn, checkOut, adults, minStars } = await req.json()

    if (!destination || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cityCode = destinationToIata(destination)
    const nights = Math.max(1,
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000,
    )
    const stars = minStars ?? 4

    const raw = (DEMO_HOTELS[cityCode] ?? genericHotels(cityCode, stars))
      .filter(h => h.stars >= stars)

    const hotels: HotelResult[] = raw.map((h, i) => ({
      ...h,
      id: `hotel-${cityCode}-${i}`,
      totalPriceGBP: Math.round(h.pricePerNightGBP * nights),
    }))

    return NextResponse.json({ hotels })
  } catch (e: any) {
    console.error('Hotel search error:', e)
    return NextResponse.json({ hotels: [], error: e.message })
  }
}
