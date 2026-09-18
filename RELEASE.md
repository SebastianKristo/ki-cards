# ki-cards 3.92.0

## `ki-klima-pro-card` er fjernet fra bundelen

Kortet fantes både her og i sitt eget repo, `ki-klima-strom-kort`. De to hadde kommet ut
av takt: kopien her sto på 2.7.0 med en annen kodebase enn repoets 1.5.0.

Verre var at **kopien her vant**. Bundelen registrerer kort gjennom `KI.define`, som
hopper over elementer som alt finnes. Den frittstående fila brukte rå
`customElements.define` og kastet «already been used» — stille, midt i fila. Lastet
ki-cards først, var det kopien her som kjørte, uansett hva som sto i repoet.

Det gjorde endringer i det riktige repoet usynlige, og var vanskelig å se: ingen feil i
grensesnittet, bare et kort som ikke oppfører seg som koden man leser.

Filen er slettet. Kortet lastes nå bare fra `ki-klima-strom-kort`, som er der det hører.

**Etter oppgradering:** sørg for at `ki-klima-strom-kort.js` ligger i
Lovelace-ressursene. Er den ikke der, forsvinner kortet — det finnes ikke lenger i denne
bundelen.
