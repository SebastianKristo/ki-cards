# ki-cards 5.59.0

## Bassengkortet i mysmarthome-språket, med trykk og finger på grafen

`ki-basseng-card` 1.13.0.

**Designspråket.** Panelene så ut som noe for seg selv: fargede ikonfliser, halvfete overskrifter,
tunge tall. Nå følger de dashbordet: ikonflisen er den lyse, gjennomskinnelige sirkelen med tynn kant
og hvitt ikon fra `universal_base`, navnene står i 14 px/500 med 70 % opasitet, og de store tallene i
vekt 300 — som «2em / 300» i flisene ellers. Halvfet er borte; fargene brukes bare i ringer og stolper.
Reglene ligger i `DESIGN.md` i repoet, så de neste kortene begynner der.

**Trykk gir riktig entitet.** Panelhodene og ringene åpner mer-info for det de viser: omsetningene,
vanntemperaturen, planen (modus-sensoren) og spredertiden. Tellerflisene gjorde det fra 1.12.

**Fingeren over grafen.** Dra over temperaturgrafen, så følger en strek og en lapp med temperaturen og
klokkeslettet der fingeren står — og «pumpa gikk» når fingeren står i et pumpefelt. Nå-lappen skjules
imens. På mobil er det bare mens fingeren er nede, så rullingen ikke stjeles.

En feil rettet før den nådde deg: første utgave av lappen leste en variabel før den var satt, og
kortet hadde krasjet i det øyeblikket noen rørte grafen. Testen fant den.

## family-status-card: fargene kan velges, og været som profil

**Fargene i editoren.** Fargeruta var bare en visning — trykk gjorde ingenting, og den eneste måten å
endre en farge på var å skrive en CSS-verdi i tekstfeltet. Nå åpner ruta en palett med temaets
farger (aktiv, rød, oransje, gul, grønn, blå, lilla, rosa, tekst, dempet, flate, svart), en egen
fargevelger for en hvilken som helst farge, og «Arv fra temaet» som tømmer. Tekstfeltet står der
fortsatt for den som vil skrive `var(--…)` selv.

**Linja under navnet** er et valg i Hilsen-panelet: **Ingen**, **Vær – temperatur og tilstand** (som
i appen: «13 °C • Klar himmel», med værentiteten under) eller **Egen tekst**. Før måtte man vite at
`{temp} • {vaer}` fantes.

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass. Bassengkortet er tegnet
med et døgn oppdiktet historikk: fingeren på midten gir «25,9° 06:46» og «pumpa gikk», nå-lappen
skjules, panelhodene er trykkbare. `DESIGN.md` er lagt til.
