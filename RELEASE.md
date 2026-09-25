# ki-cards 5.84.0

Bygget oppå 5.83.0 fra GitHub.

## ki-sikkerhetspanel-card 1.2.0

**Holdet ble kuttet.** Kortet ble tegnet helt på nytt hver gang en sensor meldte seg — og i et hus med
bevegelsessensorer skjer det ofte. Holdt du inne **Av** eller **Borte** mens det skjedde, forsvant knappen under
fingeren, holdet ble avbrutt, og du måtte holde på nytt. Nå venter tegningen til du slipper (eller har tastet
koden ferdig), og gjøres da én gang. I tillegg fanges fingeren når holdet starter, så det ikke slippes om den
glir litt på skjermen — bare når du løfter den.

**Det gamle tastaturet er tilbake** — det fra `ki-alarm-card`: eget kort med «Tast koden for av», runde
prikker, store runde taster, sletteknapp og kryss oppe til høyre. Feil kode gjør tittelen rød og rister
tastaturet. Det legger seg nå **i kortet rett under modusvelgeren** og rulles inn i bildet, i stedet for som et
ark nederst på skjermen — så navbaren aldri dekker det. `tastatur_luft` trengs ikke lenger.

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med et hold på **Borte** der en bevegelsessensor melder midt i:
knappen er den samme etterpå og tegningen venter; når fingeren slippes, tegnes kortet og ventingen nullstilles.
**Av** åpner det gamle tastaturet i kortet (seks prikker, tolv taster); feil kode gir «Feil kode», risting og
tomme prikker; riktig kode sender `alarm_disarm` og lukker tastaturet. Ingen `NaN` eller `undefined`.
