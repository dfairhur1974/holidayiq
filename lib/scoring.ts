import type { ValueBreakdown, PackageResult, HotelResult, FlightResult, BoardBasis, RoomType } from './types'

const BOARD_SCORES: Record<BoardBasis, number> = {
  AI: 40, FB: 30, HB: 20, BB: 8, SC: 2, RO: 0, any: 0,
}

const ROOM_SCORES: Record<RoomType, number> = {
  'swim-up': 20, 'sea-view': 15, 'pool-view': 12, suite: 14,
  'junior-suite': 12, villa: 16, bungalow: 14, club: 12,
  family: 12, interconnecting: 10, standard: 0, any: 0,
}

const MAX_SCORE = 240

function flightDurationScore(minutes: number): number {
  if (minutes < 180) return 10
  if (minutes < 300) return 8
  if (minutes < 480) return 6
  if (minutes < 720) return 4
  return 2
}

function guestScorePoints(score?: number): number {
  if (!score) return 0
  if (score >= 9.0) return 15
  if (score >= 8.0) return 10
  if (score >= 7.0) return 5
  return 0
}

export function scoreLabel(pct: number): ValueBreakdown['label'] {
  if (pct >= 95) return 'Exceptional Value'
  if (pct >= 85) return 'Excellent Value'
  if (pct >= 70) return 'Good Value'
  if (pct >= 55) return 'Fair'
  return 'Premium Priced'
}

export function computeScore(
  hotel: HotelResult,
  flight: FlightResult,
  boardBasis: BoardBasis,
  roomType: RoomType,
  bagsIncluded: number,
  atolProtected: boolean,
  transferIncluded: boolean,
  totalPriceGBP: number,
  maxPriceInResults: number,
): ValueBreakdown {
  const stars        = Math.min(hotel.stars, 5) * 15
  const board        = BOARD_SCORES[boardBasis] ?? 0
  const room         = ROOM_SCORES[roomType] ?? 0
  const bags         = bagsIncluded >= 20 ? 15 : bagsIncluded > 0 ? 7 : 0
  const stops        = flight.stops === 0 ? 20 : flight.stops === 1 ? 10 : 0
  const flightDur    = flightDurationScore(flight.durationMinutes)
  const atol         = atolProtected ? 10 : 0
  const guest        = guestScorePoints(hotel.guestScore)
  const transfer     = transferIncluded ? 5 : 0
  const priceEff     = maxPriceInResults > 0
    ? Math.round((1 - totalPriceGBP / maxPriceInResults) * 30)
    : 0

  const raw = stars + board + room + bags + stops + flightDur + atol + guest + transfer + priceEff
  const total = Math.round(Math.max(0, Math.min(100, (raw / MAX_SCORE) * 100)))

  return { stars, board, roomType: room, bags, stops, flightDuration: flightDur,
           atol, guestScore: guest, transfer, priceEfficiency: priceEff,
           total, label: scoreLabel(total) }
}

export function scoreColour(label: ValueBreakdown['label']): string {
  switch (label) {
    case 'Exceptional Value': return '#00634A'
    case 'Excellent Value':   return '#00634A'
    case 'Good Value':        return '#2563eb'
    case 'Fair':              return '#6b7280'
    case 'Premium Priced':    return '#d97706'
  }
}

export function scoreBg(label: ValueBreakdown['label']): string {
  switch (label) {
    case 'Exceptional Value': return '#dcfce7'
    case 'Excellent Value':   return '#d1fae5'
    case 'Good Value':        return '#dbeafe'
    case 'Fair':              return '#f3f4f6'
    case 'Premium Priced':    return '#fef3c7'
  }
}
