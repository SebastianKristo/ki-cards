# ki-cards 3.31.1

## `ki-sikkerhet-card` forsvant helt fra popupen

Min regresjon, innført i 3.27.1. Da jeg skrev om rullingen, byttet jeg ut alt mellom
`_rull(...)` og `connectedCallback()`. Metoden `_ventendeFane()` lå akkurat der, og ble
slettet sammen med den gamle rullekoden.

`connectedCallback()` kaller den fortsatt som første linje. Den fantes ikke, så kortet
kastet `TypeError` idet det ble koblet til DOM-en, og rendret aldri. Huset, brikkene,
tastaturet og fanene — alt var borte. Det har vært slik i 3.27.1, 3.28.0, 3.29.0, 3.30.0
og 3.31.0.

Metoden er lagt inn igjen. Samtidig tåler kortet nå at `connectedCallback()` kommer før
`setConfig()`, som det gjør i noen oppsett: både `_ventendeFane()` og `_faner()` sjekker
at konfigurasjonen finnes før de leser den.

Byggeskriptet pakker hvert kort i sin egen `try`, så feilen tok bare dette kortet med seg
— resten av bundelen har virket hele tiden. Det er også grunnen til at den ikke ga noe
synlig utslag utover at kortet uteble.
