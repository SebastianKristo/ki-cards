<p align="center"><img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/logo.svg" width="96"></p>

# KI Cards

Alle egne Lovelace-kort for Home Assistant samlet i ett HACS-repo og én fil, `dist/ki-cards.js`.
De nye `ki-*`-kortene bruker temaets CSS-variabler (`--gray100`, `--gray200`, `--gray1000`, `--active-big`,
`--yellow`, `--green`, …) så de følger dashboardets utseende uten `card_mod`. `ki-*`-kortene er tatt inn uendret.
Hvert kort er pakket i sin egen blokk, så én feil stopper ikke resten – og kort som allerede finnes
(for eksempel `ki-klima-pro-card` installert via [ki-strom](https://github.com/SebastianKristo/ki-strom)) hoppes over.

## Installasjon

**HACS:** Legg til `https://github.com/SebastianKristo/ki-cards` som egendefinert repository (type *Dashboard*),
last ned *KI Cards*, last dashboardet på nytt. Ressursen registreres automatisk.

**Manuelt:** Kopier `dist/ki-cards.js` til `/config/www/ki-cards.js` og legg til ressursen
`/local/ki-cards.js` (JavaScript-modul) under *Innstillinger → Dashboards → Ressurser*.

## Kortene

### Systemkort (ki-*)

| | Kort | Navn | Bruk |
|---|---|---|---|
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-klima-pro-card.svg" width="28" align="absmiddle"> | `ki-klima-pro-card` | KI Klima Pro | Hele klima- og energisystemet: status, soner, energi, varmtvann, motorens resonnement og logg |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-klima-card.svg" width="28" align="absmiddle"> | `ki-klima-card` | KI Klima | Klimastyring med enkel og avansert visning, effektvakt og sonestyring |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-energi-card.svg" width="28" align="absmiddle"> | `ki-energi-card` | KI Energi | Timebudsjett, laster, beslutningslogg og innstillinger for KI-energimotoren |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-energi-card-strom.svg" width="28" align="absmiddle"> | `ki-energi-card-strom` | KI Energi Strøm | Strømvariant av KI Energi-kortet |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-energy-card.svg" width="28" align="absmiddle"> | `ki-energy-card` | KI Energy | Energioversikt i Homey Energy-stil med graf og toppforbrukere |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-stromregning-card.svg" width="28" align="absmiddle"> | `ki-stromregning-card` | KI Strømregning | Strømregning, nettleie, kapasitetsledd og Norgespris |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-vekkealarm-card.svg" width="28" align="absmiddle"> | `ki-vekkealarm-card` | KI Vekkealarm | Vekkealarm med ukeplan, nedtelling, lysinnstillinger og testkjøring |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-alarm-card.svg" width="28" align="absmiddle"> | `ki-alarm-card` | KI Alarm | Alarmsentral med soner, sensorstatus og kodetastatur |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-kamera-card.svg" width="28" align="absmiddle"> | `ki-kamera-card` | KI Kamera | Kameraoversikt med bryter mellom Frigate og direkte strøm |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-ruter-card.svg" width="28" align="absmiddle"> | `ki-ruter-card` | KI Ruter | Kollektivavganger fra Entur med avviksvarsler |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-helse-card.svg" width="28" align="absmiddle"> | `ki-helse-card` | KI Helse | Aktivitet, hjerte, søvn og kropp fra Apple Health |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-k2-card.svg" width="28" align="absmiddle"> | `ki-k2-card` | KI Creality K2 | 3D-printer med status, kamera, filament, vifter og energi |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/family-status-card.svg" width="28" align="absmiddle"> | `family-status-card` | Family Status | Status for husstanden. Langt trykk på en person åpner `hold_navigation_path` per person, ellers kortets `navigation_path` |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-planter-card.svg" width="28" align="absmiddle"> | `ki-planter-card` | KI Planter | Vanning av planter fra [ki-planter](https://github.com/SebastianKristo/ki-planter): finner plantene selv, `sted:` filtrerer (mode: list / tile) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-sovn-card.svg" width="28" align="absmiddle"> | `ki-sovn-card` | KI Søvn | Søvnstatus per person fra [ki-sovn](https://github.com/SebastianKristo/ki-sovn) (mode: list / tile) |

### Pro-kort (samme stil som ki-energi-card / ki-klima-pro-card – hero med ring, Enkel/Avansert, blokker)

| Kort | Bruk |
|---|---|
| `ki-sovn-pro-card` | Søvn for husstanden: ring med antall som sover, personer som ekspanderbare rader med sannsynlighet, observasjoner og (Avansert) tider/terskler/regler |
| `ki-vekking-pro-card` | Vekkealarm: ring med neste alarm og nedtelling, ukeplan, (Avansert) lys, person, betingelser og logg |
| `ki-planter-pro-card` | Planter: ring med antall vannet, planter som rader med fremdrift, tips, «vannet nå», (Avansert) intervall og varsling |

Eksempler: `examples/sovn-popup.yaml`, `vekking-popup.yaml`, `planter-popup.yaml`, `oversikt-tiles.yaml`.

### Byggeklosser

| | Kort | Bruk |
|---|---|---|
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-toggle-card.svg" width="28" align="absmiddle"> | `ki-toggle-card` | Bryter som rad (`size: row`) eller flis (`size: tile`) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-toggle-list-card.svg" width="28" align="absmiddle"> | `ki-toggle-list-card` | Liste av `ki-toggle-card` fra filter (erstatter auto-entities) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-tabs-card.svg" width="28" align="absmiddle"> | `ki-tabs-card` | Faner som piller eller nedtrekksmeny (`style: auto` bytter selv når de ikke får plass), `sticky: true` |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-section-card.svg" width="28" align="absmiddle"> | `ki-section-card` | Liten seksjonstittel |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-slider-card.svg" width="28" align="absmiddle"> | `ki-slider-card` | Etikett, slider og verdi for `input_number` / `number` |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-action-card.svg" width="28" align="absmiddle"> | `ki-action-card` | Knapp som kjører en tjeneste, med valgfri bekreftelse |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-vekking-card.svg" width="28" align="absmiddle"> | `ki-vekking-card` | Vekkealarm fra ki-sovn v2: neste alarm, ukedager med tid, lys, person, betingelser, test (mode: list / tile) |

Ikonene ligger i `brand/` som SVG og PNG (256 px).

### ki-toggle-card
```yaml
type: custom:ki-toggle-card
entity: switch.ki_helgemodus
name: Helgemodus          # valgfri, ellers friendly_name
label: Undertekst         # valgfri
icon: mdi:airplane-takeoff # null = skjul ikon
size: tile                # row (standard) | tile
background: var(--gray200)
state_on: På
state_off: Av
tap_action: toggle        # toggle | more-info
hold_action: more-info
```

### ki-toggle-list-card
```yaml
type: custom:ki-toggle-list-card
include:
  - domain: automation
    entity_id: automation.push_*     # glob med *
  - entity_id: switch.ki_klima_hovedbryter
exclude: []
sort: name                # name (standard) | domain
gap: 8
item:                     # standardvalg sendt til hvert ki-toggle-card
  background: var(--gray200)
```

### ki-tabs-card
```yaml
type: custom:ki-tabs-card
default: 0
align: center             # center | flex-start | flex-end
tabs:
  - title: Automasjoner
    icon: mdi:robot       # valgfri
    cards:
      - type: custom:ki-section-card
        title: Hei
```

### ki-slider-card
```yaml
type: custom:ki-slider-card
entity: input_number.alarm_fade_minutter
name: Fade opp
unit: " min"              # standard: enhet fra entiteten
step: 1                   # standard: fra entiteten
label_width: 106px
value_width: 80px
```

### ki-action-card
```yaml
type: custom:ki-action-card
name: Test vekkesekvens
icon: mdi:play-circle
background: var(--gray100)
confirm: Kjøre nå?        # valgfri bekreftelsesdialog
action:
  service: automation.trigger
  target:
    entity_id: automation.soverom_vekkealarm_gradvis_lys
  data:
    skip_condition: true
```

### ki-planter-card
```yaml
type: custom:ki-planter-card
mode: list                # list (popup) | tile (oversikt, tap åpner hash/navigation_path)
hash: '#planter-sebastian'
confirm: false
plants:
  - id: areca
    name: Arekapalme
    latin: Dypsis lutescens
    icon: mdi:palm-tree
    tip: Liker jevnt fuktig jord.
    # standard: input_datetime.plante_<id>_sist_vannet og input_number.plante_<id>_intervall
```

### ki-vekking-card
Forventer entitetene `input_boolean.<prefix>_master`, `input_boolean.<prefix>_<dag>_aktiv`,
`input_datetime.<prefix>_<dag>`, `input_number.<prefix>_fade_minutter`,
`input_number.<prefix>_av_etter_minutter` og `input_boolean.<prefix>_nattlampe`
(dager: mandag … sondag). Alle kan overstyres.
```yaml
type: custom:ki-vekking-card
name: Gradvis lys
prefix: alarm
automation: automation.soverom_vekkealarm_gradvis_lys
expanded: false
conditions:
  - entity: switch.sebastian_posisjon_hjemme_borte
    name: Sebastian hjemme
days:                     # valgfri overstyring per dag
  mandag:
    active: input_boolean.alarm_mandag_aktiv
    time: input_datetime.alarm_mandag
fade: input_number.alarm_fade_minutter
off_after: input_number.alarm_av_etter_minutter
nattlampe: input_boolean.alarm_nattlampe
test: true
```

Et komplett eksempel på Innstillinger-popupen ligger i [`examples/innstillinger-popup.yaml`](examples/innstillinger-popup.yaml).

## Utvikling

Kildekoden ligger i `src/` (de nye kortene, ett per fil) og `src/cards/` (ki-kortene, uendret).
`./build.sh` setter alt sammen til `dist/ki-cards.js` som ES-modul og kjører `node --check`.
Nye kort: legg fila i `src/cards/`, lag et ikon i `brand/`, bygg, bump versjon. Bump `SK.VERSION` i `src/00-sk-base.js` før du bygger, så cache-bustes ressursen
riktig i HACS.

`ki-klima-pro-card` finnes også i [ki-strom](https://github.com/SebastianKristo/ki-strom); den nyeste av de to bør vinne –
oppdater `src/cards/ki-klima-pro-card.js` herfra når ki-strom får ny kortversjon.

## v2.0.0
- `ki-tabs-card`: `style: auto|pills|dropdown`, `sticky: true`, `align`, `gap`.
- Alle ki-kort har lås mot horisontal overflyt (`max-width: 100%; overflow: hidden`) – ingen kort «sklir» ut av popupen lenger.
- `ki-vekking-card`, `ki-sovn-card` og `ki-planter-card` finner entitetene sine selv via markørattributtet `integrasjon` fra
  [ki-sovn v2](https://github.com/SebastianKristo/ki-sovn) og [ki-planter](https://github.com/SebastianKristo/ki-planter).
  Ingen `prefix`/`persons`/`plants` nødvendig (kan fortsatt settes).
- `ki-sovn-card`: manuell overstyring bruker `button.<navn>_sovn_sett_sover/_sett_vaken`, viser «sover siden».
- Eksempler i `examples/`: `innstillinger-popup.yaml` (nedtrekksmeny med Automasjoner / Varsler / Vekking / Søvn / Planter), `sovn-popup.yaml`, `planter-popup.yaml`, fliser.

## v2.1.0
- `ki-sovn-card`: ny rad-layout (avatar, navn, «siden HH:MM», status + prosent, bryter). Innstillinger ligger bak «Innstillinger»-raden
  i tre grupper (Tider / Terskler / Regler). Tydelig feilmelding når personen ikke finnes i integrasjonen.
- `ki-vekking-card`: ryddet i blokker – hode, stor neste-alarm, «Ukeplan» (dagpiller + tider i to kolonner), og «Lys, person og
  betingelser» bak en disclosure-rad. Handlinger nederst.
- `ki-planter-card`: detaljer i samme gruppe-stil (sist vannet, neste vanning, intervall).

## v2.2.0
- Nye `ki-sovn-pro-card`, `ki-vekking-pro-card`, `ki-planter-pro-card` i ki-energi/klima-pro-stil, med egne popuper.
- Innstillinger-popupen har bare Automasjoner og Varsler igjen.
