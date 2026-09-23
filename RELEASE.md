# ki-cards 5.64.0

## Kamerakortet: hvert kamera i mysmarthome-språket

`ki-kamera-card` 1.12.0. Visningen for ett kamera — flisene under bildet og aktivitetsloggen — er
tegnet på nytt etter `DESIGN.md`.

**Flisene** (Personvern, Bevegelse, Siste bevegelse) er de liggende flisene fra dashbordet: den lyse
ikonsirkelen med tynn kant til venstre, navnet i 15 px/500 og tilstanden i 13 px/500 med 70 %
opasitet under. Personvern på (kameraet av) fylles rødt med svart tekst; bevegelse nå fylles med
aktivfargen.

**Personvernbryteren svarer med en gang.** Kameraet bruker et par sekunder på å bekrefte, og flisen
sto i gammel tilstand så lenge — det leses som at trykket ikke tok. Nå vises det nye med en gang, og
slippes så snart kameraet er enig (eller etter fem sekunder uten svar).

**Loggen** er ett panel med ikonflis og overskrift («Aktivitet» / «siste 24 timer»), og hver linje
har ikonsirkelen til venstre, navnet i 15 px/500, tilstand og sti i én dempet meta-linje under, og
klokkeslettet til høyre. Dagoverskriftene i 500/70 % i stedet for versaler i halvfet; den vertikale
koblingslinja og pilene («→») er borte. Hendelser som slo *på* får aktivfargen i ikonet.

**Langt trykk åpner entiteten** — på flisene og på hver logglinje. Trykk og bytte gir haptikk.

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass.
