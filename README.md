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
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/family-status-card.svg" width="28" align="absmiddle"> | `family-status-card` | Family Status | Status for husstanden. Er personen hjemme, viser merket søvntilstanden i stedet for stedet. Langt trykk på en person åpner `hold_navigation_path` per person, ellers kortets `navigation_path` |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-bursdag-card.svg" width="28" align="absmiddle"> | `ki-bursdag-card` | KI Bursdag | Bursdager fra Birthdays-sensorer: «Kommende» (neste N) og «Hele året» gruppert per måned |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-natt-card.svg" width="28" align="absmiddle"> | `ki-natt-card` | KI Natt | Nattmodus og helgemodus. Om dagen to brytefliser, om natten ett kort med et hus som sovner |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-vaer-card.svg" width="28" align="absmiddle"> | `ki-vaer-card` | KI Vær | Vær med levende himmel, solbue, månefase, UV og time-/døgnprognoser |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-fjernkontroll-card.svg" width="28" align="absmiddle"> | `ki-fjernkontroll-card` | KI Fjernkontroll | Apple TV: status, seertid, styreflate med sveip, knapper, volum og kilder |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-media-card.svg" width="28" align="absmiddle"> | `ki-media-card` | KI Media | Nå spilles med levende omslag, radiokanaler, transport og volum |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-prosa-card.svg" width="28" align="absmiddle"> | `ki-prosa-card` | KI Prosa | Forsidetekst som skriver seg selv, med levende piller for vær, pris, forbruk, apparater og varsler |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-soppel-card.svg" width="28" align="absmiddle"> | `ki-soppel-card` | KI Søppel | Dager til neste tømming, med søppelbil og ristende dunk på tømmedagen |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-strompris-card.svg" width="28" align="absmiddle"> | `ki-strompris-card` | KI Strømpris | Døgnets priser med spotpris og Norgespris, faner for i dag og i morgen |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-vanning-card.svg" width="28" align="absmiddle"> | `ki-vanning-card` | KI Vanning | OpenSprinkler: soner, programmer og hurtigvanning – setter seg opp selv |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-hytte-card.svg" width="28" align="absmiddle"> | `ki-hytte-card` | KI Hytte | Hyttebesøk fra [ki-hyttebesok](https://github.com/SebastianKristo/ki-hyttebesok): månedskalender, opphold og statistikk |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-fremover-card.svg" width="28" align="absmiddle"> | `ki-fremover-card` | KI Framover | Kommende hendelser fra kalenderne, gruppert per dag med filter per kalender |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-lansering-card.svg" width="28" align="absmiddle"> | `ki-lansering-card` | KI Lansering | Kommende episoder og filmer fra Sonarr og Radarr, med plakat og bakgrunnsbilde |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-post-card.svg" width="28" align="absmiddle"> | `ki-post-card` | KI Post | Når posten kommer |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-bursdag-pro-card.svg" width="28" align="absmiddle"> | `ki-bursdag-pro-card` | KI Bursdag Pro | Bursdager i kalenderkort-stil |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-enhet-card.svg" width="28" align="absmiddle"> | `ki-enhet-card` | KI Enhet | Levende statuskort for ruter, switch, AP, server, VM og container – ringmålere, figuranimasjon, infofliser og knapper |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-wifi-card.svg" width="28" align="absmiddle"> | `ki-wifi-card` | KI Wi-Fi | SSID med QR-kode, klienter og av/på, med wifi-ringer når nettet er på |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-porter-card.svg" width="28" align="absmiddle"> | `ki-porter-card` | KI Porter | Switch-porter med aktivitetslys, av/på eller strømsykling |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-sensor-card.svg" width="28" align="absmiddle"> | `ki-sensor-card` | KI Sensor | Universelt sensorkort i `universal_sensor_ny`-stilen, med levende bakgrunn: søyler, bølge eller puls |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-panel-card.svg" width="28" align="absmiddle"> | `ki-panel-card` | KI Panel | Ett samlet panel i stedet for mange små sensorfliser: rader med minigraf, verdi og status, valgfri stor graf |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-planter-card.svg" width="28" align="absmiddle"> | `ki-planter-card` | KI Planter | Vanning av planter fra [ki-planter](https://github.com/SebastianKristo/ki-planter): finner plantene selv, `sted:` filtrerer (mode: list / tile) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-sovn-card.svg" width="28" align="absmiddle"> | `ki-sovn-card` | KI Søvn | Søvnstatus per person fra [ki-sovn](https://github.com/SebastianKristo/ki-sovn) (mode: list / tile) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-rom-card.svg" width="28" align="absmiddle"> | `ki-rom-card` | KI Rom | Auto-bygd rom-popup fra [ki-rom](https://github.com/SebastianKristo/ki-rom): genererer samme kort som i dashbordet (expander, lys, enheter, klima, media, sensorer …) fra `sensor.<rom>_oversikt`. `ki-rom-popups` lager én bubble-card pop-up per rom |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-rom-tile-card.svg" width="28" align="absmiddle"> | `ki-rom-tile-card` | KI Rom flis | Romflis til forsiden (temp/fukt, termostat-stepper, «!»-varsel) auto-konfigurert fra ki-rom, `size: big / small / row`. `kind: las / alarm / garasje / kalender / gjoremal / navigate` gir spesialflisene med entitet som config |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-hjem-card.svg" width="28" align="absmiddle"> | `ki-hjem-card` | KI Hjem | Hele simple-tabs-blokken på forsiden i ett kort: `etasjer: auto` lager én fane per HA-etasje med romflisene, `tabs:` gir Hjem-layout (grid-areas + swipe), Aktuelt, Batterier. `examples/hjem-tabs.yaml` |

### Pro-kort (samme stil som ki-energi-card / ki-klima-pro-card – hero med ring, Enkel/Avansert, blokker)

| Kort | Bruk |
|---|---|
| `ki-sovn-pro-card` | Søvn **og vekking** i ett kort: ring med antall som sover, personer som ekspanderbare rader, vekkealarm(ene) som blokker under (`vekking: false` skjuler, `vekking_prefix:` velger én) |
| `ki-vekking-pro-card` | Vekkealarm: ring med neste alarm og nedtelling, ukeplan, (Avansert) lys, person, betingelser og logg |
| `ki-planter-pro-card` | Planter: ring med antall vannet, planter som rader med fremdrift, tips, «vannet nå», (Avansert) intervall og varsling |

Eksempler: `examples/sovn-popup.yaml` (søvn + vekking), `planter-popup.yaml`, `oversikt-tiles.yaml`.

### Byggeklosser

| | Kort | Bruk |
|---|---|---|
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-toggle-card.svg" width="28" align="absmiddle"> | `ki-toggle-card` | Bryter som rad (`size: row`) eller flis (`size: tile`) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-toggle-list-card.svg" width="28" align="absmiddle"> | `ki-toggle-list-card` | Liste av `ki-toggle-card` fra filter (erstatter auto-entities) |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-tabs-card.svg" width="28" align="absmiddle"> | `ki-tabs-card` | Faner som piller, rullbar rad eller nedtrekksmeny (`style: auto` går fra piller til rullbar rad når de ikke får plass), `sticky: true
# bg: var(--gray200)   # bakgrunn bak fanelinja når den er festet (standard: gjennomsiktig med blur)` |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-section-card.svg" width="28" align="absmiddle"> | `ki-section-card` | Liten seksjonstittel |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-slider-card.svg" width="28" align="absmiddle"> | `ki-slider-card` | Etikett, slider og verdi for `input_number` / `number` |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-action-card.svg" width="28" align="absmiddle"> | `ki-action-card` | Knapp som kjører en tjeneste, med valgfri bekreftelse |
| <img src="https://raw.githubusercontent.com/SebastianKristo/ki-cards/main/brand/ki-vekking-card.svg" width="28" align="absmiddle"> | `ki-vekking-card` | Vekkealarm fra ki-sovn v2: neste alarm, ukedager med tid, lys, person, betingelser, test (mode: list / tile) |

Ikonene ligger i `brand/` som SVG og PNG (256 px).

### ki-bursdag-card
```yaml
type: custom:ki-bursdag-card
regex: birthday|bursdag   # regex mot entity_id (standard), eller entities: [...]
antall: 3                 # i Kommende
visning: tabs             # tabs | kommende | aar
icon: mdi:cake-variant
background: var(--gray200)
navn:                     # valgfri overstyring av navn per sensor
  sensor.birthday_sebastian: Sebastian
```
Leser `date`/`birthday`-attributt + `age_at_next_birthday` fra Birthdays-integrasjonen, men tåler også
sensorer der tilstanden er dager igjen eller en dato. Rad: «Navn fyller N» / «Fredag 20. september · om 9 dager».
Trykk på en rad åpner more-info.

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
style: auto               # auto | pills | scroll | dropdown
align: center
tittel: Strømpriser          # overskrift til venstre på samme linje som fanene
tittel_storrelse: 16px             # center | flex-start | flex-end (gjelder pills)
sticky: true              # fest fanelinja øverst når innholdet scroller
# bg: var(--gray200)      # bakgrunn bak festet fanelinje (standard: gjennomsiktig med blur)
# dropdown_under: 360     # fall til nedtrekk på skjermer smalere enn dette (standard: aldri)
tabs:
  - title: Automasjoner
    icon: mdi:robot       # valgfri
    cards:
      - type: custom:ki-section-card
        title: Hei
```
`style: auto` viser pillene når alle fanene får plass, og bytter ellers til **scroll**: en rullbar fanerad i
full bredde som du sveiper i, med toning og blapil i kantene og vannrett museskroll på hjul. Den valgte fanen
rulles alltid inn i midten. `style: scroll` tvinger raden, `style: dropdown` tvinger nedtrekksmenyen, og
`dropdown_under: 360` gir nedtrekk bare på svært smale skjermer.

Nedtrekksmenyen ligger i fast posisjon og plasseres etter knappen, så den ikke blir klippet av kort under
eller av foreldre med `overflow: hidden` (for eksempel bubble-card-popupene). Den vender oppover hvis det er
mer plass over knappen, får egen rulling når den er høyere enn skjermen, og lukkes ved klikk utenfor,
Escape eller når siden scrolles.

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

### ki-panel-card
Ett panel som erstatter en hel rute med små sensorfliser. Hver rad viser navn, minigraf fra historikken og
verdien til høyre; `on`/`off`-entiteter får bånd i stedet for linje. `hovedgraf` gir en stor arealgraf øverst.
```yaml
type: custom:ki-panel-card
tittel: Paritet
timer: 24                 # historikkvindu
graf: sparkline           # sparkline | ingen
kolonner: 1               # 2 = tett rutenett uten grafer
hovedgraf:
  entity: sensor.d_day_darling_parity_progress
  navn: Framdrift
  enhet: ' %'
  maks: 100
entiteter:
  - sensor.d_day_darling_parity_check_speed
  - entity: binary_sensor.d_day_darling_parity_valid
    navn: Paritet
    tekst: { 'on': Gyldig, 'off': Ugyldig }
  - entity: sensor.d_day_darling_disk_cach_errors
    navn: Feil
    varsel_over: 0
```

### ki-sensor-card
```yaml
type: custom:ki-sensor-card
entity: sensor.strommaler_effekt
navn: Forbruk nå            # undertekst (sub_text)
ikon: mdi:home-lightning-bolt
storrelse: stor             # stor (160 px) | liten (66 px)
animasjon: auto             # auto | soyler | boelge | puls | ingen
maks: 4000                  # referanse for animasjon og stolpe
enhet: W                    # standard: enheten til sensoren
desimaler: 0                # standard: 0 for W og store tall, ellers 1
alt: sensor.strompris       # høyrestilt tilleggstekst: entitet eller fri tekst
stolpe: false               # tynn framdriftsstolpe nederst
verdi: "Av"                 # overstyrer tallet helt
bakgrunn: var(--gray200)
tekstfarge: var(--gray1000)
merke_over: 3000            # rød pulsprikk over denne verdien
nivaa:                      # farge og merke ved terskler (siste treff vinner)
  - over: 3000
    farge: var(--red)
    bakgrunn: var(--gray200)
    merke: true
```
Samme geometri som `universal_sensor_ny`: ikonsirkelen øverst til venstre, undertekst, stor tynn tallverdi
nederst og enheten som liten hevet tekst. `animasjon: auto` velger søyler for W/kW/A, bølge for Wh/kWh og
total_increasing, ellers puls. Animasjonen leses av verdien: søylene hopper høyere og raskere når forbruket
stiger, bølgen står som en vannstand på `verdi / maks`, og pulsringene går raskere ved høye verdier.
Nye tall rulles inn. Trykk åpner more-info. Har egen visuell editor.

### ki-enhet-card
```yaml
type: custom:ki-enhet-card
navn: Dream Machine Pro
figur: ruter                 # ruter | switch | ap | server | boks
status: device_tracker.oslo_dream_machine_pro
status_pa: [home, on, online, running]   # verdier som betyr «oppe»
tekst_pa: Online             # valgfrie egne statustekster
tekst_av: Offline
oppetid: sensor.oslo_dream_machine_pro_oppetid
oppdatering: update.oslo_dream_machine_pro_fastvare
undertekst: Kjerne og vert   # valgfri fritekst i tillegg
maalinger:                   # opptil fire ringmålere
  - navn: CPU
    entity: sensor.oslo_dream_machine_pro_cpu_utilization
    enhet: '%'
    maks: 100
    gul: 70                  # terskler for farge
    rod: 88
info:                        # fliser med tall eller tekst
  - navn: Klienter
    entity: sensor.oslo_dream_machine_pro_klienter
    enhet: ''
  - navn: Temperatur
    entity: sensor.x
    attributt: temperature_celsius
    enhet: ' °C'
    varsel_over: 75           # flisen blir oransje over denne verdien
  - navn: Paritet
    entity: binary_sensor.x
    tekst: {off: Gyldig, on: Ugyldig}
    varsel_er: 'on'
knapper:
  - navn: Restart
    entity: button.oslo_dream_machine_pro_omstart
    ikon: mdi:restart
    farge: var(--orange)
    bekreft: Restarte Dream Machine Pro?
  - navn: LED
    entity: light.havets_24_poe_250w_led     # brytere lyser opp når de er på
    ikon: mdi:led-outline
```
`info:` vises som ett samlet panel med rader og minigraf (`info_stil: fliser` gir de gamle flisene), og
`graf: sensor.x` (eller `{entity, navn, enhet, maks, farge}`) legger en stor arealgraf øverst i panelet.
`timer: 24` styrer historikkvinduet.

Et 180 px hero i samme høyde som `ki-natt-card`: navn med pulserende statuspille, oppetid og fastvare som
undertekst, opptil fire ringmålere som fyller seg opp med fargeterskler, og en figur til høyre som lever etter
hva slags enhet det er – ruteren sender wifi-bølger og pakker som glir forbi, switchen blinker i portlysene,
aksesspunktet ringer utover, serveren blinker i diodene med vifta som går rundt, og VM/container-boksen har en
skannelinje. Er enheten nede, gråner figuren, det legges et rødt kryss over, og ringene tømmes. Under hero
ligger infofliser og knapperad. Alt er trykkbart til more-info.

### ki-wifi-card
```yaml
type: custom:ki-wifi-card
navn: Utehavet
qr: image.utehavet_qr_kode
klienter: sensor.utehavet_klienter
bryter: switch.utehavet_aktivert
```
QR-koden til høyre med et lysstrøk over, antall klienter i stor tynn skrift, bryter for SSID-en og
wifi-ringer som brer seg ut fra hjørnet så lenge nettet er på. Er det slått av, blir QR-koden grå.

### ki-porter-card
```yaml
type: custom:ki-porter-card
tittel: Porter (strømsykling)
prefiks: button.havets_24_poe_250w_port_
etterfiks: _power_cycle
antall: 24
kolonner: 6
bekreft: Strømsykle {port}?
# eller eksplisitt:
# porter: [{navn: P1, entity: switch.stue_usw_flex_mini_port_1}]
```
Porter som fliser i rutenett. `switch`-porter lyser blått med blinkende aktivitetsprikk og kan slås av og på;
`button`-porter kjører strømsykling og får et lysstrøk mens det skjer.

### ki-soppel-card
```yaml
type: custom:ki-soppel-card
entity: sensor.neste_tomming     # tilstand «2,Restavfall»
skille: ','                      # tegnet mellom dager og type
# eller to egne entiteter:
# dager: sensor.dager_til_tomming
# type: sensor.avfallstype
tekst_idag: 'Søppel tømmes<br>i dag'
path: '#soppel'
```
Samme oppsett som før – stort tall til venstre, tekst og avfallstype til høyre – men typen får en fargeprikk
etter hva som hentes (rest, mat, papp, plast, glass, hage, farlig avfall). På selve tømmedagen fargelegges
kortet, tallet puster, dunken rister og en søppelbil kjører over bunnen med eksos ut av røret.

### ki-lansering-card
```yaml
type: custom:ki-lansering-card
serier: sensor.sonarr_sonarr_upcoming_media
filmer: sensor.radarr_radarr_upcoming_media
antall: 6                  # hvor mange i lista under heroen
visning: full              # full | liste | hero
plakater: true
```
Leser «upcoming media»-sensorene fra Sonarr og Radarr. Det som kommer først vises som et hero-kort med
bakgrunnsbilde, plakat, tittel, episode og merkelapper for tidspunkt, sesong og episode – pluss rating,
spilletid og kanal. Under kommer resten som en liste med små plakater, og med begge sensorene satt får du
faner for Alle, Serier og Filmer. Trykk åpner serien eller filmen i Sonarr eller Radarr via `deep_link`.

### ki-post-card
```yaml
type: custom:ki-post-card
entity: sensor.nar_kommer_posten_posten_sensor_next
relativ: sensor.nar_kommer_posten_posten_sensor_next_relative
tekst: Post leveres
```
Stor dato til venstre og ukedagen over, slik kalenderkortene er bygget. Kortet blir lilla på selve
leveringsdagen, og da vaier flagget på postkassa.

### ki-bursdag-pro-card
```yaml
type: custom:ki-bursdag-pro-card
antall: 3
regex: birthday|bursdag    # eller entities: [...]
```
Samme form som postkortet: den neste bursdagen står stort med ukedag, navn og alder, og resten følger som
smalere rader med «om 23 dager» til høyre. På selve dagen blir kortet lilla og lyset på kaka flakker.

### ki-fremover-card
```yaml
type: custom:ki-fremover-card
tittel: Framover
dager: 21                    # hvor langt fram
maks: 25                     # hvor mange hendelser
kalendere:
  - {entity: calendar.familien, navn: Familien, farge: var(--green)}
  - {entity: calendar.helge_hus, navn: Hytta, farge: var(--blue), ikon: mdi:home-heart}
ekstra:                      # egne rader ved siden av kalenderne
  - entity: sensor.nar_kommer_posten_posten_sensor_next   # datoen leses fra state
    navn: Post
    tekst: Post leveres
    under: sensor.nar_kommer_posten_posten_sensor_next_relative
    ikon: mdi:mailbox
  - entity: sensor.bursdager      # flere rader fra en attributt-liste
    liste: bursdager              # [{navn, dato, alder}] eller [{summary, start}]
    navn: Bursdag
    ikon: mdi:cake-variant
```
Henter hendelsene rett fra kalender-API-et – samme kilde som kalendervisningen i Home Assistant – og grupperer
dem per dag med «I dag», «I morgen» og ukedag som overskrift. Hver hendelse har fargestrek fra kalenderen den
kommer fra, klokkeslett med sluttid under, sted, og en merkelapp med kalendernavnet. Er det under tre timer
til noe starter, pulserer streken og det står hvor lenge det er igjen. Med flere kalendere kommer det et
filter øverst. Listen oppdateres hvert femte minutt.

### ki-hytte-card
```yaml
type: custom:ki-hytte-card
sted: Strömstad                 # velger riktig sted når du har flere
# oversikt: sensor.ki_hyttebesok_stromstad_oversikt   # oppdages automatisk
faner: [kalender, opphold, statistikk]
```
Viser hyttebesøkene fra [KI Hyttebesøk](https://github.com/SebastianKristo/ki-hyttebesok). Øverst et
statuskort med hvem som er der nå – hytta får lys i vinduene og røyk fra pipa når noen er hjemme – og netter,
besøk og neste planlagte tur.

**Kalender** er en månedsrute der hver dag fargelegges etter hvem som var der; er flere der samtidig, deles
dagen i striper. Planlagte turer får stiplet kant, i dag er markert, og du blar mellom månedene med pilene.
**Opphold** lister planlagte turer øverst og historikken under, med navn, datoer og antall netter.
**Statistikk** viser netter per måned som stablede søyler per person, og et kort per person med netter og
besøk i år.

### ki-vanning-card
```yaml
type: custom:ki-vanning-card
# Alt er valgfritt – kortet finner OpenSprinkler-entitetene selv.
prefiks: ute_opensprinkler        # bare nødvendig med flere kontrollere
vinter: input_boolean.vinter_modus_vanning
varigheter: [5, 10, 15, 30, 60]   # minutter på hurtigknappene
skjul_ubrukte: true               # skjuler soner uten navn (S10–S16)
faner: [naa, soner, programmer, forbruk]
ki_vanning: sensor.ki_vanning_oversikt   # oppdages automatisk
hero: stor                        # stor (hagescene, 190 px) | smal (kompakt linje)
demo: false                       # true | vanner | tomt | vinter | regn – eksempeldata
```
Kortet leser oppsettet rett ut av OpenSprinkler-integrasjonen: kontrolleren, alle sonene med navn og
vanningsmetode, hvilken boks de hører til og programmene med starttid og intervall. Er
[KI Vanning](https://github.com/SebastianKristo/ki-vanning) installert, kommer forbruk, kostnad, estimat og
programplan i tillegg – uten at du lister opp en eneste entitet.

Toppkortet er en liten hage på 190 px: himmel med sol og skyer som driver, blomsterbed, gress som svaier,
og en spreder som svinger fram og tilbake og sprer dråper utover når det vannes – da mørkner jorda også.
Er det vintermodus, daler snøen og hagen står stille; er det regnpause, faller regnet i stedet. Over ligger
sonenavn, status og nedtelling, og nederst en stolpe med hvor mye som er brukt mot planlagt i dag. Trykk
stopper vanningen. `hero: smal` gir den gamle kompakte linja.

`demo: true` tegner hele kortet med eksempeldata og et DEMO-merke, så du ser hvordan det ser ut selv om
anlegget er avslått eller OpenSprinkler ikke svarer. `demo: vanner`, `tomt`, `vinter` og `regn` viser hver
sin tilstand. Ellers viser det om anlegget er klart, om
regnpausen går eller om vintermodus har stengt alt, og under ligger Stopp alt, Regn 24t, Nullstill og
vintermodus.

**Nå** viser hvor mye som er brukt i dag mot det som er planlagt, med en stolpe som glimter mens det vannes,
hva neste program er og når det går, pluss vannivå, flyt og strømtrekk. **Soner** grupperer sonene per boks
med 5/10/15/30/60 minutter og Stopp per sone. **Programmer** viser sonene i hvert program som brikker med
minutter, markerer sonen som kjører akkurat nå, teller framdriften gjennom programmet og merker programmene
som står på planen i dag – trykk slår av eller på, hold kjører programmet. **Forbruk** har i dag, uke, måned
og år, fordelingen per sone med kalibrert L/min bak hvert navn, og hageslangen som egen post. Har egen
visuell editor.

Styrer [KI Vanning](https://github.com/SebastianKristo/ki-vanning) ventilene selv, får Programmer-fanen en
knapp for å lage programmer rett i kortet: navn og klokkeslett, ukedager eller «hver N. dag» med startdato,
om sonene skal kjøre etter hverandre eller samtidig, minutter per sone, og om programmet bare skal gå i
feriemodus. Blyanten på et program åpner det samme skjemaet for endring og sletting.

Fanen **Mer** samler innstillingene: feriemodus, hvor mye lenger sonene går i ferien, vannpris og knappene for
å hente programplanen eller nullstille tellerne. Entitetene finnes automatisk via KI Vanning, så ingenting
skal skrives inn – og de ligger ikke i veien nederst i popupen.

Programmer-fanen viser hvert program som et eget kort: klokkeslett i stort, ukedagene som brikker (eller
«hver N. dag»), sonene med minutter, av/på-bryter, «Kjør nå» og blyant for redigering. Under ligger
**Kommende vanninger** – en kalender gruppert per dag med klokkeslett, program og estimat – og
**Siste kjøringer** med faktisk forbruk, antall kjøringer og snitt. Begge virker med OpenSprinkler og med
egne ventiler.

### ki-strompris-card
```yaml
type: custom:ki-strompris-card
tittel: Strømpriser
spot: sensor.totalpris_inkludert_grid_el_company_og_stromstotte   # bruker raw_today / raw_tomorrow
norgespris: sensor.norgespris_pris_na      # egen stiplet linje, flat når den mangler timedata
billig: 0.80                               # fargegrenser for kurven
dyr: 0.85
hoyde: 300
bredde_per_time: 48              # grafen kan rulles sidelengs
rull_til_naa: true               # starter ved «Nå»-streken
norgespris_farge: var(--yellow)
desimaler: 2
```
Erstatter apexcharts-kortet, de to `local-conditional-card`-ene og `paper-buttons-row`. Faneskinnen er den
samme pillen som `ki-tabs-card`, og «I morgen» er grået ut til morgendagens priser er klare. Kurven er en
trappelinje som tegnes inn, fargelagt etter prisen akkurat nå, med fylt flate under, Norgespris som stiplet
linje oppå, «Nå»-strek med pulserende punkt, og markert høyeste og laveste time. Grafen er bredere enn kortet og rulles sidelengs – den starter ved «Nå»-streken, med tonede kanter som viser
at det er mer å se, og `bredde_per_time` styrer hvor bredt døgnet blir. Under grafen står prisen nå,
Norgespris, snitt og når det er billigst og dyrest; mangler Norgespris-sensoren data, sier forklaringen fra
i stedet for at linja forsvinner stille. Har egen visuell editor.

Uten Norgespris blir kortet et rent spotpriskort: sett `norgespris: false`, så vises spotprisen i kroner som hovedtall, Norgespris-linja og spart-tallene forsvinner, og forklaringen viser snittet i stedet. Fint for hus utenfor Norgespris-ordningen – for eksempel hytta i Strömstad. `enhet:` bytter teksten bak tallet, og `tekst_spot:` overskriften over det.

Kommer timesprisene fra Nordpool i øre uten moms, mens tallet du faktisk betaler ligger i en egen sensor i
kroner med avgifter, peker du på begge:

```yaml
spot: sensor.nordpool_kwh_se3          # timespriser, øre uten moms
spot_naa: sensor.min_totalpris_kr      # det du betaler nå, i kr
kalibrer: true                         # løfter hele kurven til samme nivå (standard)
```

Kortet regner da ut forholdet mellom timesprisen akkurat nå og totalprisen din, og bruker det på hele
kurven – slik at snitt, høyest, lavest og billigste vindu er i kroner du kjenner igjen. Vil du heller regne
det ut selv, bruker du `mva: 25` og `paaslag: 0.089` (kr/kWh) i stedet. Øre oppdages automatisk fra enheten.

Bakgrunnsfargen settes med `bakgrunn:` – en CSS-farge eller en variabel fra temaet, for eksempel
`bakgrunn: var(--gray100)` eller `bakgrunn: '#101820'`. `bakgrunn_glod: false` fjerner det fargede skjæret
øverst i kortet.

På brede skjermer holdes innholdet samlet i midten i stedet for å dras ut til kantene – `maks_bredde: 620px` styrer hvor bredt det kan bli, og det store tallet krymper litt når kortet er bredt.

### ki-prosa-card
```yaml
type: custom:ki-prosa-card
storrelse: 1.4em
# Hver bit kan være: false (av), en entitets-id, eller et objekt med det du vil overstyre.
vaer:
  entity: sensor.dashboard_index
  attributt: weather              # les attributt i stedet for tilstand
  enhet: °
  mellomrom: false                # mellomrom mellom tall og enhet
  desimaler: 0
  ikon: attributt:current.icon    # auto | mdi:… | emoji | /local/… | attributt:sti
  ikon_plassering: slutt          # start | slutt
  små_bokstaver: true
  tekst: 'Ute er det {pille}.'    # {pille} er der pillen settes inn
  path: '#vaer'
pris:
  entity: sensor.norgespris_pris_na
  enhet: kr
  desimaler: 2
  tekst: 'Strømmen koster {pille}'
  path: '?tab=priser#strom'
spot: sensor.totalpris_inkludert_grid_el_company_og_stromstotte   # fargeprikk etter hvor dyr timen er
effekt:
  entity: sensor.strommaler_effekt
  enhet: W
  mellomrom: false                # gir «3 860W»
  tekst: 'og vi bruker {pille}'
lys:
  entity: auto                    # auto teller lysene som står på
  ikon: 💡
  tekst: 'med {pille} på'
lys_ekskluder: ['light.wled_*']
kalender: {entity: sensor.alle_kalendere, ikon: ⏰, tekst: 'Vi har {pille} i dag.'}
ringeklokke: {entity: input_boolean.ki_ringeklokke_varsel_aktiv, tekst: '{pille} Noen ringer på døren!'}
laser: {entity: auto, natt: [23, 6], tekst: 'Lås alle dørene {pille}'}
planter:
  entity: sensor.planter_trenger_vann    # eller auto for ki_planter-integrasjonen
  attributt: trenger_vann_tekst
  tekst: '{pille} trenger vann.'
bursdag:
  vis: binary_sensor.vis_bursdagskort
  skjult: input_boolean.bursdagskort_skjult
  navn: sensor.dagens_bursdager
  tekst: 'I dag har {pille} bursdag! 🎉'
apparater:
  - navn: Oppvaskmaskinen
    aktiv: {entity: input_select.oppvaskmaskin_status, state: Vasker}   # state | over | under
    # `vis:` betyr det samme som `aktiv:` og kan brukes om hverandre
    verdi: sensor.oppvaskmaskin_power
    enhet: W
    mellomrom: false
    ikon: 🍽️
    animasjon: snurr
    tekst: '{navn} vasker {pille} nå.'
    path: '#kjokken'
hjemkomst:
  - navn: Mamma
    aktiv: input_boolean.ki_cybele_pa_vei_hjem_fra_jobb
    reisetid: sensor.cybele_reisetid_fra_job     # minutter, legges til klokka nå
    tekst: '{navn} kommer hjem ca. kl {pille}.'
profil: oslo                      # innebygde profiler: oslo, stromstad, toten
profil_entity: input_select.hus   # eller la en input_select bestemme hvilken
profiler:                         # egne profiler, eller overstyr de innebygde
  stromstad:
    pris: {entity: sensor.min_elpris}
setninger:                        # egne setninger (gammelt navn: ekstra)
  - vis: "states['sensor.soppel'].state == '0'"   # JS-uttrykk med states/hass
    tekst: 'Søppel tømmes {pille}'
    pille: {mal: 'i dag', ikon: 🗑️, path: '#soppel'}
  - nar: {entity: sensor.strommaler_effekt, over: 3000}   # enklere betingelse
    tekst: 'Høyt forbruk: {pille}'
    pille:
      entity: sensor.strommaler_effekt
      enhet: W
      mellomrom: false
      stil: varsel                # vanlig | varsel | gradient | glans
      animasjon: ingen            # ingen | snurr | hopp | vink
      tjeneste: script.spar_strom # trykk
      data: {}
      hold: script.vis_detaljer   # langt trykk (ellers more-info)
```
Forsideteksten satt sammen av det som faktisk skjer i huset: temperatur ute, strømpris med fargeprikk etter
hvor dyr timen er, forbruk nå, lys som står på, dagens avtaler, apparater som kjører, noen på vei hjem,
planter som trenger vann, bursdager, ringeklokka og låser som står åpne om natta. Setningene kommer og går
etter tilstanden, med en myk animasjon når en ny dukker opp – tall som endrer seg gir ingen ny animasjon,
bare setninger som faktisk kommer eller forsvinner.

Alt er konfigurerbart: hver bit tar enten en entitets-id, `false` for å skru den av, eller et objekt der du
bytter tekst, ikon, enhet, desimaler, mellomrom og hva trykket skal gjøre. Mangler en bit, faller setningen
naturlig sammen – står bare forbruket igjen, skriver kortet «Vi bruker 3 860W.» I `setninger:` lager du egne
setninger med betingelse (`vis:` som JS-uttrykk eller `nar:` med entitet og terskel) og en pille som har de
samme mulighetene som de innebygde. Pillen kan hente verdien fra tilstand, attributt eller en `mal:` med
`{sensor.x}`-plassholdere, og vise emoji, mdi-ikon eller et bilde (for eksempel værikonene i `/local/`).
Trykk på en pille navigerer eller kjører tjenesten, langt trykk åpner more-info eller `hold:`-tjenesten.
Strømprisen får grønn, gul eller rød prikk etter `billig` og `dyr` – med Norgespris er grensene 0,80 og
0,85 kr som standard, og `ord: true` skriver «(billig)» eller «(dyrt)» rett i pillen. Har du satt `spot:` og
fjernet grensene, farges prikken i stedet etter hvor dyr timen er i forhold til resten av døgnet. Lysikonet
bytter etter hvor mange lys som står på – måne når alt er slukket, lyspære, sterkere pære og stjerner når
huset lyser – og trinnene settes i `ikon_trinn` med emoji, mdi-ikoner eller bilder. Tall formateres med
`desimaler`, `mellomrom` (før enheten) og `tusenskille`, og effekt og apparater står uten tusenskille så det
blir «3860W». Hver bit har `path` for popupen trykket skal åpne – været peker som standard på `#weather`.
Kortet har tre ferdige profiler: **oslo**, **stromstad** og **toten**. Oslo peker på de faktiske entitetene
i huset; de to andre finner sine selv ut fra profilens nøkkelord, enhet og enhetsklasse – værentiteten som
heter noe med stedet, prissensoren i kr/kWh, effektsensoren i watt, og lysene som hører til stedet. Det du
selv skriver i kortet vinner alltid over profilen, så én linje holder for å bytte en sensor. Egne profiler
legges til under `profiler:` med samme nøkler.

`profil: stromstad` velger fast, `profil_entity:` lar en `input_select` bestemme, og kortet bygger seg om
når verdien endrer seg.

Hele kortet kan skjules av en bryter eller en tilstand:

```yaml
vis: switch.gjestemodus                          # vises bare når denne er på
vis: {entity: input_select.hus, state: Oslo}     # eller ved en bestemt tilstand
```

Den visuelle editoren er delt i seksjoner du folder ut én om gangen, med en kort oppsummering i
overskriften – hvilken entitet biten bruker, hvor mange rader en liste har, eller «av». Du velger profil
øverst (og kan skru på «rediger denne profilen»
for at endringene skal lagres i profilen i stedet for i kortet), setter entitet, ikon, enhet, desimaler,
setning og trykkmål for hver bit, og skrur biter av og på. Apparater, På vei hjem og Egne setninger er
lister med «Legg til» og «Fjern», der hver rad har entitetsvelger for når den skal vises, hvilken verdi
pillen skal hente, ikonvelger og setningstekst. Felt du lar stå tomme arver fra profilen.

Ikonfeltet godtar også tre små tegninger som lever: `ki:vaskemaskin`, `ki:oppvask` og `ki:torketrommel`.
Maskinen rister forsiktig, trommelen er blå fordi det står vann i den, bølgen vugger og skummet stiger.
`animasjon: ingen` lar tegningen stå stille.

### ki-media-card
```yaml
type: custom:ki-media-card
media: media_player.squeezebox_radio   # eller en liste; da velges den som spiller
visning: full                   # full (alt) | stor (180 px med omslag) | naa (bare topplinja)
navn: Sonos
ikon: mdi:speaker               # vises når det ikke finnes omslag
radio:                          # vannrett rad med kanaler
  - navn: NRK P1
    skript: script.nrk_p1
    ikon: mdi:radio
  - navn: Plex
    kilde: plex                 # eller select_source i stedet for skript
kontroll:                       # egne skript i stedet for media_player-tjenestene
  play_pause: script.sonos_nede_play_pause
  neste: script.sonos_nede_next
  forrige: script.sonos_previous
  shuffle: script.sonos_nede_shuffle
  repeat: script.sonos_nede_repeat
grupper:
  - navn: Oppe
    entity: input_boolean.sonos_group_oppe
i_dag: sensor.tv_seertid_i_dag          # seertid som pille under omslaget i stor visning
maned: sensor.tv_seertid_denne_maned
tid:                                    # eller egne sensorer per spiller
  media_player.stue_tv:
    i_dag: sensor.tv_seertid_i_dag
    maned: sensor.tv_seertid_denne_maned
```
Topplinja er den samme 66 px-pillen som før, men omslaget ligger som bakgrunn i uskarp, langsom
ken-burns-bevegelse, og kortets farge hentes fra omslaget (dominerende farge samples på et lerret, med lys
eller mørk tekst etter lysstyrken). Omslaget roterer sakte mens noe spilles, en utjevner animeres ved
avspilling og står stille ved pause, lange titler ruller forbi, og framdriften tikker hvert sekund ut fra
`media_position` og `media_position_updated_at`. `visning: naa` gir bare denne linja – fin å legge over
et fanesett. `visning: stor` gir et 180 px hero i samme høyde som `ki-natt-card`: omslaget som avrundet
flis til høyre med langsom svevebevegelse, et glans-sveip over coveret, pulserende ringer bak, kildepille
med spillernavn og kanal eller app, stor tittel som ruller, artist eller episode, framdrift med tider der
varigheten er kjent og en levende bølgerad når det er radio, pluss play/pause og neste direkte i kortet. Under omslaget kan seertiden ligge som én samlet pille –
timer og minutter i dag, og måneden som dempet tillegg – med en svak puls mens det spilles. Med `tid:`
følger tallene den aktive spilleren, så TV-seertiden vises når TV-en går.
Oppgir du flere spillere i `media`, velger kortet den som spiller (så TV-en tar over når du ser film, og
Sonos når musikken går). Full visning legger til kanalrad (den kanalen som går er markert med bølger), transport der
play-knappen pulserer under avspilling og shuffle/repeat følger tilstanden, samt volumslider med
gruppeknapper.

`fane_media` lar ett kort følge fanevalget i `ki-tabs-card`: TV-fanen viser Apple TV, Musikk-fanen viser
Sonos. Da trenger ikke fanene hvert sitt hero-kort.

```yaml
type: custom:ki-media-card
visning: stor
fane_media:
  Tv: media_player.stue_tv
  Musikk: media_player.squeezebox_radio
```

`visning: kontroll` gir kanaler, transport, volum og grupper uten topplinja – fint under et slikt hero-kort.
Uten `kontroll:`-blokken brukes de vanlige `media_player`-tjenestene, og grupper med `spiller:` i stedet for
`entity:` knytter spillerne sammen med `media_player.join` og `unjoin`.

Har du flere TV-er eller radioer, lister du dem i `velger:` – eller som en liste under hver fane i
`fane_media:`. I `visning: stor` sveiper du mellom dem, med prikker under som viser hvor du er; trykk på en
prikk går rett dit. `sveip: false` gir en pillerad i stedet. I de andre visningene er det alltid pillerad,
og spillere som ikke finnes vises gjennomstreket så feil entitets-id er lett å se.

```yaml
velger:
  - {navn: Sonos, entity: media_player.squeezebox_radio, ikon: mdi:speaker}
  - {navn: Kjøkken, entity: media_player.radio_kjokken, ikon: mdi:radio}
```

`spillknapp: av_pa` bytter midtknappen i transportraden fra play/pause til av/på – standard i
`visning: kontroll`. Volumraden har demp, ned, slider og opp med prosenten til høyre. Radiokanaler kan peke
på `skript:` eller `entity:` – knapp, bryter, scene eller script virker, og en ren streng spilles som
`media_content_id`.

### ki-fjernkontroll-card
```yaml
type: custom:ki-fjernkontroll-card
media: media_player.stue_tv
fjernkontroll: remote.stue_tv
navn: Apple TV
ikon: mdi:apple
i_dag: sensor.tv_seertid_i_dag        # timer som desimaltall
maned: sensor.tv_seertid_denne_maned
maks_i_dag: 6                         # full stolpe
maks_maned: 90
kilder: [Plex, NRK TV, Telia Play]    # eller [{navn: Plex, kilde: plex}]
vis_media: stor                       # stor | naa | ingen – ki-media-card øverst i kortet
vis_status: false                     # statuspillen (skjules automatisk når vis_media er satt)
vis_seertid: false                    # seertidboksene (skjules når vis_media: stor viser pillen)
apper_liste:                          # app-fliser under fjernkontrollen
  - navn: Netflix
    kilde: Netflix                    # select_source; eller skript: / kommando:
    app_id: com.netflix.Netflix       # markerer flisen som åpen
    farge: '#e50914'
    ikon: mdi:movie-open
apper:                                # legges til den innebygde app-id-lista
  com.min.app: Mitt navn
```
Statuslinja er den samme pillen som før – lilla når spilleren er på, rød når den er av – men appnavnet slås
opp fra en innebygd liste over Apple TV-app-id-er (Netflix, Apple TV+, HBO Max, Disney+, NRK, TV 2 Play,
Telia Play, Viaplay, Prime Video, Plex, Spotify, YouTube), og en liten utjevner animeres mens noe spilles og
står stille ved pause. Seertid i dag og denne måneden vises som `tt:mm:ss` med en stolpe mot `maks_*`.

I stedet for piltastene er navigeringen en rund styreflate som Apple TV-fjernkontrollen: sveip for retning
(lang sveip gir flere steg), trykk for velg, med ringpuls der du trykker og pilene som lyser opp i retningen
du drar. Piltaster og Enter virker også. Under ligger tilbake, hjem, Siri og en play/pause-knapp som følger
tilstanden, en volumrad der minus og pluss gjentar når du holder inne, og kildene som fliser der den aktive
er markert, og app-flisene ligger som en vannrett rad med merkefarge, der appen som er åpen får ring og
prikk. Seertiden vises bare når `i_dag` eller `maned` er satt. Med `vis_media: stor` legges `ki-media-card`
i stor visning øverst i kortet med samme spiller og seertid, og da skjules statuspillen og seertidboksene
automatisk – `vis_status` og `vis_seertid` overstyrer hvis du vil ha begge. Slik bestemmer du selv om
mediakortet står over fjernkontrollen eller over fanene. Har egen visuell editor.

### ki-vaer-card
```yaml
type: custom:ki-vaer-card
naa: sensor.weather_forecast_v2   # sensor med attributtet current (temperature, feels_like, condition, wind_desc, precipitation)
vaer: weather.forecast_home       # prognoser og uv_index
sol: sun.sun
maane: sensor.oslo_moon_phase
visning: alle                     # alle | naa | himmel | timer | dager
timer: 24
dager: 6
hopp_forste: false
tittel: Været nå
```
Fire faner i ett kort. **Nå** har samme oppsett som `universal_sensor_ny`-væreflisen – stor tynn temperatur med
følt temperatur, tilstand, vind og nedbør – men den statiske met-ikonet er byttet ut med en levende himmel som
leses av tilstandsteksten: sola pulserer med roterende stråler, skyer drifter, regndråper faller (tettere ved
kraftig regn), snøfnugg daler og svinger, lynet blinker ved torden, tåkebanker glir forbi og vindkast stryker
over. Etter solnedgang bytter scenen til måne og blinkende stjerner.
**Sol og måne** viser en bue der sola står på dagens posisjon mellom oppgang og nedgang, månefasen tegnet som
faktisk opplyst del, og UV-indeks med farge og markør. **Timer** og **Dager** henter prognosene via
`weather/subscribe_forecast` (faller tilbake på `forecast`-attributtet) og tegner temperaturkurven inn med
nedbørstolper, og døgnlista som min–maks-spenn. Har egen visuell editor.

### ki-natt-card
```yaml
type: custom:ki-natt-card
natt: switch.nattmodus          # påkrevd
helg: input_boolean.innendors_privace_mode   # valgfri andre flis: privatmodus eller helgemodus
vekking: sensor.neste_vekking   # valgfri: tidsstempel eller «07:00»
navn_natt: Nattmodus
navn_helg: Privatmodus          # standard: Privatmodus når entiteten ser ut som privatmodus, ellers Helgemodus
ikon_natt: mdi:sleep
ikon_helg: mdi:cctv-off         # standard: mdi:cctv-off for privatmodus, mdi:airplane-takeoff for helgemodus
privat: true                    # overstyr gjenkjenningen
tekst_privat: Kameraene er av
tekst_natt: God natt
tekst_morgen: God morgen
morgen: true                    # slå av med false
morgen_fra: '05:00'
morgen_til: '12:00'
tekst_pa: På
tekst_av: Av
```
Når nattmodus er av vises en liten nattflis (huset med lys i vinduene, måne og stjerner) ved siden av
helgemodus-flisen. Når den slås på vokser nattkortet ut av den lille flisen og dekker begge:
vinduene slukkes ett etter ett, månen stiger, huset puster og det kommer Z-er fra loftsvinduet.
Fra `morgen_fra` til `morgen_til` bytter kortet til morgenutgaven mens nattmodus fortsatt er på: soloppgang
i stedet for måne, vinduene tennes ett etter ett, fugler i stedet for Z-er, og teksten blir «God morgen».
Kortet sjekker klokka hvert minutt og bytter av seg selv.

Den andre flisen kjenner igjen privatmodus for innendørskameraene på entitets-id-en eller navnet
(`privac`, `privat`, `kamera`, `camera`) og får da sin egen animasjon: når modusen er av panorerer
kameraet sakte, linsa lyser blått, lyskjeglen pulserer og opptaksprikken blinker rødt. Når den slås på
faller lokket over linsa, øyet lukkes, en hengelås kommer til syne med teksten «Kameraene er av», og
flisen blir rolig grønn. Er det fortsatt helgemodus du bruker, oppfører flisen seg som før – sett
`privat: false` hvis navnet forvirrer gjenkjenningen.
Trykk på nattkortet slår av nattmodus igjen, og kortet trekker seg tilbake til den lille flisen. Har egen visuell editor.

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

Hele Server-popupen ligger ferdig omskrevet i [`examples/server-popup.yaml`](examples/server-popup.yaml).

Et komplett eksempel på Innstillinger-popupen ligger i [`examples/innstillinger-popup.yaml`](examples/innstillinger-popup.yaml).

## ki-rom-card / ki-rom-popups

Bygger innholdet i en rom-popup automatisk fra `sensor.<rom>_oversikt` (ki-rom ≥ 1.1.0). Kortet lager **ikke** noe nytt design – det genererer nøyaktig samme konfig som rom-popupene i dashbordet (expander-card, layout-card, button-card med `universal_action`/`universal_sensor`/`sensor_small`-malene, my-slider-v2, mysmart-light-control, paper-buttons-row, mini-graph-card) og rendrer dem via HA sine card-helpers.

```yaml
type: custom:ki-rom-card
rom: stue                  # area_id – eller [stue, kjokken]: hver seksjon får enhetene fra begge rom
seksjoner:                 # alle på som standard, seksjoner uten entiteter faller bort selv
  header: true
  gardiner: true
  scener: true             # skript/scener med rommet som område
  lys: true
  enheter: true            # brytere + vifter (+ effekt fra samme enhet)
  klima: true              # input_number.<klima>_teller brukes hvis den finnes
  media: false
  sensorer: true
temperatur: sensor.x       # valgfri overstyring (ellers første temp-sensor i rommet)
fuktighet: sensor.x
gap: 8                     # px mellom kortene
scener_ekstra:             # skript/scener i tillegg til de som har rommet som område
  - script.stue_lys_mer_lys
  - scene.stue_nede_alt_av
skjul:                     # enheter som ikke skal vises i kortet
  - light.kjokken_spot_1
```

Kortet har UI-editor: legg til «KI Rom» i en popup, velg rom i nedtrekkslisten og huk av seksjonene. Egen popup per rom som før – `examples/rom-popup.yaml`.

`ki-rom-popups` lager én bubble-card pop-up per rom (`#<area_id>`) med farge per rom og per-rom-overstyring – ett kort erstatter alle rom-popupene. Se `examples/alle-rom-popups.yaml` og `examples/rom-popup.yaml`.

Summen i «Enheter» teller hver effektsensor bare én gang, selv om den både er paret med en bryter og
ligger i `effekt_andre` fra integrasjonen.

Viser en stikkontakt 0 W selv om den har en effektsensor, er den ikke paret riktig i integrasjonen. Kortet
leter da selv etter en sensor med samme navn og `device_class: power` – `switch.fryseskap` finner
`sensor.fryseskap_power` – og hopper over sensorer som egentlig måler energi (kWh). Stemmer det fortsatt
ikke, settes paret i kortet:

```yaml
type: custom:ki-rom-card
rom: vaskegang
effekt_par:
  switch.fryseskap: sensor.fryseskap_power
  switch.noe_annet: false      # false fjerner effektvisningen for den bryteren
```

Flere klimaenheter vises som en swipe med prikker under, én side per enhet – samme oppsett som spillerne i
Media. `klima_layout: liste` stabler dem i stedet, og `klima_hoyde` styrer høyden.

Panelovner og andre varmekilder som ikke ligger i klima-lista fra integrasjonen, tas med slik:

```yaml
type: custom:ki-rom-card
rom: stue
klima_ekstra:
  - climate.panelovn_stue                                   # egen termostat
  - {entity: switch.panelovn_gang, effekt: sensor.panelovn_gang_power}   # ovn på smartplugg
```

De havner i samme swipe som varmepumpa, watt-summen i overskriften tar dem med, og de fjernes fra
«Enheter» så de ikke står to steder. Uten `effekt:` leter kortet selv etter `sensor.<navn>_power`.

## ki-rom-tile-card

Flisene på forsiden (Stue, Kjøkken, Gang, Pult … med temperatur, fukt, termostat-stepper og «!»-varsel) generert fra `sensor.<rom>_oversikt` – samme button-card-konfig som før.

```yaml
type: custom:ki-rom-tile-card
rom: stue
size: big            # big (246 px, termostat fra første klima / input_number.<klima>_teller) | small (142 px) | row (66 px pille)
farge: var(--green)  # ikon-sirkel
ikon: mdi:sofa       # standard: rommets ikon i HA
path: '#stue'        # standard: '#<area_id>'
varsel: binary_sensor.inngangsdor   # standard: første dør/vindu i rommet
```

Spesialfliser med entitet som config: `kind: las` (lock), `kind: alarm` (select/alarm + `script:` for knappen), `kind: garasje` (cover), `kind: kalender` (sensor med events), `kind: gjoremal` (teller-sensor), `kind: navigate` (ikon/tekst/path). Alle har UI-editor. Hjem-fanen ferdig omskrevet: `examples/hjem-fliser.yaml`.

## ki-hjem-card

Ett kort for hele fane-blokken på forsiden. Faner kan være automatiske (`etasjer: auto` → én fane per etasje i HA, rommene i to kolonner) eller eksplisitte:

```yaml
type: custom:ki-hjem-card
etasjer: auto
rom:                                   # per-rom-innstillinger (farge, ikon, size, path, varsel, navn)
  inngang: { size: small, path: '#gang', farge: var(--yellow) }
tabs:
  - title: Hjem
    layout: { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)), grid-template-areas: "\"stue kjokken\" \"stue stov\"" }
    omrader:
      stue:
        - swipe: { type: plain, cards: [ { kind: las, entity: lock.x }, { kind: garasje, entity: cover.x } ] }
        - swipe: { height: 266px, cards: [ { rom: stue }, { rom: inngang }, { kind: kalender, entity: sensor.k } ] }
        - { kind: alarm, entity: select.x, script: script.x }
  - title: Aktuelt
    cards: [ ...vanlige kort... ]
```

Listeelementer: `{rom: x}` / `{kind: …}` = `ki-rom-tile-card`, `{swipe: {…}}` = css-swipe-card (`type: plain` = swipe-card), alt med `type:` = kortet som det er. Krever ki-rom ≥ 1.2.0 for etasjer.

Rom kan ligge i en annen fane enn etasjen de hører til i Home Assistant. Sett `etasje:` på rommet for å
flytte ett rom, eller `flytt_til:` på etasjen for å slå hele etasjen sammen med en annen:

```yaml
rom:
  garasje: {etasje: ute}          # garasjen vises under Ute-fanen
etasje_innstillinger:
  garasje: {flytt_til: ute}       # hele garasjeetasjen legges i Ute, og fanen forsvinner
```

Flytter du alle rommene ut av en etasje, faller fanen bort av seg selv. Plasseringsverktøyet i editoren
følger den samme inndelingen.

Aktuelt-fanen kan ha kort som bare vises i en periode av året – jul, vanningssesong, brøyting:

```yaml
aktuelt:
  tv: media_player.stue_tv
  sesong:
    - fra: '11-01'          # 1. november
      til: '03-01'          # til 1. mars – perioden kan gå over nyttår
      kind: navigate
      ikon: mdi:pine-tree
      main_text: Jul
      sub_text: Lys og kalender
      path: '#jul'
    - fra: '05-01'
      til: '09-15'
      kind: navigate
      ikon: mdi:sprinkler
      main_text: Vanning
      path: '#vanning'
```

Datoene er `MM-DD`, og går perioden over nyttår, forstår kortet det. Vil du ha en ekstra betingelse, legger du
til `entity:` og `vis_nar:` – da må entiteten i tillegg ha den tilstanden. Kortet tar med dagens dato i sin egen
signatur, så kortene dukker opp og forsvinner ved midnatt uten at du må laste dashbordet på nytt.

## Feilsøking

Vises «Custom element doesn't exist: ki-…-card» for flere kort samtidig, er som regel hele bundelen stoppet:

1. Åpne konsollen og se etter linja `KI-CARDS v…` – står det feil versjon, er det en gammel fil i cache.
   Bytt versjonsnummeret bakerst i ressursen (Innstillinger → Dashbord → Ressurser) og last på nytt.
2. Sjekk at det ikke ligger egne ressurser for enkeltkort i `/config/www/` i tillegg – to definisjoner av
   samme element gjør at det er tilfeldig hvilken som vinner.
3. Fila laster ikke fra et eksternt CDN. Kort som bruker LitElement henter den fra Home Assistant selv,
   så bundelen virker også uten internett.

## Utvikling

Kildekoden ligger i `src/` (de nye kortene, ett per fil) og `src/cards/` (ki-kortene, uendret).
`./build.sh` setter alt sammen til `dist/ki-cards.js` som ES-modul og kjører `node --check`.
Nye kort: legg fila i `src/cards/`, lag et ikon i `brand/`, bygg, bump versjon. Bump `SK.VERSION` i `src/00-sk-base.js` før du bygger, så cache-bustes ressursen
riktig i HACS.

`ki-klima-pro-card` finnes også i [ki-strom](https://github.com/SebastianKristo/ki-strom); den nyeste av de to bør vinne –
oppdater `src/cards/ki-klima-pro-card.js` herfra når ki-strom får ny kortversjon.

## v2.0.0
- `ki-tabs-card`: `style: auto|pills|scroll|dropdown`, `sticky: true`, `bg`, `align`, `gap`, `dropdown_under`.
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

## v2.3.0
- `ki-planter-pro-card` / `ki-planter-card`: sommer- og vinterintervall (ki-planter 1.1.0), jordfuktighet fra sensor med «tørr jord»-status, terskel og auto-registrering i Avansert.

## v2.4.0
- `ki-sovn-pro-card` viser vekkealarmen(e) i samme kort (blokker under personene); `vekking-popup.yaml` er slått sammen med `sovn-popup.yaml`.
- `sted:` i planter-kortene matcher del av stedsnavnet, uavhengig av store/små bokstaver.

## v2.5.0
- Nye steppere (−/+ og dra i sporet) erstatter slidere i pro-kortene, med undertekst og markør for nåverdi.
- `ki-sovn-pro-card`: graf per person (sannsynlighet siste 24 t, soveperioder som bånd, terskel) og «Siste 24 timer»-tidslinje for husstanden. `hours:` endrer vindu, `graf: false` skrur av.
- Animasjon: sovende personer «puster» med z-z-z, «sovner …» blinker, ringen puster når noen sover. Respekterer prefers-reduced-motion.

## v2.6.0
- `ki-planter-pro-card`: tre sesonger (vekst / høysommer / vinterhvile) fra ki-planter 1.2.0, daglengde vises i blokk-overskriften.

## v2.7.0
- `ki-planter-pro-card` (Avansert → Varsling): «Testvisning»-bryter og «Send testvarsel»-knapp fra ki-planter 1.3.0; «test»-merke i hero når testvisning er på.

## v2.8.0
- `ki-planter-pro-card` (Avansert → Varsling): én bryter per varsel-enhet fra ki-planter 1.4.0.

## v2.10.0
- Nye `ki-rom-card` og `ki-rom-popups`: auto-bygd rom-popup fra ki-rom 1.1.0 (`sensor.<rom>_oversikt`), samme kort/utseende som rom-popupene i dashbordet, seksjoner kan slås av per rom.

## v2.11.0
- `ki-rom-card`: UI-editor (velg rom, seksjoner, sensorer), `gap:` mellom kortene (8 px standard).

## v2.12.0
- `ki-rom-card`: Sensorer bruker samme kort som Enheter (`universal_action`, én kolonne), seksjonsbrytere fikset (editor bruker grid-felt, `seksjoner:` godtar også liste / toppnivå `media: false`), `scener_ekstra:` + velger i editoren for å legge til skript/scener som ikke har rommet som område.

## v2.13.0
- `ki-rom-card`: nytt mediakort (pille med uskarpt albumbilde, artist – tittel, av/på, forrige, play/pause, neste, «…» = more-info, volum), flere rom i ett kort (`rom: [stue, kjokken]` – én header per rom, resten slås sammen), seksjonsbryterne i editoren fikset for godt (flate felt – HA nestet grid/expandable-verdier).

## v2.14.0
- `ki-rom-card`: `skjul:` (velger i editoren, begrenset til enhetene i rommet) fjerner enheter fra kortet; flere rom gir nå én felles header.

## v2.14.1
- `ki-rom-card`: rom uten temperatur-/fuktsensor bruker `sensor.hus_temperature` / `sensor.hus_fuktighet` (endres med `reserve_temperatur:` / `reserve_fuktighet:`).

## v2.15.0
- Ny `ki-rom-tile-card`: romfliser til forsiden auto-konfigurert fra ki-rom (big/small/row) + spesialfliser lås/alarm/garasje/kalender/gjøremål/naviger med entitet som config. `examples/hjem-fliser.yaml`.

## v2.16.0
- Ny `ki-hjem-card`: hele simple-tabs-blokken (Hjem/etasjer/Aktuelt/Batterier) fra ett kort, `etasjer: auto` fra HA-etasjer (ki-rom 1.2.0). `examples/hjem-tabs.yaml`.

## v2.16.1
- `ki-hjem-card`: fane-stilen satt med simple-tabs sine egne farger (card_mod tok ikke via card-helpers), Hjem-fanen lages automatisk som standard (`hjem:` med lås/garasje/alarm/kalender/stov), flismønster per kolonne (`monster:`, standard venstre big/small, høyre row/big/row) + `kolonne:`/`rekkefolge:` per rom.

## v2.17.0
- `ki-hjem-card`: UI-editor – Hjem-fanen (lås/garasje/alarm/kalender, rom i venstre/høyre swipe), etasjer (vis/skjul, rekkefølge, fanenavn) og per rom (vis/skjul, størrelse stor m/klimaknapp · stor uten · medium · liten, plassering venstre/høyre, rekkefølge, farge, popup-hash). Fane-stilen legges inn i simple-tabs direkte (én rund ramme som før).
- `ki-rom-tile-card`: `size: big_plain` (stor uten klimaknapp).

## v2.17.1
- `ki-hjem-card`: unik `cardId` per css-swipe (rom-swipen forsvant når alle delte `swipe_dashboard1`); `ki-rom-tile-card` har fast minimumshøyde så swipe-kortet måler riktig før flisen er bygget.

## v2.17.2
- `ki-hjem-card`: `hjem.swipe_type: plain` bruker swipe-card (med pagination) for rom-swipene når css-swipe-card ikke vil vise kalender-flisen.

## v2.17.3
- `ki-hjem-card`: swipe-card-prikkene legges under kortet i css-swipe-stil (grå, 8 px).

## v2.17.4
- `ki-hjem-card`: spesialfliser (kalender, lås, alarm, garasje, gjøremål, naviger) legges inn som ferdig button-card-konfig i stedet for via ki-rom-tile-card – css-swipe-card virker igjen med kalender i rom-swipen (`swipe_type: plain` kan fjernes).

## v2.17.5
- `ki-rom-card` / `ki-rom-tile-card` / `ki-hjem-card`: tåler at css-swipe-card setter `hass = undefined` på barnekortene (kalender-flisen fikk hele rom-swipen til å forsvinne).

## v2.18.0
- Ytelse (Android): romkortene sammenligner state-objekter på referanse i stedet for å JSON-serialisere attributter ved hver hass-oppdatering; `ki-rom-card` bygger innholdet først når popupen er synlig og sender ikke hass til skjulte popups.

## v2.18.1
- Ytelse: oppslag rom → `sensor.<rom>_oversikt` huskes, og listen over oversikt-sensorer skannes maks hvert 30. sekund (før: full gjennomgang av alle HA-tilstander ved hver oppdatering, per kort). Rom uten etasje havner i fanen «Rom».

## v2.18.2
- Ytelse: rom-popups forhåndsbygges én om gangen i ledig tid (klar ved åpning), hass-oppdateringer samles til én per animasjonsramme i `ki-rom-card` og `ki-hjem-card`, og swipe-card-stil injiseres bare når `swipe_type: plain` brukes (før: shadow-DOM-gjennomgang hvert 300 ms i 9 s).

## v2.18.3
- `ki-rom-card`: bygges alltid (i ledig tid når popupen er skjult), synlighet styrer bare hass-videresending; sikkerhetsnett som bygger kortet hvis det står tomt.

## v2.19.0
- `ki-rom-card`: flere mediaspillere vises som én side per spiller i en swipe (`media_layout: liste` for det gamle), `rom: alle` + `ekskluder_rom:` (velg bort i stedet for å velge), og editoren lister enhetene i kortet med av/på-brytere (skrudd av → `skjul:`).

## v2.19.1
- `ki-rom-card`: nytt mediakort – 160 px-kort i klima-kortenes stil (navn, «artist – tittel», albumbilde i sirkelen, av/på · forrige · play/pause · neste · … nederst, grønt når det spiller) + volum. «…»-knappen viste entitetsnavnet – fikset.

## v2.20.0
- `ki-hjem-card`: innebygde faner `aktuelt:` (TV, støvsuger, vaskemaskin, oppvaskmaskin – samme kort som før) og `batterier:` (auto-entities, vises bare ved lavt batteri), også i editoren.

## v2.20.1
- `ki-hjem-card`: eget navn per rom (`navn: Cybele<br>Soverom`, også i editoren) og plasserings-UI i editoren – to kolonner per etasje, flytt rom med ▲▼ og ◀▶ (skriver `kolonne`/`rekkefolge`).

## v2.47.0
- `ki-basseng-card` 1.2.0: ingen faner - en flyt med utvidbare seksjoner, knappefliser i button-card-stil, `<select>` for tallvalg, grafer fra HA-historikken.
- `ki-rom-card` 1.7.0: flere klimaenheter i rommet vises som en side per enhet i en swipe under Klima (`klima_layout: liste` for gammel visning).

## v2.50.0
- `ki-strompris-card` 2.0.0: spotpris time for time med Norgespris som stiplet linje, billigste vindu, spart i dag/i aar og forbruk naa.

## v2.52.0
- `ki-strompris-card` 2.1.0: I dag / I morgen bruker samme fanepiller som ki-tabs-card og ki-hjem-card (rund ramme, aktiv fane i --active-big).

## v2.53.0
- `ki-strompris-card` 2.4.0: tittel og faner ligger over kortflaten, fanepiller som ki-tabs-card, I morgen leser ogsaa `tomorrow` / `prices_tomorrow` og kan alltid trykkes, ingen ny opptegning ved scrolling (beroering leser av grafen forst ved sidelengs draging), sveipeanimasjon bare foerste gang, effektmaaleren bytter bare tallet, ingenting stikker utenfor skjermbredden, og blokkene under grafen kan slaas av med `vis_stat`, `vis_vindu`, `vis_spart` og `vis_forklaring`.

## v2.54.0
- `ki-strompris-card` 2.5.0: faerre klokkeslett paa den vannrette aksen naar kortet er smalt, og Norgespris kan regnes ut time for time fra nettleiesatsene (`nettleie_dag`, `nettleie_natt`, `dagtimer_fra/til`, valgfri `norgespris_energi`). Da tegnes Norgespris som trapp i stedet for flat strek, og I morgen-fanen viser prisen selv foer spotprisen er klar.

## v2.55.0
- `ki-strompris-card` 2.5.1: retter at kortet ikke ble tegnet i det hele tatt (tilordning til en `const` da Norgespris-kurven kom inn i 2.5.0).
