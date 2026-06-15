import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(gbp: number): string {
  return `£${Math.round(gbp).toLocaleString('en-GB')}`
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export function airlineName(code: string): string {
  const map: Record<string, string> = {
    BA: 'British Airways', EZY: 'easyJet', FR: 'Ryanair', LS: 'Jet2',
    BY: 'TUI Airways', VS: 'Virgin Atlantic', W6: 'Wizz Air',
    U2: 'easyJet', TOM: 'TUI', ZB: 'Monarch',
  }
  return map[code] ?? code
}

export function boardBasisLabel(code: string): string {
  const map: Record<string, string> = {
    AI: 'All Inclusive', FB: 'Full Board', HB: 'Half Board',
    BB: 'Bed & Breakfast', SC: 'Self Catering', RO: 'Room Only', any: 'Any',
  }
  return map[code] ?? code
}

export function roomTypeLabel(code: string): string {
  const map: Record<string, string> = {
    'swim-up': 'Swim-Up Pool', 'sea-view': 'Sea View', 'pool-view': 'Pool View',
    suite: 'Suite', family: 'Family Room', interconnecting: 'Interconnecting',
    standard: 'Standard', any: 'Any Room',
  }
  return map[code] ?? code
}

export function starsDisplay(n: number): string {
  return '★'.repeat(Math.min(5, Math.max(0, n)))
}

export function destinationToIata(destination: string | undefined): string {
  if (!destination) return ''
  const map: Record<string, string> = {
    lanzarote: 'ACE', tenerife: 'TFS', fuerteventura: 'FUE', 'gran canaria': 'LPA',
    majorca: 'PMI', mallorca: 'PMI', ibiza: 'IBZ', menorca: 'MAH',
    malaga: 'AGP', 'costa del sol': 'AGP', alicante: 'ALC', 'costa blanca': 'ALC',
    barcelona: 'BCN', madrid: 'MAD', seville: 'SVQ',
    corfu: 'CFU', rhodes: 'RHO', crete: 'HER', 'crete heraklion': 'HER',
    santorini: 'JTR', mykonos: 'JMK', kos: 'KGS', zakynthos: 'ZTH',
    cyprus: 'PFO', paphos: 'PFO', 'ayia napa': 'LCA',
    turkey: 'ADB', dalaman: 'DLM', antalya: 'AYT', bodrum: 'BJV',
    dubai: 'DXB', abu: 'AUH', maldives: 'MLE', mauritius: 'MRU',
    orlando: 'MCO', miami: 'MIA', tampa: 'TPA', florida: 'MCO',
    newyork: 'JFK', 'new york': 'JFK', cancun: 'CUN',
    portugal: 'FAO', algarve: 'FAO', lisbon: 'LIS', madeira: 'FNC',
  }
  const key = destination.toLowerCase().trim()
  return map[key] ?? destination.toUpperCase().slice(0, 3)
}
