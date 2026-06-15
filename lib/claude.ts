import Anthropic from '@anthropic-ai/sdk'
import type { SearchParams, ItineraryDay } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Natural Language → SearchParams ─────────────────────────────────────────

// ─── Rule-based fallback parser (works without Anthropic credits) ─────────────

const DEST_IATA: Record<string, string> = {
  tenerife: 'TFS', lanzarote: 'ACE', fuerteventura: 'FUE',
  majorca: 'PMI', mallorca: 'PMI', ibiza: 'IBZ', menorca: 'MAH',
  malaga: 'AGP', 'costa del sol': 'AGP', alicante: 'ALC', barcelona: 'BCN',
  corfu: 'CFU', rhodes: 'RHO', crete: 'HER', kos: 'KGS',
  zakynthos: 'ZTH', zante: 'ZTH', skiathos: 'SKI', mykonos: 'JMK', santorini: 'JTR',
  paphos: 'PFO', cyprus: 'PFO', larnaca: 'LCA',
  algarve: 'FAO', portugal: 'FAO', lisbon: 'LIS',
  dubai: 'DXB',
  orlando: 'MCO', florida: 'MCO', miami: 'MIA', tampa: 'TPA',
}

const AIRPORT_MAP: Record<string, string[]> = {
  london: ['LHR', 'LGW', 'LTN', 'STN', 'LCY', 'SEN'],
  gatwick: ['LGW'], heathrow: ['LHR'], stansted: ['STN'], luton: ['LTN'],
  manchester: ['MAN'], birmingham: ['BHX'], bristol: ['BRS'],
  edinburgh: ['EDI'], glasgow: ['GLA'], newcastle: ['NCL'],
}

function nextFutureMonth(monthIndex: number): string {
  const today = new Date()
  const minDate = new Date(today)
  minDate.setDate(minDate.getDate() + 14)
  let year = today.getFullYear()
  if (monthIndex <= minDate.getMonth() || (monthIndex === minDate.getMonth() && minDate.getDate() > 15)) {
    year++
  }
  return `${year}-${String(monthIndex + 1).padStart(2, '0')}-15`
}

export function fallbackParseQuery(raw: string): Partial<SearchParams> {
  const q = raw.toLowerCase()
  const params: Partial<SearchParams> = {}

  // Mode
  if (/\bvilla\b/.test(q))      params.mode = 'villa'
  else if (/car.?hire|rent.?car/.test(q)) params.mode = 'car-hire'
  else if (/flight.?only|just.?flight/.test(q)) params.mode = 'flight-only'
  else params.mode = 'package'

  // Florida
  if (/florida|orlando|disney|universal|miami|tampa/.test(q)) params.isFloridaMode = true

  // Destination
  for (const [name, iata] of Object.entries(DEST_IATA)) {
    if (q.includes(name)) { params.destination = name.charAt(0).toUpperCase() + name.slice(1); break }
  }

  // Departure airports
  for (const [key, codes] of Object.entries(AIRPORT_MAP)) {
    if (q.includes(key)) {
      params.departureAirports = codes
      if (key === 'london') params.departureGroup = 'london'
      break
    }
  }
  if (!params.departureAirports) params.departureAirports = ['LGW', 'LHR', 'LTN', 'STN']

  // Adults
  const adultsM = q.match(/(\d+)\s*adults?/) ?? q.match(/(\d+)\s*people/)
  if (adultsM) params.adults = parseInt(adultsM[1])
  else if (/couple|2\s*of\s*us/.test(q)) params.adults = 2
  else params.adults = 2

  // Children
  const childM = q.match(/(\d+)\s*(?:children|kids?|child)/)
  if (childM) {
    const count = parseInt(childM[1])
    const ages: number[] = []
    const ageMatches = [...q.matchAll(/aged?\s*(\d+)/g)]
    for (let i = 0; i < count; i++) ages.push(parseInt(ageMatches[i]?.[1] ?? '8'))
    params.children = ages
  } else {
    params.children = []
  }

  // Duration
  const nightsM = q.match(/(\d+)\s*nights?/)
  const weeksM  = q.match(/(\d+)\s*weeks?/)
  if (nightsM)     params.durationNights = [parseInt(nightsM[1])]
  else if (weeksM) params.durationNights = [parseInt(weeksM[1]) * 7]
  else             params.durationNights = [7]

  // Explicit date from dropdowns: "departing 15 August 2026"
  const explicitDate = q.match(/departing\s+(\d{1,2})\s+(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})/)
  if (explicitDate) {
    const months2 = ['january','february','march','april','may','june','july','august','september','october','november','december']
    const mi = months2.indexOf(explicitDate[2])
    const dd = String(parseInt(explicitDate[1])).padStart(2, '0')
    const mm = String(mi + 1).padStart(2, '0')
    params.outboundDate = `${explicitDate[3]}-${mm}-${dd}`
  } else {
    // Month name only → next future occurrence
    const months = ['january','february','march','april','may','june','july','august','september','october','november','december']
    for (let i = 0; i < months.length; i++) {
      if (q.includes(months[i])) { params.outboundDate = nextFutureMonth(i); break }
    }
  }

  // Flex window: "flex -2 +7 days"
  const flexM = q.match(/flex\s+-(\d+)\s+\+(\d+)\s+days?/)
  if (flexM) {
    params.flexDays = parseInt(flexM[2])
    // Shift outbound date back by flexBefore so window starts earlier
    const before = parseInt(flexM[1])
    if (before > 0 && params.outboundDate) {
      const d = new Date(params.outboundDate)
      d.setDate(d.getDate() - before)
      params.outboundDate = d.toISOString().split('T')[0]
    }
  }

  // Board basis
  if (/all.?inclusive|all inclusive/.test(q)) params.boardBasis = 'AI'
  else if (/full.?board/.test(q))             params.boardBasis = 'FB'
  else if (/half.?board/.test(q))             params.boardBasis = 'HB'
  else if (/bed.?(?:and|&).?breakfast/.test(q)) params.boardBasis = 'BB'
  else if (/self.?cater/.test(q))             params.boardBasis = 'SC'
  else                                        params.boardBasis = 'AI'

  // Stars
  const starsM = q.match(/(\d)\s*[-\s]?star/)
  params.minStars = starsM ? parseInt(starsM[1]) : 4

  // Room type
  if (/swim.?up/.test(q))        params.roomType = 'swim-up'
  else if (/sea.?view/.test(q))  params.roomType = 'sea-view'
  else if (/suite/.test(q))      params.roomType = 'suite'
  else if (/family/.test(q))     params.roomType = 'family'
  else                           params.roomType = 'standard'

  return params
}

export async function parseSearchQuery(raw: string): Promise<Partial<SearchParams>> {
  const today = new Date().toISOString().split('T')[0]

  try {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a holiday search parameter extractor for a UK travel site. Today is ${today}.
Extract search parameters from natural language queries and return ONLY valid JSON.
All prices in GBP. Dates in YYYY-MM-DD. Airport codes must be valid IATA codes.
CRITICAL DATE RULE: All outboundDate values MUST be in the future — at least 14 days from today (${today}). If the user says a month name without a year (e.g. "August", "July"), pick the NEXT occurrence of that month that is at least 14 days from today. If that month has already passed in ${today.slice(0,4)}, use ${String(parseInt(today.slice(0,4))+1)} instead. Never return a past date.
If the user says "London airports" or "any London airport", set departureAirports to ["LHR","LGW","LTN","STN","LCY","SEN"] and departureGroup to "london".
Board basis codes: AI=All Inclusive, FB=Full Board, HB=Half Board, BB=Bed & Breakfast, SC=Self Catering, RO=Room Only.
For Florida/Orlando/Miami/Tampa destinations, set isFloridaMode to true.
Return only the JSON object, no markdown.`,
    messages: [{
      role: 'user',
      content: `Extract search parameters from: "${raw}"
Return JSON with these fields (omit fields that cannot be inferred):
{
  "mode": "package|self-build|flight-only|car-hire|villa",
  "destination": "string",
  "departureAirports": ["IATA"],
  "departureGroup": "group key or null",
  "outboundDate": "YYYY-MM-DD",
  "returnDate": "YYYY-MM-DD or null",
  "durationNights": [7],
  "adults": 2,
  "children": [],
  "boardBasis": "AI|FB|HB|BB|SC|RO|any",
  "minStars": 4,
  "roomType": "swim-up|sea-view|pool-view|suite|family|standard|any",
  "bagsPerPerson": 1,
  "maxStops": 99,
  "budgetTotal": null,
  "budgetPerPerson": null,
  "flexDays": 0,
  "transferType": "private|shared|none",
  "isFloridaMode": false
}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return fallbackParseQuery(raw)
  }
  } catch {
    console.warn('Anthropic API unavailable — using rule-based parser')
    return fallbackParseQuery(raw)
  }
}

// ─── Value Score Narrative ────────────────────────────────────────────────────

export async function generateScoreNarrative(
  hotelName: string,
  operator: string,
  scoreTotal: number,
  priceTotal: number,
  highlights: string[],
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 120,
    system: 'Write a concise 2-sentence explanation of why this holiday deal scored well. Be specific, factual, and enthusiastic but not hyperbolic. UK English.',
    messages: [{
      role: 'user',
      content: `Hotel: ${hotelName}, Operator: ${operator}, Value Score: ${scoreTotal}/100, Total price: £${priceTotal.toLocaleString()}, Key positives: ${highlights.join(', ')}`
    }]
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ─── Price Alert Email ────────────────────────────────────────────────────────

export async function generateAlertEmail(
  hotelName: string,
  destination: string,
  operator: string,
  oldPrice: number,
  newPrice: number,
  dates: string,
  bookingUrl: string,
): Promise<{ subject: string; body: string }> {
  const drop = oldPrice - newPrice
  const dropPct = Math.round((drop / oldPrice) * 100)

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: 'Write a friendly, concise price alert email for a UK holiday search site. UK English. Return JSON with subject and body fields only.',
    messages: [{
      role: 'user',
      content: `Hotel: ${hotelName}, Destination: ${destination}, Operator: ${operator}, Old price: £${oldPrice.toLocaleString()}, New price: £${newPrice.toLocaleString()}, Drop: £${drop} (${dropPct}%), Dates: ${dates}, Booking URL: ${bookingUrl}`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return {
      subject: `Price drop: ${hotelName} now £${newPrice.toLocaleString()}`,
      body: `Good news — the price for ${hotelName} in ${destination} has dropped by £${drop} (${dropPct}%). It is now £${newPrice.toLocaleString()}. Book at: ${bookingUrl}`
    }
  }
}

// ─── Destination Advisor ──────────────────────────────────────────────────────

export async function destinationAdvice(
  query: string,
  budgetPP: number,
  month: string,
  party: string,
): Promise<string> {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 600,
    system: 'You are an expert UK holiday advisor with deep knowledge of package holiday destinations, pricing, and value. Give specific, actionable recommendations with reasoning. UK English.',
    messages: [{
      role: 'user',
      content: `Query: ${query}\nBudget: £${budgetPP}pp\nMonth: ${month}\nParty: ${party}\n\nRecommend 3 specific destinations with a brief explanation of why each suits this query. Mention typical board basis, flight time, and approximate price.`
    }]
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}

// ─── Florida Itinerary ────────────────────────────────────────────────────────

export async function generateFloridaItinerary(
  adults: number,
  childAges: number[],
  durationDays: number,
  interests: string[],
  budgetPerDayGBP: number,
  villaArea: string,
  startDate: string,
): Promise<ItineraryDay[]> {
  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    system: `You are an expert Florida holiday planner for UK families. Generate a detailed day-by-day itinerary.
Return ONLY a JSON array of day objects. No markdown. Each day:
{
  "day": 1,
  "date": "YYYY-MM-DD",
  "title": "string",
  "morning": "string",
  "afternoon": "string",
  "evening": "string",
  "tips": ["string"],
  "estimatedCostGBP": 0
}`,
    messages: [{
      role: 'user',
      content: `Plan a ${durationDays}-day Florida itinerary starting ${startDate}.
Party: ${adults} adults, children aged ${childAges.join(', ') || 'none'}.
Staying in: ${villaArea}.
Interests: ${interests.join(', ')}.
Daily budget: £${budgetPerDayGBP} excluding villa.
Include rest days, mix of theme parks, beaches, and local experiences.
Day 1 is arrival/settle-in. Final day is pack-up/departure.`
    }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    return JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim())
  } catch {
    return []
  }
}
