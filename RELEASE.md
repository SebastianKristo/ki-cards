# ki-cards 4.17.1

## Kalenderpopupen ble tom — backtick i en CSS-kommentar igjen

I 4.17.0 skrev jeg en kommentar om `.bar` og `gap:10px` med backticks rundt, **inne i
CSS-mal-strengen**. Den lukket malen, og `ki-tabs-card` kastet under bygging:

```
TypeError: KI.css(...)(intermediate value)....bar is not a function
    at SkTabsCard._build
```

Kortet ble aldri tegnet, og popupen sto tom. Kommentaren er skrevet om uten backticks.

## Byggeskrittet som ville fanget det

Dette er sjuende gang i dag, og jeg har alt et byggeskritt for akkurat denne feilen —
men det leser `styles`-getteren, og `ki-tabs-card` bygger CSS-en inne i `_build`. Sjekken
kunne ikke se den.

`verifiser-kort.js` setter nå opp **hvert kort og gir det hass**, som er nøyaktig det som
skjer i en visning. Feiler byggingen, stopper pakkingen.

Tre ting måtte løses for at sjekken skulle være verdt noe:

* **`_build` er asynkron** i flere kort, så feilen kommer som en ubehandlet
  promise-avvisning og ikke i try/catch. Den fanges nå med `process.on("unhandledRejection")`.
* **Riggen overstyrer `setTimeout`** til å kjøre synkront, så ventinga på slutten kjørte
  før avvisningene var levert — og sjekken meldte «ok» på en ødelagt bundel. Den ekte
  timeren tas vare på først.
* **Feilen fikk galt kortnavn**, fordi den asynkrone avvisningen kom mens løkka alt var
  videre. Nå ventes det en ekte tikk etter hvert kort, så navnet stemmer.

Kontrollert ved å sette inn backticken med vilje: bygget stopper og peker på
`ki-tabs-card`. Uten den: «bygging ok (54 kort)».

---

# ki-cards 4.17.0

Editoren bygde seg selv på nytt ved hvert tilstandsbytte i huset — 200 ombygginger på 200
bytter, nå 0. Ikonfanen trukket inn til 4 px fra rada. Plassering venstre/midten/høyre,
med norske ord i `align`.
