# ki-cards 4.26.0

## Glidende pille og dra på `simple-tabs` også

Etasjevelgeren i `ki-hjem-card`, kalenderfanene og «Framover» bruker alle
**`simple-tabs`** — ikke `ki-tabs-card`. Animasjonen fra 4.25.0 gjaldt derfor ikke der.

`simple-tabs.js` er minifisert tredjepartskode. En lapp i den fila ville forsvunnet ved
neste oppdatering av kortet, så den er ikke rørt.

I stedet settes pilla og håndtererne inn i kortets **shadowRoot** — samme vei
`ki-hjem-card` alt injiserer CSS dit. Ny hjelper: `KI.pillefaner(element)`.

### Den tar ikke over valget

Pilla følger kortets egen `.active`-klasse gjennom en `MutationObserver`, og ved slipp
kaller vi knappens **egen** `click()`. Da virker deep-link, fanehukommelse og haptikk som
før — vi legger bare bevegelsen oppå.

Kortets egen aktivbakgrunn slås av, siden pilla er den nå.

### Virker nå i

Etasjevelgeren, uten at du endrer noe. Den bygges av `ki-hjem-card`, og hjelperen kalles
der CSS-en alt injiseres.

**Kalender og Framover er dine egne `simple-tabs` i YAML**, så de får den ikke
automatisk. To veier: bytt de to til `custom:ki-tabs-card`, som har animasjonen innebygd
og i tillegg lar deg flytte faner i UI — eller si fra, så legger jeg inn en global
oppgradering som tar alle `simple-tabs` på siden. Jeg gjorde ikke det siste uoppfordret:
å endre kort du ikke har bedt om er for inngripende.

### Kontrollert

Pilla settes inn først i rada, stilen legges i shadowRoot, plasseringen måles fra
rektangelet, kortets aktivbakgrunn slås av, og et nytt kall på samme element gir ikke to
piller.

Bygget stoppet først på at hjelperen lå utenfor modulen — `verifiser-styles` fanget det.

---

# ki-cards 4.25.1

Pilla lå tre piksler for langt til venstre; måles nå med `getBoundingClientRect`.
