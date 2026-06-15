import { NextRequest, NextResponse } from 'next/server'
import type { TransferResult } from '@/lib/types'

// No public transfer API exists for individual developers.
// Welcome Pickups and Get Transfer both require B2B commercial agreements.
// Demo data is used — realistic pricing and options shown.

function demoTransfers(destination: string, passengers: number): TransferResult[] {
  const isLongHaul = passengers > 4
  return [
    {
      id: 'transfer-shared-1', type: 'shared', vehicleClass: 'Shared Coach',
      maxPassengers: 16, journeyMinutes: 45, totalPriceGBP: passengers * 8,
      cancellationPolicy: 'Free cancellation up to 24 hours',
      source: 'Demo',
      bookingUrl: 'https://www.holidaytaxis.com',
    },
    {
      id: 'transfer-private-1', type: 'private',
      vehicleClass: passengers <= 4 ? 'Standard Saloon' : passengers <= 6 ? 'MPV / People Carrier' : 'Minibus',
      maxPassengers: passengers <= 4 ? 4 : passengers <= 6 ? 6 : 8,
      journeyMinutes: 40, totalPriceGBP: passengers <= 4 ? 68 : passengers <= 6 ? 85 : 110,
      cancellationPolicy: 'Free cancellation up to 24 hours',
      source: 'Demo',
      bookingUrl: 'https://www.holidaytaxis.com',
    },
    {
      id: 'transfer-exec-1', type: 'executive', vehicleClass: 'Executive Saloon',
      maxPassengers: 3, journeyMinutes: 38, totalPriceGBP: 95,
      cancellationPolicy: 'Free cancellation up to 48 hours',
      source: 'Demo (Hoppa API key needed)',
      bookingUrl: 'https://www.hoppa.com',
    },
  ]
}

export async function POST(req: NextRequest) {
  try {
    const { destination, passengers } = await req.json()
    const transfers = demoTransfers(destination, passengers ?? 2)
    return NextResponse.json({ transfers, demo: true })
  } catch (e: any) {
    return NextResponse.json({ transfers: [], error: e.message })
  }
}
