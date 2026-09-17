# ki-cards 3.83.0

## `ki-nedlasting-card` 1.1.0

**Fargetonen på heroen er borte.** Den la et skinn over hele toppen når noe lastet, og
fargen sa ingenting utover det ikonet og tilstanden alt viste.

**Køen etterlater ikke én flis alene.** `auto-fit` ga fire fliser på første rad og den
femte alene under. Kolonnetallet settes nå fra antallet: fem blir 3 + 2, seks blir 4 + 2,
sju blir 4 + 3. Fire er taket, som før.

**Ny animasjon: en levende fartsgraf.** Kortet måler ned- og oppfarten selv, holder de
siste to minuttene, og tegner dem — nedlasting som fylt flate, opplasting som en tynnere
strek over. Punktet i enden pulserer så «nå» er tydelig, og toppen av skalaen står skrevet
øverst til venstre.

Dette er grunnen til å bytte: et øyeblikkstall på 8,4 MB/s sier ikke om farten holder seg
eller hakker. Grafen gjør det.

Kortet har sin egen klokke som måler hvert tredje sekund, ikke bare når farten endrer seg.
Uten den ville en pause sett ut som at grafen stoppet, i stedet for å falle til null.
M�lingene tas ikke tettere enn halvannet sekund, og vinduet holdes på to minutter.

Skalaen følger den høyeste målingen i vinduet, med et gulv på 0,5 MB/s så en rolig periode
ikke blåses opp til å se dramatisk ut.

`animasjon: ror` gir den gamle røret med pakker. `graf: false` slår grafen av helt.

Geometrien er kontrollert for fem tilfeller: vanlig serie, alt null, nesten null, store
sprang og 120 målinger. Alle punktene holder seg innenfor rammen.
