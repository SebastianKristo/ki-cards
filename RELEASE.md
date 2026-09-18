# ki-cards 3.98.1

## Feilen var min, og den var en backtick

`ki-basseng-card` registrerte seg ikke:

```
ki-basseng-card: registreringen feilet (ved lasting)
TypeError: css(...).tall is not a function
    at get styles
```

I 3.97.0 slettet jeg de gamle `.tall`-stilene og la igjen en kommentar om det. Kommentaren
sto **inne i css-malen**, og jeg skrev klassenavnene med backticks rundt:

```
/* `.tall`, `.tall-verdi` og `.tall-tekst` er fjernet — ... */
```

Den første backticken lukket css-malen. Deretter leses `.tall` som en egenskap, og neste
backtick starter et nytt tagget kall — `css(...).tall` som funksjon. Hele kortet falt bort.

Kommentaren er skrevet om uten backticks, og kortet registreres igjen.

## Byggeskrittet som ville fanget det

Dette er tredje gang i dag samme feilklasse dukker opp, og grunnen er at **`node --check`
ikke ser den**: resultatet er fortsatt gyldig JavaScript, bare et tagget kall på noe
annet. Feilen viser seg først når `styles` leses i frontend.

`build.sh` kjører nå `verifiser-styles.js` etter hvert bygg. Den laster bundelen med en
lit-lik `css()` og **leser `styles` på hvert registrerte kort** — nøyaktig der feilen slår
ut. Feiler ett kort, stopper bygget.

Kontrollert ved å sette inn en backtick i css-malen med vilje:

```
  1 problem(er):
    styles feiler på ki-basseng-card: css(...).test is not a function
BYGG STOPPET: et kort feiler når styles leses
```

Uten den innsatte feilen: `styles ok på 98 kort`.

## Også i denne versjonen

`finnLit` fra 1.8.0 leter i åtte HA-elementer og går oppover arvekjeden. Det var ikke
årsaken her, men det er en bedre måte å finne LitElement på, så den står.

Registreringen har egen feilfangst fra 1.7.1. Den er grunnen til at vi fikk se årsaken
denne gangen i stedet for et tomt kort — den beholdes.
