# ki-cards 3.33.0

## `ki-ruter-card` 4.2.0

**Gløden øverst er tydeligere.** Den var nesten borte etter at kortet mistet sin egen
bakgrunn — opaciteten er hevet fra .22 til .38, og gradienten er strammet inn til en
ellipse så fargen samler seg i toppen i stedet for å smøre seg utover hele kortet.

**Kjøretøyene er tegnet om.** Karosseriet har gradient fra linjefargen ned til en mørkere
variant, med et skyggebelte langs bunnen. Rutene er lyse med avrundede hjørner og en egen
rute i front. Hjulene er mørke med en eike som roterer mens kjøretøyet kjører. Foran ligger
en lykt med en pustende lyskjegle, og under står en myk skygge på bakken. Hele karosseriet
humper svakt, så det ser ut til å kjøre og ikke gli.

Trikken har fått strømavtaker, toget en skrå front, og båt og fly egne former.

Gradienten regnes ut i JavaScript i stedet for med `color-mix()` i `stop-color` — det er
ikke trygt i alle SVG-motorer, og faller det ut blir stoppen svart i stedet for mørk.

**Scenen er høyere.** Banene er 46 px i stedet for 34, med en bydis øverst og en lav
silhuett av bygninger bak, tonet ut mot toppen.

**Flere avganger.** Standard `maks` er hevet fra 5 til 8 per holdeplass.
