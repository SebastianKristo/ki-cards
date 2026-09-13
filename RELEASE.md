# ki-cards 3.32.0

## `ki-ruter-card` 4.1.1: mobilfeil

**Kortet stakk ut av skjermen.** Holdeplassvelgeren hadde `width:fit-content`. Den regelen
står etter `.kort > * { width:100% }` med samme spesifisitet, så den vant — og med seks
holdeplasser ble rada bredere enn skjermen i stedet for å rulle. Velgeren er nå
`width:auto; max-width:100%; min-width:0` og ruller sidelengs som den skulle. `:host` har
fått `overflow-x:clip` som sikring.

**Animasjonen var kuttet i to.** Scenen var én SVG med `viewBox="0 0 320 96"` og
`preserveAspectRatio="slice"`. Radene lå på y=18, 44 og 70, og banen under tredje rad
havnet på y=102 — utenfor høyden. På smale skjermer skalerte den i tillegg opp for å dekke
bredden, så enda mer forsvant.

Scenen er bygget om: hver bane er en vanlig div på faste 34 px, og kjøretøyene er SVG-er i
fast pikselstørrelse som flyttes med `left` fra `-90px` til `100%`. Ingenting skaleres,
ingenting ligger utenfor. Buss får stiplet vei, skinnegående får sviller.

Avgangsradene er samtidig strammet inn under 420 px: mindre linjemerker, kortere
nedtelling og litt mindre luft, så en lang destinasjon ikke skyver nedtellingen ut.
