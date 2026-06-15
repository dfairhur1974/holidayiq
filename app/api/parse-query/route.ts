import { NextRequest, NextResponse } from 'next/server'
import { parseSearchQuery } from '@/lib/claude'
import { AIRPORT_GROUPS } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json()
    if (!query?.trim()) {
      return NextResponse.json({ error: 'No query provided' }, { status: 400 })
    }

    const params = await parseSearchQuery(query)

    // Expand airport group to individual airports if needed
    if (params.departureGroup && AIRPORT_GROUPS[params.departureGroup]) {
      params.departureAirports = AIRPORT_GROUPS[params.departureGroup].airports
    }

    // Ensure outboundDate is always in the future (min 14 days out)
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 14)
    if (params.outboundDate) {
      const d = new Date(params.outboundDate)
      if (d < minDate) {
        // Bump to same month/day next year
        d.setFullYear(d.getFullYear() + 1)
        params.outboundDate = d.toISOString().split('T')[0]
      }
    } else {
      // Default to 10 weeks out if no date given
      const d = new Date()
      d.setDate(d.getDate() + 70)
      params.outboundDate = d.toISOString().split('T')[0]
    }

    // Apply defaults for missing fields
    if (!params.mode)            params.mode = 'package'
    if (!params.adults)          params.adults = 2
    if (!params.children)        params.children = []
    if (!params.boardBasis)      params.boardBasis = 'AI'
    if (!params.minStars)        params.minStars = 4
    if (!params.roomType)        params.roomType = 'standard'
    if (params.bagsPerPerson === undefined) params.bagsPerPerson = 1
    if (params.maxStops === undefined)      params.maxStops = 99
    if (!params.flexDays)        params.flexDays = 0
    if (!params.durationNights || params.durationNights.length === 0) params.durationNights = [7]
    if (!params.transferType)    params.transferType = params.isFloridaMode ? 'private' : 'none'
    params.rawQuery = query

    return NextResponse.json({ params })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
