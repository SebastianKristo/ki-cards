# ki-cards 3.48.0

## Ansiktshistorikken: loggboken som reservevei

`significant_changes_only=0` var ikke nok. Jeg har nå gjettet to ganger på hvordan
historikk-API-et behandler endringer som bare rører attributter, og i stedet for å gjette
en tredje gang henter kortet fra to uavhengige kilder:

1. **Historikk** med attributter, som før. Den gir `bekreftet_tid` og `kilde`.
2. Kom det færre enn to rader ut av den, hentes **loggboken** i tillegg
   (`logbook/period/…?entity=…`). Den lister hver tilstandsendring for seg, så
   Rune i går, Sebastian i dag og Cybele senere kommer med uansett hva historikken
   filtrerte bort.

Radene slås sammen på navn og tidspunkt, så samme opplåsning kommer ikke med to ganger.
Feiler den ene kilden helt, brukes den andre; feiler begge, vises gjeldende tilstand som før.

`logg.diagnose: true` skriver en linje nederst i loggen med hvor radene kom fra —
«historikk (1 rader) + loggbok (3 rader)». Den forteller med én gang hvilken vei som
faktisk virker hos deg, i stedet for at jeg må gjette videre.

## Om dørlåsen

`lock.dorlas_blatann` er med i loggen, som radene «Dørlås låst» og «Dørlås låst opp» —
navnet kommer fra sonen din. At de er seks dager gamle betyr at låsentiteten ikke har
endret tilstand siden. Åpnes døra med ansiktsgjenkjenning uten at låsen selv rapporterer
ulåst, får ikke loggen noe å vise fra den.
