# ki-cards 5.67.0

## ki-veggpanel-card 1.2.0: sidemeny, Norgespris og nattskjerm

Etter redesignet av stua på Tab A8-en.

**Sidemeny i stedet for flytende navbar** (`meny:`). Navbaren la seg over strømkortet; nå står menyen
fast til venstre, med varselprikk (`varsel: { entity, state }`) og punkter som kan skyves ned med
`nederst: true`. Med meny faller tannhjulet i toppstripa bort, og luften nederst går fra 110 til 16 px.
På smale skjermer legger menyen seg vannrett over panelet.

**Strømkortet viser Norgespris** (`strom.fast`) stort, spotprisen ved siden av og effekten til høyre.
Søylene er **de neste 24 timene** når morgendagens priser finnes (`raw_tomorrow`), ellers i dag med det
passerte dempet. De tre billigste timene på rad er blå, og forklaringen sier «Billigst 03–06».

**Lysene er rader igjen** (`lys.visning: rader`, standard) – navn, lysstyrke, bryter – og hele raden er
knappen. Dra sidelengs på en dimbar lampe for å dimme. «Slå av / Slå på» øverst styrer hele gruppa.
`visning: fliser` gir 1.1-flisene.

**Markise og gardiner som rader** med opp / stopp / ned (`dekker_visning: kompakt`, standard). Trykk på
navnet åpner entiteten. `dekker_visning: full` gir segmentet, dra og forhåndsvalgene fra 1.1.

**Nattskjerm** (`natt:`). Når `switch.nattmodus` er på og panelet har stått urørt i `etter` sekunder,
fylles skjermen av en stor, dempet klokke med lås, alarm, vær, neste vekking og egne knapper. Et trykk
vekker panelet uten å treffe det som ligger under.

**Småting:** større klokke, støvsugerpillen sier «Støvsuger ladet», termostaten viser «Venter · 22,8°»
på én linje og tallet får plass i smale kolonner.

Eksempel for stua: `examples/veggpanel-stue.yaml`.

### Kontrollert

Begge byggesjekkene kjørt. Kortet er tegnet i Chromium på 1280×800 med stuas entiteter: meny med
varselprikk, 1,16 kr Norgespris og 1,52 kr spot, 24 søyler fra «Nå» med 03–06 som billigst, åtte
lysrader (5 av 8 på), markise «3 % nede» og gardiner «Åpen». Trykk sender riktige kall: lampe →
`homeassistant.toggle`, «Slå av» → `light.turn_off` på `light.stue`, ned → `cover.close_cover`,
+ → `climate.set_temperature` 22. Nattskjermen vises med nattmodus på.

# ki-cards 5.66.0

## ki-veggpanel-card 1.1.0: passer skjermen, riktig strømpris, lysfliser

Etter første kjøring på iPaden.

**Strømprisen sto som «152,48 kr/kWh».** To ting: sensoren oppgir **øre**, og siden Nord Pool gikk over til
kvarterpriser er det 96 verdier i døgnet, ikke 24. Nå regnes øre om til kroner — når enheten sier øre, eller
prisene er urimelig høye for kroner (`strom: { ore: true }` tvinger det) — og kvarterene slås sammen til
timer. Søylene er 24 igjen, og lappen under fingeren viser snittet for timen.

**Panelet passer skjermen.** Høyre kolonne med åtte lamper, markise og gardiner var mye lenger enn iPaden,
og strømkortet havnet under navbaren. Nå fyller panelet skjermhøyden, og hver kolonne ruller for seg med
en myk fade nederst og plass til navbaren (`luft_bunn: 110`). `skjerm: false` gir vanlig høyde. På smalere
skjermer ruller hele siden som før.

**Lysene er fliser, to i bredden.** Hver flis er ikon, navn og tilstand. Trykk slår av og på; **dra sidelengs**
for å dimme — fyllet i flisen *er* lysstyrken. Lamper uten dimming fylles helt når de er på. Før sto en
stolpe under hver lampe, også de som var av, og lista ble dobbelt så høy.

**Markise og gardiner deler ett kort** med et segment øverst, i stedet for å stå under hverandre.

**Gradetegnet** på termostatene lå nede ved grunnlinja og så ut som et punktum («21,5.»). Det står nå høyt,
som et vanlig gradetegn.

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med 96 kvarterpriser i øre: «0,54 kr/kWh» nå, 24 søyler, og
fingeren på kl. 18 gir «0,94 kr kl. 18–19». Lysflisene: den dimbare med fyll og «70 %», den uten dimming
uten fyll. Segmentet bytter fra Markise til Gardiner. Gradetegnet er hevet, og panelet står i skjermmodus.
Ingen `NaN` eller `undefined`.
