# ki-cards 4.25.1

## Pilla lå tre piksler for langt til venstre

«Kalender» stakk ut på høyre side av den rosa pilla.

`offsetLeft` måles fra forelderens **kant**, mens `position:absolute; left:0` måles fra
innsiden av padding-en. Fanerada har 1 px ramme og 2 px padding, så pilla havnet tre
piksler feil — nok til å se skjevt ut på et ord som «Kalender».

M�lingen bruker nå `getBoundingClientRect`, som tar med ramme, padding og eventuell
skalering. Da stemmer den uansett hva stilen gjør.

## Og bredden som ikke fulgte med

To ting endrer fanebredden etter at pilla er plassert:

* **Skrifta lastes ferdig.** Første måling skjer mot reservefonten, som er smalere.
  Pilla sto igjen for kort. Nå måles den på nytt via `document.fonts.ready`.
* **Kortet endrer størrelse.** En `ResizeObserver` måler på nytt, og kobles fra når
  kortet fjernes.

### Kontrollert

M�lingen er lest gjennom mot rammebredden; `fonts.ready` og `ResizeObserver` er koblet
til og fra. Selve pikslene må ses i nettleseren — riggen her har ingen layout.

---

# ki-cards 4.25.0

`ki-tabs-card`: den aktive fyllingen glir mellom fanene og kan dras; trykk gir respons i
selve øyeblikket.
