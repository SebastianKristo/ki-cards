# ki-cards 3.39.0

## `ki-sparing-card` 1.1.0 – roligere oppsett

Første utgave stablet for mye ved siden av hverandre: to stolper, en brikkerad, en fotnote,
og i fanen dessuten to prisfliser og en graf som gjentok det samme. Nå er det én ting per
nivå.

**Én delt stolpe** i stedet for to. Den grønne delen er det strømmen faktisk kostet,
resten er det dere slapp å betale. Med 243 kroner strøm mot 2 834 i diesel blir den grønne
biten en tynn stripe — og det er hele poenget, lest på et blikk, uten å sammenligne to
stolper med hverandre.

**Tre tall på rad** i stedet for brikker som flyter: kilometer kjørt i perioden, liter
diesel som ikke er fylt i år, og CO₂ spart. Under 400 px legger den siste seg på egen rad.

**Kostnad per mil** er blitt én rolig linje — elbil til venstre, diesel til høyre, «mot» i
midten — i stedet for to stolperader til.

**Underteksten** under beløpet sier rett ut hva sammenligningen er: «Diesel ville kostet
2 834 kr. Strømmen kostet 243 kr.»

Feiler hentingen av pumpeprisen, bytter fotnoten farge og sier hvorfor, i stedet for at det
kommer en egen brikke.

`examples/tesla-sparing-fane.yaml` er strippet til kortet alene, pluss en knapp som bare
dukker opp hvis pumpeprisen mangler. Prisflisene og grafen er tatt bort — de gjentok det
kortet allerede viser.
