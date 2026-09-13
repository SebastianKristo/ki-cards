# ki-cards 3.29.0

## `ki-sovn-pro-card`: Enkel/Avansert flyttet opp på fanelinja

Kortet hadde to brede brytere rett over hverandre — Søvn/Vekking, og så Enkel/Avansert
på egen rad. Det tok mye plass og gjorde det uklart hvilken som var hovedvalget.

S�vn/Vekking står nå alene på linja og får all bredden. Enkel/Avansert er blitt en
kompakt knapp til høyre på samme rad, med et skyvekontroll-ikon og teksten «Avansert».
Den lyser opp når avansert visning er på, og trykk veksler. Under 420 px faller teksten
bort og bare ikonet står igjen.

Har du ingen vekkealarmer, er det ingen faner å vise, og knappen står alene til høyre.

`avansert_knapp: false` gir den gamle brede bryteren på egen rad tilbake.

## Klikk på Søvn eller Vekking nullstilte visningen

`KI.wirePro` la klikklytteren på alle `.switch-valg`, også fanepillene. De har `data-tab`,
ikke `data-view`, så `el.dataset.view` var `undefined` — og et trykk på Søvn satte
`_view` til `undefined`. Da var verken Enkel eller Avansert markert som valgt, og alt som
sjekket `_view === "avansert"` slo av.

Lytteren henger nå på `[data-view]` i stedet. Det gjelder alle kortene som bruker
`KI.wirePro` med faner, ikke bare søvnkortet.
