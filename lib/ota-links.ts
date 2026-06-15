// Deep-link URL builders for UK holiday OTAs.
// Each URL is built to land on a live search-results or pre-filled search page.
// Formats verified/corrected June 2026.

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** YYYY-MM-DD → DD-MM-YYYY */
function fmtDMY(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}-${m}-${y}`
}

function addDays(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

// ─── Destination mappings ────────────────────────────────────────────────────

// Jet2 uses country/resort paths: /package-holidays/{country}/{resort}
const JET2_PATH: Record<string, string> = {
  mallorca: 'spain/mallorca', majorca: 'spain/mallorca',
  menorca: 'spain/menorca', ibiza: 'spain/ibiza',
  tenerife: 'canary-islands/tenerife', lanzarote: 'canary-islands/lanzarote',
  fuerteventura: 'canary-islands/fuerteventura', 'gran canaria': 'canary-islands/gran-canaria',
  corfu: 'greece/corfu', crete: 'greece/crete', rhodes: 'greece/rhodes',
  zante: 'greece/zante', kos: 'greece/kos', santorini: 'greece/santorini',
  kefalonia: 'greece/kefalonia', skiathos: 'greece/skiathos',
  cyprus: 'cyprus', paphos: 'cyprus/paphos', larnaca: 'cyprus/larnaca',
  algarve: 'portugal/algarve', madeira: 'portugal/madeira',
  turkey: 'turkey', antalya: 'turkey/antalya', dalaman: 'turkey/dalaman',
  marmaris: 'turkey/marmaris', bodrum: 'turkey/bodrum',
  dubai: 'dubai', egypt: 'egypt', hurghada: 'egypt/hurghada',
  sharm: 'egypt/sharm-el-sheikh', florida: 'usa/florida', orlando: 'usa/florida',
  cancun: 'mexico/cancun', maldives: 'maldives', bali: 'indonesia/bali',
}

// TUI uses destination slugs for their search query
const TUI_DEST: Record<string, string> = {
  mallorca: 'Mallorca', majorca: 'Mallorca', menorca: 'Menorca', ibiza: 'Ibiza',
  tenerife: 'Tenerife', lanzarote: 'Lanzarote', fuerteventura: 'Fuerteventura',
  'gran canaria': 'Gran Canaria', corfu: 'Corfu', crete: 'Crete', rhodes: 'Rhodes',
  zante: 'Zante', kos: 'Kos', santorini: 'Santorini', kefalonia: 'Kefalonia',
  cyprus: 'Cyprus', paphos: 'Paphos', larnaca: 'Larnaca', algarve: 'Algarve',
  turkey: 'Turkey', antalya: 'Antalya', marmaris: 'Marmaris', bodrum: 'Bodrum',
  dubai: 'Dubai', egypt: 'Egypt', hurghada: 'Hurghada', maldives: 'Maldives',
  florida: 'Florida', orlando: 'Orlando', cancun: 'Cancun',
}

// On The Beach uses destination name in search
const OTB_DEST: Record<string, string> = {
  mallorca: 'Majorca', majorca: 'Majorca', menorca: 'Menorca', ibiza: 'Ibiza',
  tenerife: 'Tenerife', lanzarote: 'Lanzarote', fuerteventura: 'Fuerteventura',
  'gran canaria': 'Gran Canaria', corfu: 'Corfu', crete: 'Crete', rhodes: 'Rhodes',
  zante: 'Zante', kos: 'Kos', cyprus: 'Cyprus', paphos: 'Cyprus',
  algarve: 'Algarve', turkey: 'Turkey', antalya: 'Antalya',
  dubai: 'Dubai', egypt: 'Egypt', hurghada: 'Hurghada', maldives: 'Maldives',
}

// Destination airport IATA codes
const DEST_IATA: Record<string, string> = {
  mallorca: 'PMI', majorca: 'PMI', menorca: 'MAH', ibiza: 'IBZ',
  tenerife: 'TFS', lanzarote: 'ACE', fuerteventura: 'FUE', 'gran canaria': 'LPA',
  corfu: 'CFU', crete: 'HER', rhodes: 'RHO', zante: 'ZTH',
  kos: 'KGS', santorini: 'JTR', kefalonia: 'EFL', skiathos: 'JSI',
  cyprus: 'PFO', paphos: 'PFO', larnaca: 'LCA',
  algarve: 'FAO', madeira: 'FNC',
  turkey: 'AYT', antalya: 'AYT', dalaman: 'DLM', marmaris: 'DLM', bodrum: 'BJV',
  dubai: 'DXB', egypt: 'HRG', hurghada: 'HRG', sharm: 'SSH',
  florida: 'MCO', orlando: 'MCO', cancun: 'CUN',
  maldives: 'MLE', bali: 'DPS', thailand: 'BKK', phuket: 'HKT',
}

function lookupDest<T>(map: Record<string, T>, dest: string): T | null {
  const key = dest.toLowerCase()
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v
  }
  return null
}

function getDestIata(destination: string, provided?: string): string {
  if (provided && provided.length === 3) return provided
  return lookupDest(DEST_IATA, destination) ?? destination.toUpperCase().slice(0, 3)
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface OtaLink {
  name: string
  url: string
  colour: string
  note: string
}

// ─── URL builders ─────────────────────────────────────────────────────────────

export function buildOtaLinks(
  destination: string,
  departureAirport: string,
  destIata: string,
  outboundDate: string,
  nights: number,
  adults: number,
  children: number[],
): OtaLink[] {
  const childCount  = children.length
  const returnDate  = addDays(outboundDate, nights)
  const destAirport = getDestIata(destination, destIata)
  const childAges   = children.join(',')

  // ── Jet2 Holidays ──────────────────────────────────────────────────────────
  // Path: /package-holidays/{country}/{resort}?from=LGW&when=DD-MM-YYYY&nights=7&adults=2
  const jet2Path = lookupDest(JET2_PATH, destination) ?? destination.toLowerCase().replace(/\s+/g, '-')
  const jet2 = `https://www.jet2holidays.com/package-holidays/${jet2Path}?from=${departureAirport}&when=${fmtDMY(outboundDate)}&nights=${nights}&adults=${adults}&children=${childCount}&rooms=1`

  // ── TUI ───────────────────────────────────────────────────────────────────
  // /holidays/search?q={Destination}&departureDate=YYYY-MM-DD&duration=N&adults=N&children=N&departureAirportCode=LGW
  const tuiQ = lookupDest(TUI_DEST, destination) ?? destination
  const tui  = `https://www.tui.co.uk/holidays/search?q=${encodeURIComponent(tuiQ)}&departureDate=${outboundDate}&duration=${nights}&adults=${adults}&children=${childCount}&departureAirportCode=${departureAirport}`

  // ── On The Beach ──────────────────────────────────────────────────────────
  // /holidays?destination=Majorca&departureAirport=LGW&departureDate=YYYY-MM-DD&duration=N&adults=N&childAges=A,B
  const otbDest = lookupDest(OTB_DEST, destination) ?? destination
  const otbChildren = childAges ? `&childAges=${encodeURIComponent(childAges)}` : `&children=${childCount}`
  const otb = `https://www.onthebeach.co.uk/holidays?destination=${encodeURIComponent(otbDest)}&departureAirport=${departureAirport}&departureDate=${outboundDate}&duration=${nights}&adults=${adults}${otbChildren}`

  // ── easyJet Holidays ──────────────────────────────────────────────────────
  // origin/destination airport IATAs, ISO dates
  const ej = `https://holidays.easyjet.com/en/search?origin=${departureAirport}&destination=${destAirport}&departureDate=${outboundDate}&returnDate=${returnDate}&adults=${adults}&children=${childCount}${childAges ? `&childAges=${childAges}` : ''}`

  // ── loveholidays ──────────────────────────────────────────────────────────
  // /holidays?destination=Mallorca&departureAirport=LGW&departureDate=YYYY-MM-DD&duration=N&adults=N
  const love = `https://www.loveholidays.com/holidays?destination=${encodeURIComponent(destination)}&departureAirport=${departureAirport}&departureDate=${outboundDate}&duration=${nights}&adults=${adults}${childAges ? `&childAges=${childAges}` : `&children=${childCount}`}`

  // ── Thomas Cook ───────────────────────────────────────────────────────────
  const tc = `https://www.thomascook.com/holidays/search?destination=${encodeURIComponent(destination)}&departureAirport=${departureAirport}&departureDate=${outboundDate}&duration=${nights}&adults=${adults}&children=${childCount}`

  return [
    { name: 'Jet2 Holidays',    url: jet2, colour: '#e8240c', note: 'ATOL protected · often cheapest UK package' },
    { name: 'TUI',              url: tui,  colour: '#e2001a', note: 'ATOL protected · own airline & hotels' },
    { name: 'On The Beach',     url: otb,  colour: '#f4b400', note: 'ATOL protected · mix & match flexibility' },
    { name: 'easyJet Holidays', url: ej,   colour: '#ff6600', note: 'ATOL protected · low-cost airline base' },
    { name: 'loveholidays',     url: love, colour: '#e91e8c', note: 'Aggregator · broad supplier range' },
    { name: 'Thomas Cook',      url: tc,   colour: '#00539f', note: 'ATOL protected · classic UK operator' },
  ]
}
