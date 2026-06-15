import { NextRequest, NextResponse } from 'next/server'
import { searchFlights } from '@/lib/duffel'
import { destinationToIata } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { origins, destination, date, adults, children } = await req.json()

    if (!origins?.length || !destination || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!process.env.DUFFEL_API_KEY) {
      return NextResponse.json({ flights: [], warning: 'DUFFEL_API_KEY not configured' })
    }

    const destCode = destinationToIata(destination)
    const flights = await searchFlights(origins, destCode, date, adults ?? 2, children ?? [])

    return NextResponse.json({ flights, destination: destCode })
  } catch (e: any) {
    console.error('Flight search error:', e)
    return NextResponse.json({ flights: [], error: e.message })
  }
}
