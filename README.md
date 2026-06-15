# HolidayIQ — AI Holiday Search Engine

Search 30+ sources simultaneously. Every result scored for genuine value, not just price.

## Quick start (5 minutes)

### 1. Get your two free API keys

| Key | Where | Time |
|-----|-------|------|
| ANTHROPIC_API_KEY | console.anthropic.com | Instant |
| DUFFEL_API_KEY | app.duffel.com → Developers → API tokens | 2 min |

> **Note:** Amadeus for Developers self-service is being decommissioned July 2026. HolidayIQ now uses Duffel for live flight search.

### 2. Add them to .env.local

```
ANTHROPIC_API_KEY=sk-ant-...
DUFFEL_API_KEY=duffel_test_...
```

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000

---

## What works immediately with just those two keys

- Natural language search (Claude parses plain English)
- Live flight search via Duffel (all major airlines, GDS-backed)
- Hotel results with realistic curated data for 10+ top destinations
- Value scoring on every result
- Florida module — Debbie's Villa featured + area guide
- Car hire and transfer results (realistic demo data until you add keys)

## Going live with car hire, transfers, and villas

| Feature | Key to add | Apply at |
|---------|-----------|----------|
| Car hire | RENTALCARS_API_KEY | partners.rentalcars.com |
| Transfers | HOLIDAY_TAXIS_API_KEY | holidaytaxis.com/affiliates |
| Villas | VRBO_API_KEY | Vrbo Partner Hub |

Add the key to .env.local — demo data is replaced automatically.

## Debbie's Villa

In .env.local set:
  DEBBIES_VILLA_URL=your booking link or mailto:
  DEBBIES_VILLA_IMAGE_URL=your hosted photo URL

Debbie's Villa always appears first in all Florida searches.

## Deploy to production (free on Vercel)

```bash
npx vercel
```

Add your .env.local keys in the Vercel dashboard under Settings > Environment Variables.

## Structure

app/page.tsx            — Homepage
app/search/page.tsx     — Results (packages, flights, hotels, cars, villas)
app/florida/page.tsx    — Florida module
app/api/parse-query/    — Claude NLP parser
app/api/search/         — Search orchestrator
app/api/flights/        — Duffel flights
app/api/hotels/         — Curated hotel data (10+ destinations)
app/api/cars/           — Car hire
app/api/villas/         — Villas + Debbie's Villa
app/api/transfers/      — Transfers
lib/types.ts            — All TypeScript types + airport groups
lib/scoring.ts          — Value Score algorithm
lib/claude.ts           — Claude integrations
lib/duffel.ts           — Duffel flight API client
components/             — All UI components
