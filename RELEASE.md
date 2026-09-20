# ki-cards 5.23.0

## Pilla ser ut som før, men oppfører seg som en dråpe

5.22.0 gjorde pilla til glass å se på — uskarphet, gjennomskinnelighet og et lysstrøk. Det er
tatt bort. Pilla er igjen den samme fylte pillen som i `ki-tabs-card`; det som er nytt er hvordan
den **beveger** seg:

- **Trykk:** pilla klemmes flat under fingeren (0,94 × 0,86) og går tilbake når du slipper.
- **Dra:** den strekker seg i fartsretningen, mest når du drar langt — opptil 13 %, med tilsvarende
  sammenpressing på høyden, slik at volumet ser bevart ut.
- **Landing:** når dagen faktisk byttet, spretter den på plass med en kort fjær (1,10 → 0,97 → 1,00).

Trykk, dra og slipp mellom fanene virker som i `ki-tabs-card` — det er samme `KI.pillefaner` som
kjører under.

Hele bevegelsen ligger på `::before`, ikke på pilla selv. Basen plasserer pilla med
`translateX(var(--x))`, så en skalering på samme element ville overskrevet plasseringen og fått
pilla til å hoppe til venstre kant midt i glidningen. `::before` ligger oppå med `inset:0` og kan
skaleres fritt.

`sprett: false` gjør pilla helt stille. Feltet het `glass` i 5.22.0, og det gamle navnet godtas
fortsatt, så ingen konfigurasjon slutter å virke.

### Kontrollert

`node --check` og begge byggesjekkene (`verifiser-styles`, `verifiser-kort`) kjørt — 110 kort leser
styles, 59 kort bygges med hass. Lytterne ligger på `shadowRoot`, ikke på fanerada: basen tar
pekerfangst på knappen, så `pointermove` og `pointerup` går dit, og rada overlever ikke en ny
tegning slik shadowRoot gjør. `prefers-reduced-motion` slår av både fjæra og spretten.

Ingen andre kort er rørt. Feltet i editoren heter nå **Sprett i pilla ved trykk og dra**.
