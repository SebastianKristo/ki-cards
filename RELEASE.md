# ki-cards 4.31.0

## Glidende pille i hyttekortet og lanseringskortet

`ki-hytte-card` (Kalender/Opphold/Statistikk) og `ki-lansering-card` har nå samme pille,
dra og trykkeffekt som de andre.

Hyttekortet får den også på **stedsvelgeren** når flere steder vises.

### Kallet ligger der begge tegneveiene går gjennom

Hyttekortet har to veier til skjermen — vi fant det tidligere i dag da søkefeltet ikke
kom opp ved ikonklikk. Her kunne samme deling gitt at pilla forsvant ved neste
oppdatering, og da står ingen fane merket, siden stilen slår av kortets egen
aktivbakgrunn.

`_pille()` kalles derfor fra `_kobl()`, som begge veiene bruker. Den tredje veien — «Fant
ingen oversikt» — tegner ingen faner i det hele tatt, så den trenger den ikke.

Lanseringskortet har én vei, og kallet ligger rett etter `innerHTML`.

### Nå med glidende pille

`ki-tabs-card`, `ki-hjem-card`, `ki-avfall-card`, `ki-sovn-pro-card`,
`ki-strompris-card`, `ki-hytte-card` og `ki-lansering-card`.

De tre siste slår opp `window.KI` i stedet for `KI`, siden de skal kunne brukes
frittstående fra `/local/`.

### Kontrollert

Dekningen gjennomgått kort for kort: begge tegneveiene i hyttekortet, «tom»-veien som
returnerer før fanene, og at stedsvelgeren er med.

---

# ki-cards 4.30.2

Strømpriskortet mistet markeringen ved døgnbytte: pilla ble bare satt på én gang, og
stilen hadde alt slått av kortets egen bakgrunn.
