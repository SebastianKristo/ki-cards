# ki-cards 3.28.0

## `ki-ruter-card` 4.0.0 – redesignet i samme språk som resten

Kortet er flyttet fra `src/cards/` til `src/69-ki-ruter-card.js`, så det ligger sammen med
de andre KI-kortene og bare defineres én gang i bundelen.

Formspråket er lagt om til det samme som `ki-sikkerhet-card`, `ki-sensor-liste-card` og
button-card-malene:

* **Toppen** har 48 px rundt ikonfelt med `rgba(250,251,252,.10)` bak, tittel i 19 px
  halvfet, klokkeslett til høyre.
* **Holdeplassvelgeren** er den samme pillerada som fanene ellers – tynn ramme rundt,
  valgt pille i `--active-big` med mørk tekst og skygge.
* **Neste avgang** er en hel flate i linjens farge med linjemerket i et mørkt rundfelt,
  destinasjon i 17 px halvfet og nedtellingen i 40 px til høyre.
* **Avgangsradene** har samme pilleform som sensorlistene: 70 px høye, 22 px hjørner,
  `--gray100` bakgrunn, rundt linjemerke på 50 px til venstre, destinasjon i 16 px og
  nedtellingen i 24 px til høyre. Går den om under to minutter, tones raden i linjefargen.
* **Avvik og linjeknapper** er runde flater og piller i samme palett, med rødt fyll i
  stedet for gjennomsiktig rødt når noe er meldt.
* Bakgrunnsgløden har fått eget lag, som i sikkerhetskortet, så kortet slipper å klippe
  innholdet sitt.

Funksjonen er uendret: gangetid per holdeplass, sanntidsprikk, forsinkelse med
overstreket planlagt tid, spor, avviksliste og nedtelling hvert tiende sekund. All
konfigurasjon virker som før.

Smalere enn 420 px krymper nedtellingen og linjemerkene så radene ikke brekker.
