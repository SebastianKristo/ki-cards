# ki-cards 5.19.1

## Dagsvelgeren har fått samme form som fanerada

Den hadde ramme rundt en gjennomsiktig bunn. Nå er beholderen **fylt** uten ramme, med
større knapper — samme form som fanerada i søvnpopupen.

En ramme rundt tomrom leses som en knapperad. En fylt flate leses som en bryter med to
stillinger, og det er det dette er.

Knappene er 11 × 26 px med 15 px tekst, og tettere på skjermer under 420 px.

Den aktive fyllingen kommer fra den glidende pilla når `KI.pillefaner` er der, ellers fra
knappen selv — de to bruker samme farge, så det ser likt ut uansett.

### Kontrollert

Fylt beholder uten ramme, større knapper, `--active-big` med mørk tekst på den aktive, og
tettere padding på smal skjerm. «I dag» er merket aktiv og «I morgen» merkes som tom når
morgendagens priser mangler.

---

# ki-cards 5.19.0

`enkel: true` i `ki-strompris-card`: bare overskrift, dagsvelger og graf.
