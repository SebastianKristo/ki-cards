# ki-cards 5.68.0

## ki-basseng-card 2.0.0: varme, nattsenking, pooltak og klor

For [KI Basseng 1.3](https://github.com/SebastianKristo/ki-basseng), som fikk en varmemodell
som avgjør om varmepumpa skal stå av om natta, ønsket temperatur, pooltak og klorlogg.

**Ny fane: Varme.** Fire flater:

- **Temperatur.** Ringen viser vannet mot målet og blir grønn når målet er nådd. Ved siden av
  står ute, varmetap nå og sol inn. Ønsket temperatur har store −/+. To raske trykk gir to
  steg, ikke samme steg to ganger. Er ingen hjemme, står det hvor mye målet er senket.
- **Pooltaket** er én stor bryter med bassenget tegnet. Taket glir på når du slår det på.
  Teksten regner ut hva taket betyr for tapet akkurat nå: «Taket sparer ca. 1220 W nå».
- **Nattsenking.** Natta er en stripe fra varmevinduets slutt til start, med av-vinduet
  skravert og en nå-strek. Under står kWh og kroner spart, laveste temperatur, og to stolper:
  «Holde varmen» mot «Med senking». Lønner det seg ikke, vises de beste vinduene den vurderte,
  og hvilke som ikke rakk å varme opp igjen. Bryter, kriterium og maks senking ligger nederst.
- **Klortabletter.** Ringen viser dager siden sist mot intervallet og blir oransje når det er
  på tide. En stor «Logg klortablett», og de fem siste innslagene med notat og vanntemperatur.
  Det siste kan angres.

**Oversikt.** Nye fliser for *Pooltak* (trykk slår av og på), *Nattsenking* (viser vinduet og
åpner Varme) og *Klor* (trykk logger en tablett). Prisstyring og varmeprioritet er flyttet
til innstillingene under Sirkulasjon. Øverst kommer et oransje varsel når det er på tide med
klor, med «Logg» rett i varselet, og et lilla varsel mens varmepumpa står av for natta.
Vannbildet får et lokk når taket ligger på, og merker for «til 04:00» og «tak på».

**Innstillinger** har fått panelet *Varmemodell*: styr settpunkt, borte-senking, varmetap
med og uten tak, sol gjennom taket, solvarme, klorintervall og tving heat. Under står
faktorene modellen har lært.

Med fire faner får alle plass ved siden av tannhjulet på en telefon. Mot KI Basseng 1.2
(uten varmemodell) skjules Varme-fanen og de nye flisene, og de gamle kommer tilbake.

## ki-basseng-hero-card

Scenen viser pooltaket som lameller over vannet, og under nattsenking får den måne, en
mørkere himmel og «Nattsenking til 04:00» i pillen. Undertekstene sier «tak på» og
«klortablett!» når det gjelder. Måltemperaturen hentes fra KI Basseng når den finnes.
`pooltak:` kan settes for bassenger uten integrasjonen.

## Popupen

`examples/basseng-popup.yaml` er ett kort i stedet for to varmepumpe-banner og en rad med
fem button-card over kortet. Kortet tegner dem selv med `varmepumpe:`, `stillemodus:` og
`hurtig:`. Faner: oversikt, varme, sirkulasjon, spreder, innstillinger.

### Kontrollert

Begge byggesjekkene kjørt (115 stiler, 62 kort). Kortet er tegnet i Chromium med tre sett
data: nattsenking planlagt og klor på tide; tak på, nattsenking aktiv og ingen hjemme; og
KI Basseng 1.2 uten varmemodell. Trykk sender riktige kall: Klor →
`button.press` på `logg_klortablett`, Pooltak → `switch.toggle` på `pooltak_pa`, to trykk
på + → `number.set_value` 27,5 og så 28.

---

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
