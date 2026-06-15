import { NextRequest, NextResponse } from 'next/server'
import type { CarResult } from '@/lib/types'

// Live car hire: Sky-Scrapper API via RapidAPI — free tier, instant signup
// Sign up at: https://rapidapi.com/apiheya/api/sky-scrapper
// Add RAPIDAPI_KEY to .env.local

async function liveCars(
  destination: string,
  pickupDate: string,
  dropoffDate: string,
  isUSA: boolean,
): Promise<CarResult[]> {
  const key = process.env.RAPIDAPI_KEY!

  // Sky-Scrapper car hire search
  const url = new URL('https://sky-scrapper.p.rapidapi.com/api/v1/cars/searchCars')
  url.searchParams.set('pickUpEntityId', destination)
  url.searchParams.set('pickUpDate', pickupDate)
  url.searchParams.set('dropOffDate', dropoffDate)
  url.searchParams.set('currency', 'GBP')
  url.searchParams.set('market', 'UK')
  url.searchParams.set('locale', 'en-GB')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'sky-scrapper.p.rapidapi.com',
      },
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return []

    const data = await res.json()
    const quotes: any[] = data?.data?.quotes ?? []
    const days = Math.max(1,
      (new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / 86400000,
    )

    return quotes.slice(0, 12).map((q: any, i: number): CarResult => ({
      id: `car-live-${i}`,
      supplier: q.agent?.name ?? q.provider?.name ?? 'RentalCars',
      vehicleClass: q.vehicleInfo?.class ?? 'Economy',
      seats: q.vehicleInfo?.seats ?? 5,
      doors: q.vehicleInfo?.doors ?? 4,
      transmission: q.vehicleInfo?.transmission?.toLowerCase() ?? 'automatic',
      airConditioning: q.vehicleInfo?.airConditioning ?? true,
      unlimitedMileage: !!q.vehicleInfo?.unlimitedMileage,
      fuelPolicy: q.vehicleInfo?.fuelPolicy ?? 'Full-to-Full',
      excessGBP: q.vehicleInfo?.excessAmount ?? 1000,
      cdwIncluded: !!q.vehicleInfo?.cdwIncluded,
      cdwCostGBP: q.vehicleInfo?.cdwIncluded ? 0 : 12,
      pricePerDayGBP: Math.round((q.price?.amount ?? 0) / days),
      totalPriceGBP: Math.round(q.price?.amount ?? 0),
      pickupLocation: q.pickUpLocation?.name ?? `${destination} Airport`,
      isAirportPickup: true,
      source: 'RapidAPI',
      bookingUrl: q.deepLink ?? `https://www.skyscanner.net/car-hire`,
    }))
  } catch {
    clearTimeout(timer)
    return []
  }
}

function demoCars(destination: string, days: number, isUSA: boolean): CarResult[] {
  const suppliers = isUSA
    ? ['Enterprise', 'Alamo', 'National', 'Hertz']
    : ['Europcar', 'Hertz', 'Avis', 'Sixt']

  const classes = isUSA
    ? [
        { class: 'Economy', seats: 5, doors: 4, perDay: 38 },
        { class: 'Compact SUV', seats: 5, doors: 4, perDay: 52 },
        { class: 'Full-size SUV', seats: 7, doors: 4, perDay: 74 },
        { class: 'Minivan (7 seats)', seats: 7, doors: 4, perDay: 86 },
      ]
    : [
        { class: 'Economy', seats: 5, doors: 4, perDay: 28 },
        { class: 'Compact', seats: 5, doors: 4, perDay: 36 },
        { class: 'Intermediate', seats: 5, doors: 4, perDay: 44 },
        { class: 'SUV', seats: 5, doors: 5, perDay: 58 },
      ]

  return suppliers.flatMap((supplier, si) =>
    classes.map((cls, ci): CarResult => ({
      id: `car-${si}-${ci}`,
      supplier,
      vehicleClass: cls.class,
      seats: cls.seats,
      doors: cls.doors,
      transmission: isUSA ? 'automatic' : (ci < 2 ? 'manual' : 'automatic'),
      airConditioning: true,
      unlimitedMileage: isUSA,
      fuelPolicy: 'Full-to-Full',
      excessGBP: isUSA ? 0 : [1500, 1200, 1000, 800][ci] ?? 1000,
      cdwIncluded: isUSA,
      cdwCostGBP: isUSA ? 0 : 12,
      pricePerDayGBP: cls.perDay + si * 3,
      totalPriceGBP: (cls.perDay + si * 3) * days,
      pickupLocation: `${destination} Airport`,
      isAirportPickup: true,
      source: 'Demo',
      bookingUrl: `https://www.skyscanner.net/car-hire`,
    }))
  )
}

export async function POST(req: NextRequest) {
  try {
    const { destination, pickupDate, dropoffDate, isUSA } = await req.json()
    const days = Math.max(1,
      (new Date(dropoffDate).getTime() - new Date(pickupDate).getTime()) / 86400000,
    )

    if (process.env.RAPIDAPI_KEY) {
      const live = await liveCars(destination, pickupDate, dropoffDate, !!isUSA)
      if (live.length > 0) return NextResponse.json({ cars: live })
    }

    // Fallback to demo
    const cars = demoCars(destination, days, !!isUSA)
    return NextResponse.json({ cars, demo: true })
  } catch (e: any) {
    return NextResponse.json({ cars: [], error: e.message })
  }
}
