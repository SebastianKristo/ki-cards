# ki-cards 4.30.0

## Dra-animasjon på «I dag / I morgen» i strømpriskortet

`ki-strompris-card` har nå samme glidende pille, dra og trykkeffekt som de andre
faneradene.

### To ting måtte håndteres

**Kortet er frittstående med vilje.** Det skal kunne legges i `/local/` og brukes uten
ki-cards, og et direkte oppslag på `KI` kastet da «KI is not defined» — kortet forsvant
fra bundelen. Nå leter det på `window.KI` og lar animasjonen være hvis den ikke er der.
Kortet virker likt uansett; det er bare bevegelsen som mangler.

Byggeskrittet fanget det: kortantallet falt fra 54 til 53.

**«I morgen» kan være tom** før morgendagens priser er klare. `KI.pillefaner` hopper nå
over faner som er `disabled` eller har en «av»-klasse — uten det ville dra landet på den,
og klikket blitt avvist uten at man forsto hvorfor. Klassen oppgis med `av:` i valgene.

### Nå med glidende pille

`ki-tabs-card`, `ki-hjem-card` (etasjevelgeren), `ki-avfall-card`, `ki-sovn-pro-card` og
`ki-strompris-card`.

`ki-klima-strom-kort` er fortsatt et eget repo uten tilgang til hjelperen.

---

# ki-cards 4.29.0

Seks nye mål på fanerada — høyde, sidepadding, fanebredde, tekststørrelse, like brede
faner og radbredde — som bare slår inn når de settes.
