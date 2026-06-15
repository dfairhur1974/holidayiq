// ─── Search Parameters ──────────────────────────────────────────────────────

export type SearchMode = 'package' | 'self-build' | 'flight-only' | 'car-hire' | 'villa'
export type BoardBasis = 'AI' | 'FB' | 'HB' | 'BB' | 'SC' | 'RO' | 'any'
export type RoomType = 'swim-up' | 'sea-view' | 'pool-view' | 'suite' | 'junior-suite' | 'family' | 'interconnecting' | 'standard' | 'villa' | 'bungalow' | 'club' | 'any'
export type TransferType = 'private' | 'shared' | 'none'

export interface AirportGroup {
  label: string
  airports: string[]
}

export const AIRPORT_GROUPS: Record<string, AirportGroup> = {
  london:   { label: 'London (Any)',        airports: ['LHR','LGW','LTN','STN','LCY','SEN'] },
  manchester:{ label: 'Manchester (Any)',   airports: ['MAN','DSA'] },
  midlands: { label: 'Midlands (Any)',       airports: ['BHX','EMA'] },
  scotland: { label: 'Scotland (Any)',       airports: ['EDI','GLA','PIK','ABZ'] },
  northeast:{ label: 'North East (Any)',     airports: ['NCL','MME'] },
  northwest:{ label: 'North West (Any)',     airports: ['BLK','LPL'] },
  southwest:{ label: 'South West (Any)',     airports: ['BRS','EXT','NQY','BOH'] },
  wales:    { label: 'Wales',                airports: ['CWL'] },
  nireland: { label: 'Northern Ireland',     airports: ['BFS','BHD'] },
  ireland:  { label: 'Republic of Ireland',  airports: ['DUB','ORK'] },
}

export const AIRPORT_NAMES: Record<string, string> = {
  LHR: 'London Heathrow', LGW: 'London Gatwick', LTN: 'London Luton',
  STN: 'London Stansted', LCY: 'London City',    SEN: 'London Southend',
  MAN: 'Manchester',      DSA: 'Doncaster Sheffield',
  BHX: 'Birmingham',      EMA: 'East Midlands',
  EDI: 'Edinburgh',       GLA: 'Glasgow',         PIK: 'Glasgow Prestwick', ABZ: 'Aberdeen',
  NCL: 'Newcastle',       MME: 'Durham Tees Valley',
  BLK: 'Blackpool',       LPL: 'Liverpool John Lennon',
  BRS: 'Bristol',         EXT: 'Exeter',           NQY: 'Newquay',          BOH: 'Bournemouth',
  CWL: 'Cardiff Wales',
  BFS: 'Belfast International', BHD: 'Belfast City',
  DUB: 'Dublin',          ORK: 'Cork',
  MCO: 'Orlando',         MIA: 'Miami',            TPA: 'Tampa',
  FLL: 'Fort Lauderdale', PBI: 'Palm Beach',
}

export interface SearchParams {
  mode: SearchMode
  destination: string
  departureAirports: string[]       // individual IATA codes (group already expanded)
  departureGroup?: string           // original group key if user selected one
  outboundDate: string              // YYYY-MM-DD
  returnDate?: string
  durationNights: number[]          // [7] or [7,10] for flexible
  adults: number
  children: number[]                // ages
  boardBasis: BoardBasis
  minStars: number
  roomType: RoomType
  bagsPerPerson: number
  maxStops: number                  // 0=direct, 1=one stop, 99=any
  budgetTotal?: number
  budgetPerPerson?: number
  flexDays: number
  transferType: TransferType
  isFloridaMode?: boolean
  rawQuery?: string
}

// ─── Result Types ────────────────────────────────────────────────────────────

export interface ValueBreakdown {
  stars: number
  board: number
  roomType: number
  bags: number
  stops: number
  flightDuration: number
  atol: number
  guestScore: number
  transfer: number
  priceEfficiency: number
  total: number
  label: 'Exceptional Value' | 'Excellent Value' | 'Good Value' | 'Fair' | 'Premium Priced'
}

export interface FlightResult {
  id: string
  airline: string
  airlineCode: string
  departureAirport: string
  departureTime: string
  arrivalAirport: string
  arrivalTime: string
  durationMinutes: number
  stops: number
  layovers?: { airport: string; durationMinutes: number }[]
  bagsIncluded: number              // kg, 0 = none
  bagCostGBP?: number
  cabinBagSize?: string
  onTimePercent?: number
  aircraft?: string
  pricePerPersonGBP: number
  totalPriceGBP: number
  source: string
  bookingUrl: string
  isReturn?: boolean
}

export interface HotelResult {
  id: string
  name: string
  stars: number
  guestScore?: number               // 0–10
  guestScoreSource?: string
  boardOptions: BoardBasis[]
  roomTypes: RoomType[]
  distanceBeachKm?: number
  distanceAirportKm?: number
  distanceCentreKm?: number
  facilities: string[]
  pricePerNightGBP: number
  totalPriceGBP: number
  atolProtected: boolean
  source: string
  bookingUrl: string
  imageUrl?: string
  address?: string
  lat?: number
  lng?: number
}

export interface CarResult {
  id: string
  supplier: string
  vehicleClass: string
  seats: number
  doors: number
  transmission: 'automatic' | 'manual'
  airConditioning: boolean
  unlimitedMileage: boolean
  fuelPolicy: string
  excessGBP: number
  cdwIncluded: boolean
  cdwCostGBP?: number
  pricePerDayGBP: number
  totalPriceGBP: number
  pickupLocation: string
  isAirportPickup: boolean
  source: string
  bookingUrl: string
  imageUrl?: string
}

export interface VillaResult {
  id: string
  name: string
  location: string
  bedrooms: number
  bathrooms: number
  sleeps: number
  poolType: 'private-heated' | 'private' | 'shared' | 'none'
  hotTub: boolean
  weeklyPriceGBP: number
  shortBreakAvailable: boolean
  distanceDisneyKm?: number
  distanceBeachKm?: number
  distanceAirportKm?: number
  reviewScore?: number
  reviewCount?: number
  cancellationPolicy: string
  source: string
  bookingUrl: string
  imageUrl?: string
  isFeatured?: boolean
  features: string[]
}

export interface TransferResult {
  id: string
  type: 'shared' | 'private' | 'executive'
  vehicleClass: string
  maxPassengers: number
  journeyMinutes: number
  totalPriceGBP: number
  cancellationPolicy: string
  source: string
  bookingUrl: string
}

export interface PackageResult {
  id: string
  operator: string
  hotel: HotelResult
  flight: FlightResult
  returnFlight?: FlightResult
  boardBasis: BoardBasis
  roomType: RoomType
  nights: number
  bagsIncluded: number
  pricePerPersonGBP: number
  totalPriceGBP: number
  atolProtected: boolean
  bookingUrl: string
  valueScore: ValueBreakdown
}

export interface SelfBuildResult {
  flight: FlightResult
  returnFlight?: FlightResult
  hotel: HotelResult
  transfer?: TransferResult
  car?: CarResult
  totalPriceGBP: number
  savingVsPackageGBP?: number
  valueScore: ValueBreakdown
}

export interface SearchResults {
  params: SearchParams
  packages: PackageResult[]
  flights: FlightResult[]
  returnFlights: FlightResult[]
  hotels: HotelResult[]
  cars: CarResult[]
  villas: VillaResult[]
  transfers: TransferResult[]
  selfBuild?: SelfBuildResult
  searchedAt: string
  sources: { name: string; status: 'ok' | 'error' | 'no-results'; count: number }[]
}

// ─── Florida ─────────────────────────────────────────────────────────────────

export interface FloridaArea {
  name: string
  description: string
  distanceDisneyMiles: number
  distanceUniversalMiles: number
  highlights: string[]
}

export const FLORIDA_AREAS: FloridaArea[] = [
  { name: 'Kissimmee',      description: 'Closest to Disney — most villa stock, lively US192 strip',       distanceDisneyMiles: 4,  distanceUniversalMiles: 18, highlights: ['closest to Disney','huge choice of villas','restaurants and shops'] },
  { name: 'Davenport',      description: 'Value area southwest of Disney — quieter, larger plots',          distanceDisneyMiles: 10, distanceUniversalMiles: 25, highlights: ['great value','quieter','larger private pools'] },
  { name: 'Champions Gate', description: 'Resort community with golf — upscale, gated communities',         distanceDisneyMiles: 12, distanceUniversalMiles: 27, highlights: ['gated resort','golf courses','premium amenities'] },
  { name: 'Reunion Resort', description: 'Luxury resort with three championship golf courses',               distanceDisneyMiles: 11, distanceUniversalMiles: 26, highlights: ['luxury villas','golf resort','concierge service'] },
  { name: 'Windsor Hills',  description: 'Popular gated community close to Disney, communal facilities',    distanceDisneyMiles: 5,  distanceUniversalMiles: 20, highlights:['gated community','communal pool and gym','close to Disney'] },
  { name: 'Clermont',       description: 'Lake district west of Disney — scenic, less touristy',            distanceDisneyMiles: 16, distanceUniversalMiles: 30, highlights: ['lakes and nature','quieter','scenic drives'] },
]

export interface ItineraryDay {
  day: number
  date: string
  title: string
  morning: string
  afternoon: string
  evening: string
  tips: string[]
  estimatedCostGBP: number
}
