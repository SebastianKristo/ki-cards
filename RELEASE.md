# ki-cards 3.40.0

## `ki-strompris-card`: teksten i grafen var strukket

Grafen ble tegnet i en viewBox på fast 320 enheter bredde, skalert ut til full bredde med
`preserveAspectRatio="none"`. Da skaleres **alt** inni SVG-en horisontalt — ikke bare
kurven, men også klokkeslettene, prisene og strektykkelsene. På en utbrettet skjerm var
faktoren over det dobbelte, og bokstavene ble merkbart brede.

Forrige versjon la på `aspect-ratio` i CSS. Det gjorde grafen høyere, men rørte ikke selve
strekkingen — derfor så tallene fortsatt gale ut.

Nå måles den faktiske bredden med en `ResizeObserver`, og viewBox settes til den bredden i
piksler. Skaleringen blir 1:1 uansett skjerm, og tekst og streker tegnes i sin egen
størrelse. Høyden regnes ut fra bredden med `graf_forhold` (standard 2,6), med `hoyde` som
gulv og 1,9 ganger det som tak.

Observeren kobles på nytt etter hver full omtegning — kortet bytter ut hele `.ramme`, så
elementet den så på forsvinner — og ryddes når kortet fjernes. Endringer under 8 px
utløser ingen ny tegning, så den ikke går i loop mot sin egen høyde.
