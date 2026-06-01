# Stack & Borrow — Regler för Claude

## Arbetssätt

- **Rör aldrig `main` direkt.** Sajten publiceras automatiskt så fort något når `main`. Jobba alltid i en sidogren och öppna en PR. Ägaren granskar och mergar — Claude mergar aldrig själv.
- Fråga hellre en gång extra än gör stora antaganden.

## Projektfokus

- Sajten är **100 % bitcoin**. Bara BTC-lån. Bredda aldrig mot generella "kryptolån" eller andra tillgångsslag.

## Räntepresentation

- Alla procentsatser som visas **för användare** ska vara **effektiv ränta** (ränta + avgifter, allt-i-allt). Visa aldrig bara den nakna nominella räntan.

## Lender-data (`public/lenders.json`)

- Om en långivare slutar erbjuda **privatlån** i en region: **ta bort** den regionskoden från `country`-fältet. Behåll den inte med en "endast företag"-flagga eller liknande.
- Exempel: Ledn erbjuder sedan 1 april 2025 inte längre privatlån i EU → `"eu"` är borttaget från Ledns `country`-lista.

## Deployment

- Plattform: Cloudflare Pages. Deploy triggas automatiskt vid push till `main`.
- Bygg: `npm run build` (Vite + React). Lokal dev: `npm run dev`.
- Lenderdatan lever i `public/lenders.json` och kan uppdateras utan att röra koden.
