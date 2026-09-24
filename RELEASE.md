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
