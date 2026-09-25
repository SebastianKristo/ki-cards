# ki-cards 8.92.0

Bygget oppå 8.91.0 fra GitHub.

## ki-basseng-card 3.4.0: Spreder og Innstillinger i nytt design

- **Spreder:** scenen er et bilde med «Står» / «8 min igjen», start og stopp er én stor knapp
  (blå / rød), «Brukt i dag» med stolpe mot taket og «Program» med bryter er fliser, og hvor lenge
  den går velges med faste knapper (5–30 min). Under står programmet som rader: start hver,
  maks per døgn, varighet og frostvakt.
- **Innstillinger:** gruppert i Styring, Pumpe, Varme, Varmemodell, Klor, Vannivå og I dag, med
  rader i samme form som resten av kortet – ikon, navn, en linje om hva den gjør, og verdien til
  høyre. Trykk hvor som helst på en tallrad for hjulvelgeren. Det modellen har lært, står som
  brikker.

Klorstatus og valg av mobiler for varsel ligger i KI Basseng 1.9.

---

# ki-cards 8.91.0

Bygget oppå 8.90.0 fra GitHub.

## ki-kart-card 1.2.0: kartet fyller skjermen — også i høyden

Etter første titt på iPaden:

- **Høyden** regnes nå ut fra der kartet faktisk starter til bunnen av skjermen (minus `bunn:`, 20 px), i
  stedet for en fast luft på 170 px. Popupens topp er høyere enn det, så brikkene med personene ble kuttet
  nederst. Høyden måles på nytt etter at popupen har glidd inn, og når vinduet endrer størrelse.
- **Ingen samling i tall.** Kartkortet samlet personer som står nær hverandre til en boble med «3». Nå får
  hver person og bilen sitt eget merke (`samle: true` gir samlingen tilbake).
- **Sonebrikkene** øverst starter til høyre for zoomknappene, som de dekket.

**Bredden** styres av popupen: `examples/kart-popup.yaml` har nå `width_desktop: 94%`, så popupen går nesten
kant til kant på iPaden.

### Kontrollert

Begge byggesjekkene kjørt. Kartkortet i stor visning: kartkortet får `cluster: false`, tre soner øverst og fire
brikker nederst; popupen er gyldig YAML med `width_desktop: 94%`.
