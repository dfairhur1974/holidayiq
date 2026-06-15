import type { HotelResult } from './types'

// Greece — add common IATA codes that map to the same destinations
const DEMO: Record<string, Omit<HotelResult, 'id' | 'totalPriceGBP'>[]> = {
  TFS: [
    { name: 'Bahia Principe Fantasia Tenerife', stars: 5, guestScore: 8.9, guestScoreSource: 'Booking.com', boardOptions: ['AI'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.1, distanceAirportKm: 22, facilities: ['swim-up-bar', 'spa', 'kids-club', 'multiple-pools'], pricePerNightGBP: 185, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Hard Rock Hotel Tenerife', stars: 5, guestScore: 8.7, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 20, facilities: ['swim-up-rooms', 'spa', 'live-music'], pricePerNightGBP: 220, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Iberostar Selection Anthelia', stars: 5, guestScore: 9.1, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'junior-suite'], distanceBeachKm: 0.2, distanceAirportKm: 18, facilities: ['adults-only', 'spa', 'pools'], pricePerNightGBP: 198, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Gran Meliá Palacio de Isora', stars: 5, guestScore: 9.3, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.3, distanceAirportKm: 30, facilities: ['infinity-pool', 'spa', 'golf-nearby'], pricePerNightGBP: 260, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Jardines del Teide', stars: 4, guestScore: 8.4, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 19, facilities: ['swim-up-rooms', 'pools', 'animation'], pricePerNightGBP: 130, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  ACE: [
    { name: 'Gran Meliá Volcan Lanzarote', stars: 5, guestScore: 9.2, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 12, facilities: ['swim-up-rooms', 'spa', 'volcano-views'], pricePerNightGBP: 210, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Iberostar Lanzarote Park', stars: 4, guestScore: 8.8, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'junior-suite'], distanceBeachKm: 0.05, distanceAirportKm: 14, facilities: ['beachfront', 'spa', 'pools', 'kids-club'], pricePerNightGBP: 155, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'H10 Timanfaya Palace', stars: 4, guestScore: 8.6, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 13, facilities: ['adults-only', 'swim-up-rooms', 'pools'], pricePerNightGBP: 145, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Barcelo Teguise Beach', stars: 4, guestScore: 8.2, guestScoreSource: 'Booking.com', boardOptions: ['AI'], roomTypes: ['standard'], distanceBeachKm: 0.2, distanceAirportKm: 10, facilities: ['beach-club', 'pools', 'animation'], pricePerNightGBP: 118, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  PMI: [
    { name: 'Hotel Formentor — A Royal Hideaway', stars: 5, guestScore: 9.4, guestScoreSource: 'TripAdvisor', boardOptions: ['HB', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 70, facilities: ['historic', 'private-beach', 'spa', 'fine-dining'], pricePerNightGBP: 420, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Melia Calvia Beach', stars: 4, guestScore: 8.5, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 25, facilities: ['swim-up-rooms', 'beach-club', 'spa'], pricePerNightGBP: 175, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Hipotels Mediterraneo', stars: 4, guestScore: 8.1, guestScoreSource: 'Booking.com', boardOptions: ['AI'], roomTypes: ['standard'], distanceBeachKm: 0.2, distanceAirportKm: 55, facilities: ['pools', 'spa', 'animation', 'kids-club'], pricePerNightGBP: 120, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  AGP: [
    { name: 'Senator Marbella Spa Hotel', stars: 4, guestScore: 8.6, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB', 'BB'], roomTypes: ['standard', 'junior-suite'], distanceBeachKm: 0.3, distanceAirportKm: 55, facilities: ['spa', 'pools', 'beach-club'], pricePerNightGBP: 160, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Elba Motril Beach & Business Hotel', stars: 4, guestScore: 8.2, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard'], distanceBeachKm: 0.1, distanceAirportKm: 70, facilities: ['beachfront', 'pools', 'spa'], pricePerNightGBP: 115, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Finca Cortesin Hotel Golf & Spa', stars: 5, guestScore: 9.5, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['suite'], distanceBeachKm: 2, distanceAirportKm: 65, facilities: ['golf', 'spa', 'private-pool', 'fine-dining'], pricePerNightGBP: 480, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  ALC: [
    { name: 'Melia Villaitana', stars: 5, guestScore: 8.8, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 4, distanceAirportKm: 12, facilities: ['golf', 'spa', 'pools', 'kids-club'], pricePerNightGBP: 175, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'AR Golf & Spa Villaitana', stars: 4, guestScore: 8.3, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 3, distanceAirportKm: 10, facilities: ['golf', 'pools', 'spa'], pricePerNightGBP: 130, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Greece — Corfu, Rhodes, Crete, Kos, Zante, Mykonos, Santorini, Skiathos
  CFU: [
    { name: 'Domes Miramare Corfu', stars: 5, guestScore: 9.4, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB'], roomTypes: ['suite', 'villa'], distanceBeachKm: 0.05, distanceAirportKm: 35, facilities: ['private-beach', 'spa', 'fine-dining', 'adults-only'], pricePerNightGBP: 350, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Ikos Dassia', stars: 5, guestScore: 9.2, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'suite', 'bungalow'], distanceBeachKm: 0.1, distanceAirportKm: 15, facilities: ['ai-luxury', 'private-beach', 'watersports', 'spa', 'kids-club'], pricePerNightGBP: 290, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Kontokali Bay Resort & Spa', stars: 5, guestScore: 8.9, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB', 'AI'], roomTypes: ['standard', 'bungalow'], distanceBeachKm: 0.05, distanceAirportKm: 8, facilities: ['watersports', 'pools', 'spa', 'private-beach'], pricePerNightGBP: 195, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Grecotel Eva Palace', stars: 5, guestScore: 9.0, guestScoreSource: 'TripAdvisor', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'bungalow', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 12, facilities: ['private-beach', 'pools', 'spa', 'kids-club'], pricePerNightGBP: 220, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Aquis Sandy Beach Resort', stars: 4, guestScore: 8.6, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 22, facilities: ['beachfront', 'swim-up-rooms', 'pools', 'animation'], pricePerNightGBP: 145, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  RHO: [
    { name: 'Ikos Aria Rhodes', stars: 5, guestScore: 9.5, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'suite', 'bungalow'], distanceBeachKm: 0.05, distanceAirportKm: 55, facilities: ['ai-luxury', 'private-beach', 'watersports', 'spa'], pricePerNightGBP: 310, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Lindos Blu', stars: 5, guestScore: 9.3, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['suite'], distanceBeachKm: 0.1, distanceAirportKm: 45, facilities: ['adults-only', 'infinity-pool', 'sea-views', 'spa'], pricePerNightGBP: 280, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Grecotel Rhodos Royal', stars: 5, guestScore: 8.8, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'suite', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 14, facilities: ['beachfront', 'swim-up-rooms', 'spa', 'kids-club'], pricePerNightGBP: 195, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Blue Horizon Palace', stars: 4, guestScore: 8.5, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.1, distanceAirportKm: 10, facilities: ['pools', 'swim-up-rooms', 'animation'], pricePerNightGBP: 135, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  HER: [
    { name: 'Domes of Elounda Autograph Collection', stars: 5, guestScore: 9.6, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['suite', 'villa'], distanceBeachKm: 0.05, distanceAirportKm: 65, facilities: ['private-pool-villas', 'spa', 'fine-dining', 'adults-only'], pricePerNightGBP: 520, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Ikos Oceania Halkidiki', stars: 5, guestScore: 9.3, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 45, facilities: ['ai-luxury', 'private-beach', 'watersports', 'kids-club'], pricePerNightGBP: 285, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Grecotel Amirandes Boutique Resort', stars: 5, guestScore: 9.1, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB'], roomTypes: ['suite', 'bungalow'], distanceBeachKm: 0.05, distanceAirportKm: 20, facilities: ['lagoon-pool', 'private-beach', 'spa'], pricePerNightGBP: 310, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Fodele Beach & Water Park', stars: 4, guestScore: 8.7, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 20, facilities: ['waterpark', 'beachfront', 'kids-club', 'pools'], pricePerNightGBP: 145, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  KGS: [
    { name: 'Ikos Odisia Kos', stars: 5, guestScore: 9.4, guestScoreSource: 'TripAdvisor', boardOptions: ['AI'], roomTypes: ['standard', 'suite', 'bungalow'], distanceBeachKm: 0.05, distanceAirportKm: 28, facilities: ['ai-luxury', 'private-beach', 'watersports', 'spa'], pricePerNightGBP: 295, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Atlantica Belvedere Resort', stars: 5, guestScore: 9.0, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up', 'suite'], distanceBeachKm: 0.1, distanceAirportKm: 32, facilities: ['swim-up-rooms', 'pools', 'spa', 'kids-club'], pricePerNightGBP: 195, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Creta Maris Beach Resort', stars: 4, guestScore: 8.7, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'bungalow'], distanceBeachKm: 0.05, distanceAirportKm: 26, facilities: ['beachfront', 'pools', 'animation', 'kids-club'], pricePerNightGBP: 140, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Cyprus
  PFO: [
    { name: 'Annabelle Hotel Paphos', stars: 5, guestScore: 9.3, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 12, facilities: ['private-beach', 'spa', 'fine-dining', 'pools'], pricePerNightGBP: 230, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Aphrodite Hills Resort', stars: 5, guestScore: 9.1, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite', 'villa'], distanceBeachKm: 2, distanceAirportKm: 20, facilities: ['golf', 'spa', 'pools', 'multiple-restaurants'], pricePerNightGBP: 260, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Elysium Hotel', stars: 5, guestScore: 9.0, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.1, distanceAirportKm: 15, facilities: ['spa', 'pools', 'fine-dining', 'beach-club'], pricePerNightGBP: 210, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Coral Beach Hotel & Resort', stars: 4, guestScore: 8.6, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB', 'BB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 18, facilities: ['private-beach', 'swim-up-rooms', 'pools', 'kids-club'], pricePerNightGBP: 150, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Azia Resort & Spa', stars: 5, guestScore: 9.2, guestScoreSource: 'TripAdvisor', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up', 'suite'], distanceBeachKm: 0.5, distanceAirportKm: 10, facilities: ['adults-only', 'swim-up-rooms', 'spa', 'infinity-pool'], pricePerNightGBP: 195, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  LCA: [
    { name: 'Nissi Beach Resort', stars: 4, guestScore: 8.8, guestScoreSource: 'TripAdvisor', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up'], distanceBeachKm: 0.05, distanceAirportKm: 8, facilities: ['beachfront', 'swim-up-rooms', 'pools', 'animation'], pricePerNightGBP: 145, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Adams Beach Hotel', stars: 5, guestScore: 9.0, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 10, facilities: ['beachfront', 'spa', 'pools', 'multiple-restaurants'], pricePerNightGBP: 175, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Atlantica Aeneas Resort', stars: 5, guestScore: 8.9, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard', 'swim-up', 'junior-suite'], distanceBeachKm: 0.1, distanceAirportKm: 7, facilities: ['swim-up-rooms', 'spa', 'kids-club', 'pools'], pricePerNightGBP: 160, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Dome Beach Hotel & Resort', stars: 4, guestScore: 8.5, guestScoreSource: 'Booking.com', boardOptions: ['AI', 'HB'], roomTypes: ['standard'], distanceBeachKm: 0.05, distanceAirportKm: 9, facilities: ['beachfront', 'pools', 'animation', 'kids-club'], pricePerNightGBP: 115, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Florida
  MCO: [
    { name: 'Loews Sapphire Falls Resort', stars: 4, guestScore: 8.9, guestScoreSource: 'TripAdvisor', boardOptions: ['RO', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: undefined, distanceAirportKm: 25, facilities: ['universal-onsite', 'pools', 'waterslide', 'spa'], pricePerNightGBP: 195, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Walt Disney World Swan Reserve', stars: 4, guestScore: 9.1, guestScoreSource: 'Booking.com', boardOptions: ['RO', 'BB'], roomTypes: ['standard', 'suite'], distanceBeachKm: undefined, distanceAirportKm: 30, facilities: ['disney-benefits', 'pools', 'spa', 'fine-dining'], pricePerNightGBP: 225, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Rosen Shingle Creek', stars: 4, guestScore: 8.7, guestScoreSource: 'TripAdvisor', boardOptions: ['RO', 'BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: undefined, distanceAirportKm: 18, facilities: ['golf', 'spa', 'multiple-pools'], pricePerNightGBP: 155, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
  // Dubai
  DXB: [
    { name: 'Atlantis The Palm', stars: 5, guestScore: 8.8, guestScoreSource: 'TripAdvisor', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.05, distanceAirportKm: 40, facilities: ['waterpark', 'private-beach', 'casino', 'fine-dining', 'spa'], pricePerNightGBP: 380, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Jumeirah Beach Hotel', stars: 5, guestScore: 9.0, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite', 'club'], distanceBeachKm: 0.05, distanceAirportKm: 30, facilities: ['private-beach', 'burj-al-arab-access', 'pools', 'spa'], pricePerNightGBP: 310, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: 'Address Beach Resort', stars: 5, guestScore: 9.3, guestScoreSource: 'Booking.com', boardOptions: ['BB', 'HB'], roomTypes: ['standard', 'suite'], distanceBeachKm: 0.1, distanceAirportKm: 28, facilities: ['infinity-pool', 'private-beach', 'spa', 'fine-dining'], pricePerNightGBP: 275, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ],
}

function generic(cityCode: string, minStars: number): Omit<HotelResult, 'id' | 'totalPriceGBP'>[] {
  return [
    { name: `Grand Resort ${cityCode}`, stars: Math.max(4, minStars), guestScore: 8.5, guestScoreSource: 'TripAdvisor', boardOptions: ['AI', 'HB'], roomTypes: ['standard'], distanceBeachKm: 0.5, distanceAirportKm: 20, facilities: ['pool', 'spa', 'restaurant'], pricePerNightGBP: 140, atolProtected: true, source: 'Demo', bookingUrl: 'https://www.booking.com' },
    { name: `Sunset Beach Hotel ${cityCode}`, stars: Math.max(4, minStars), guestScore: 8.1, guestScoreSource: 'Booking.com', boardOptions: ['HB', 'BB'], roomTypes: ['standard'], distanceBeachKm: 1, distanceAirportKm: 15, facilities: ['pool', 'restaurant'], pricePerNightGBP: 110, atolProtected: false, source: 'Demo', bookingUrl: 'https://www.booking.com' },
  ]
}

export function getHotels(cityCode: string, nights: number, minStars = 4): HotelResult[] {
  const raw = (DEMO[cityCode] ?? generic(cityCode, minStars)).filter(h => h.stars >= minStars)
  return raw.map((h, i) => ({
    ...h,
    id: `hotel-${cityCode}-${i}`,
    totalPriceGBP: Math.round(h.pricePerNightGBP * nights),
  }))
}
