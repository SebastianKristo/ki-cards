# ki-cards 3.21.0

## Faner i `ki-sikkerhet-card`

Kortet har fått tre faner: **Sikkerhet** (huset og alarmen), **Dørlåser** og **Logg**.
Fanerada vises bare når det er mer enn én.

```yaml
faner: [sikkerhet, laser, logg]   # false gir bare sikkerhetsfanen
```

**Dørlåser** har «Lås alle» og «Lås opp alle» med teller — «Lås 2 stk», eller «Alle dører
er låst nå» når det ikke er noe å gjøre — og en pille per lås med tilstand, batteri og
hvor lenge siden den sist endret seg. Låsene hentes fra `laser.entities`, eller
automatisk fra sonene med `kind: lock` hvis du ikke setter noe.

```yaml
laser:
  entities: [lock.dorlas, lock.stue_dorlas, lock.vaskerom_dorlas, lock.garasjedor]
  navn: { lock.dorlas: Inngang }
  batteri: { lock.dorlas: sensor.dorlas_batteri }
```

**Logg** slår sammen alarmtilstand, låsing og opplåsing, og ansiktsgjenkjenning til én
tidslinje, nyeste først. Hentes fra historikk-API-et, ikke fra tilstandene, så den
overlever omstart. Oppdateres maks hvert 30. sekund så den ikke spør ved hver tick.

```yaml
logg:
  ansikt: sensor.ansiktsgjenkjenning_dorlas_sist_last_opp_av
  dager: 7
  maks: 40
```

Ansiktssensoren gir rader som «Rune låste opp». Låsene gir «Inngang låst opp», alarmen
«På – borte» og «Alarm utløst».

## Dyplenking til en fane

`KI.navigate` forstår nå en fane-del i stien, skilt med `::`:

```yaml
hjem:
  las: lock.dorlas
  las_path: '#alarm::laser'
```

Fane-delen fjernes før navigeringen, så bubble-card ser bare `#alarm` og åpner popupen
som vanlig; deretter melder `KI.navigate` fra om fanen, og sikkerhetskortet bytter til
den. Virker på alle stier som går gjennom `KI.navigate` — `'#alarm::logg'` åpner loggen.
Kort som ikke kjenner fanen, ignorerer meldingen.
