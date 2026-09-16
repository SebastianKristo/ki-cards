# ki-cards 3.72.0

## `ki-avfall-card` 2.3.0

**Valget mellom Fraksjoner og Kalender** er nå den samme brede bryteren som Vekking/Søvn
i søvnpopupen: `--gray200` bak, 75 px hjørner, 4 px luft, og den valgte halvdelen i
`--active-small` med lys tekst. Teksten er 15 px i vekt 500, som de andre bryterne.

Før var den en flat 20 px-boks med 12,5 px halvfet tekst og `--active-small` — samme
farge, men en annen form enn resten av bundelen.

**Fraksjonsradene** følger formen fra søvnpopupen: 24 px hjørner i stedet for 22, 72 px
høyde, og et **nøytralt rundt ikonfelt** på 52 px med `rgba(250,251,252,.10)` bak — i
stedet for en tonet flate i fraksjonens farge.

Fargen ligger nå på selve ikonet. Fraksjonen er dermed like lett å kjenne igjen, men hver
rad får ikke sin egen kulørte flate — det er det som fikk radene til å se ut som noe annet
enn resten av dashbordet. Navnet er 16 px i vekt 500 og undertittelen 13 px, som i
skjermbildet du sendte.

Tømmes fraksjonen i dag, får raden fraksjonens farge og ikonfeltet et mørkt felt, så
ikonet fortsatt leses.
