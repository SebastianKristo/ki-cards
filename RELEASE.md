# ki-cards 8.99.8

Bygget oppå 8.99.7 fra GitHub.

## ki-vanning-card 4.3.1: flatt, uten glass

Mange av kortene i vanningspopupen hadde et glasspreg: tynne hvite kanter, blå gradienter, halvgjennomsiktige
hvite knapper og uskarphet bak. Nå følger de DESIGN.md:

- **Flater** i `--gray200` uten kant, skygge, gradient eller gjennomsiktighet — Neste vanning, Neste 7 dager, fliser,
  sonelistene, programmene, agendaen.
- **Statuskortene** (regnpause, hovedventilen stengt) er flate grå kort med fargen i ikonsirkelen: blå for regn,
  oransje for hovedventilen.
- **Det som vanner** — en sone eller et program — får en flat blå tone og en helblå ikonsirkel i stedet for gradient.
- **Knapper og brikker** er flate i `--gray100` i stedet for halvgjennomsiktig hvitt.
- **Innstillingene** åpnes på en tett bakgrunn uten uskarphet, og tannhjulet i scenen har ingen uskarphet bak seg.
- Ikonet på sonen som vanner, pulserer ikke lenger.

Hagescenen øverst er som før.

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med demo-dataene i alle fanene; den flate stilen ligger sist, så den
gjelder over de eldre reglene. Ingen `NaN` eller `undefined`.
