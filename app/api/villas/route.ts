import { NextRequest, NextResponse } from 'next/server'
import type { VillaResult } from '@/lib/types'

// No public villa API exists for individual developers (Airbnb/VRBO both closed theirs).
// HomeToGo has an affiliate programme but requires a commercial agreement.
// Debbie's Villa is always injected first for Florida searches.

const DEBBIES_VILLA: VillaResult = {
  id: 'debbies-villa-florida',
  name: "Debbie's Florida Villa",
  location: 'Kissimmee, Florida',
  bedrooms: 4,
  bathrooms: 3,
  sleeps: 8,
  poolType: 'private-heated',
  hotTub: false,
  weeklyPriceGBP: 1495,
  shortBreakAvailable: true,
  distanceDisneyKm: 8,
  distanceBeachKm: 130,
  distanceAirportKm: 25,
  reviewScore: 9.4,
  reviewCount: 47,
  cancellationPolicy: 'Free cancellation up to 60 days before arrival',
  source: 'Featured Partner',
  bookingUrl: process.env.DEBBIES_VILLA_URL ?? '#contact-debbies-villa',
  imageUrl: process.env.DEBBIES_VILLA_IMAGE_URL ?? undefined,
  isFeatured: true,
  features: ['Private heated pool', '4 bedrooms', 'Games room', 'Free WiFi', 'BBQ', 'Free parking', 'Air conditioning throughout', '8 minutes from Disney World'],
}

function demoVillas(destination: string, isFlorida: boolean): VillaResult[] {
  if (isFlorida) {
    return [
      DEBBIES_VILLA,
      {
        id: 'villa-fl-2', name: 'Champions Gate Pool Villa', location: 'Champions Gate, Florida',
        bedrooms: 5, bathrooms: 4, sleeps: 10, poolType: 'private-heated', hotTub: true,
        weeklyPriceGBP: 1895, shortBreakAvailable: false,
        distanceDisneyKm: 14, distanceBeachKm: 130, distanceAirportKm: 30,
        reviewScore: 9.1, reviewCount: 31, cancellationPolicy: 'Free cancellation up to 30 days',
        source: 'Demo',
        bookingUrl: 'https://www.vrbo.com/search/keywords:kissimmee-florida',
        features: ['Private heated pool', 'Hot tub', 'Home cinema', 'BBQ deck', 'Gated resort'],
        isFeatured: false,
      },
      {
        id: 'villa-fl-3', name: 'Windsor Hills Family Villa', location: 'Windsor Hills, Florida',
        bedrooms: 4, bathrooms: 3, sleeps: 8, poolType: 'private', hotTub: false,
        weeklyPriceGBP: 1295, shortBreakAvailable: true,
        distanceDisneyKm: 6, distanceBeachKm: 130, distanceAirportKm: 22,
        reviewScore: 8.8, reviewCount: 62, cancellationPolicy: 'Free cancellation up to 14 days',
        source: 'Demo',
        bookingUrl: 'https://www.vrbo.com/search/keywords:windsor-hills-florida',
        features: ['Private pool', 'Gated community', 'Communal gym', 'Games room', 'Close to Disney'],
        isFeatured: false,
      },
    ]
  }

  return [
    {
      id: 'villa-1', name: `${destination} Seafront Villa`, location: destination,
      bedrooms: 3, bathrooms: 2, sleeps: 6, poolType: 'private', hotTub: false,
      weeklyPriceGBP: 1800, shortBreakAvailable: false,
      reviewScore: 9.0, reviewCount: 24,
      cancellationPolicy: 'Free cancellation up to 30 days',
      source: 'Demo',
      bookingUrl: 'https://www.vrbo.com',
      features: ['Private pool', 'Sea views', 'Air conditioning', 'BBQ'],
      isFeatured: false,
    },
    {
      id: 'villa-2', name: `${destination} Country Villa`, location: destination,
      bedrooms: 4, bathrooms: 3, sleeps: 8, poolType: 'private-heated', hotTub: true,
      weeklyPriceGBP: 2400, shortBreakAvailable: true,
      reviewScore: 9.3, reviewCount: 15,
      cancellationPolicy: 'Free cancellation up to 60 days',
      source: 'Demo',
      bookingUrl: 'https://www.vrbo.com',
      features: ['Private heated pool', 'Hot tub', '4 bedrooms', 'WiFi', 'Mountain views'],
      isFeatured: false,
    },
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { destination, isFloridaMode } = await req.json()
    const villas = demoVillas(destination, !!isFloridaMode)
    return NextResponse.json({ villas, demo: true })
  } catch (e: any) {
    return NextResponse.json({ villas: [], error: e.message })
  }
}
