# ki-cards 8.94.0

Bygget oppå 8.92.0 fra GitHub. Inneholder også 8.93.0 (bilen som sensor i kartet), som ikke er pushet.

## ki-entur-card 2.0: kollektivtavla

Bussoversikten er blitt en tavle for alt fra Entur — buss, T-bane og trikk — samlet i **tavler** som kan hente fra
flere holdeplasser og plattformer.

- **Linjemerket i Ruters farger:** T-bane oransje, trikk blå, buss rød, regionbuss grønn, flybuss grå, nattbuss
  mørkeblå — ut fra linjenummeret (1–5 T-bane, 11–19 trikk, 100+ region, FB fly, N natt).
- **Neste avgang stort** øverst på hver tavle — minutter, klokkeslett, i rute eller forsinket — og **de neste i en
  liste** under (`antall:`, standard 4), med forsinkede i oransje.
- **Filter per sensor:** `mot:` (bare mot «Voksen skog») og `linje:` (bare T-bane 2 fra en plattform som også har
  5-eren). En ren sensor-id tar med alt.
- **Gangtid** per tavle eller per sensor. Med gangtid er den store avgangen den første du *rekker*, og avganger du
  ikke rekker, står dempet i lista.
- Avganger mer enn 90 minutter fram (`maks_min:`) vises ikke — nattbussene på dagtid holdes unna.
- `retninger:` fra 1.0 virker fortsatt.

`examples/buss-popup.yaml` er Kollektiv-popupen med dine sensorer: **Til byen** (45 og 46 fra Amagerveien/Hovseter,
T-bane 2 fra Hovseter), **Hjem** (45 mot Voksen skog, 46 mot Ullerntoppen og T-bane 2 mot Østerås fra Majorstuen),
**Trikk mot Majorstuen** (19 fra Holbergs plass, Homansbyen og Frydenlund), **Bislett**, **Smestad** og
**Radiumhospitalet**.

### Kontrollert

Begge byggesjekkene kjørt. Tavla er kjørt med avganger fra ni av sensorene: «Til byen» med gangtid 3 viser 45 om 3
min som den store (46 om 2 min er dempet som «rekker ikke»), T-bane 2 med oransje merke; «Hjem» filtrerer bort
28 Fornebu og 5 Sognsvann; trikken får blått merke, flybussen grått, og nattbussen 650 min fram er utelatt.
Ingen `NaN` eller `undefined`.

---

## (8.93.0)

Bygget oppå 8.92.0 fra GitHub (ki-basseng-card 3.4 er med uendret).

## ki-kart-card 1.3.0: bilen som sensor

Bilens posisjon kan nå komme fra en **sensor** som `sensor.tesla_model_y_plassering` — adressen som tilstand,
`latitude`/`longitude` som attributter — ikke bare fra en `device_tracker`. Kortet finner den av seg selv
(sensor med «tesla» og «plassering/location/posisjon» i navnet) når det ikke finnes en sporer med posisjon.

- **Uten gyldig posisjon** (0,0, slik sensoren står nå): raden viser adressen — «Hasshallingevägen Kebal · i
  1 t» — og batteriet, og bilen holdes borte fra kartet i stedet for å havne i Guineabukta.
- **Med posisjon:** sonen finnes ut fra posisjonen og sonens radius («Strømstad»), avstanden hjemmefra
  regnes ut, bilen står i sonebrikken og vises på kartet.

`bil: sensor.tesla_model_y_plassering` i oppsettet velger den uansett.

### Kontrollert

Begge byggesjekkene kjørt. Kartkortet er kjørt med sensoren slik den står (0,0): funnet av seg selv, ikke på
kartet, raden «Hasshallingevägen Kebal · i 1 t · 64 %». Med koordinater i Strömstad: på kartet, raden
«Strømstad · 64 % · 117 km unna», og «Strømstad: Sebastian, Bilen» i sonene.
