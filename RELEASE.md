# ki-cards 5.53.0

## ki-vanning-card 3.11.0: ny Nå-fane, nye sone- og programkort, ny fordeling – og historikken virker

### Historikkfanen var tom — alltid

Statistikken ble hentet for **oversiktssensoren**. Den har «9 soner» som tilstand og ingen
`state_class`, så Home Assistant fører aldri langtidsstatistikk på den, og fanen ble stående med
«Ingen statistikk ennå» uansett hvor lenge du ventet. Det kumulative forbruket er **Forbruk totalt**
(`ki_type: total`, `total_increasing`, liter), og det er den kortet henter fra nå.
`historikk_entitet:` overstyrer fortsatt.

### Nå-fanen

- **Tidspunkter formateres.** Neste og siste kjøring sto som råverdien fra sensoren
  (`2026-09-21T06:00:00+00:00`). Nå: «i dag kl. 21:00», «i går kl. 18:00», «i morgen kl. 07:00»,
  ellers «tir. 23. sep kl. 06:00».
- **Strømforbruk fra OpenSprinkler:** strømtrekket vises som «320 mA · ca. 7,7 W». Watt er regnet
  ved ventilspenningen, 24 V som standard (`spenning:` endrer den). Det er et anslag — spolene er
  induktive, så det virkelige forbruket er litt lavere enn spenning × strøm.
- **Vannivå er borte** fra flisene. `vis_vanniva: true` tar det tilbake.
- **Nøkkeltallene** er fliser med ikon i en rund flis, navn og verdi — samme form som ellers i
  dashbordet.
- **Neste kjøring** leses fra `sensor.<prefiks>_next_run` når den finnes; før var navnet hardkodet
  til `sensor.opensprinkler_next_run` uansett prefiks.

### Regnpause-kortet

Det blå kortet er tegnet på nytt: dyp blå toning med svakt regn bak teksten, ikon i rund flis,
«Til i morgen kl. 07:00 · 17 t igjen» — datoen formatert og tiden igjen regnet ut — og en
**Avslutt**-knapp rett i kortet. Kortet for et program som kjører, har samme form, med **Stopp**.

### Sonene

Hver sone hadde seks varighetsknapper under seg hele tiden; ni soner ga over femti knapper på
skjermen. Nå er sonene fliser i et rutenett, gruppert på boks. Trykk på en sone, så folder den seg ut
over hele bredden med varighetene; trykk igjen, så legges de bort. Sonen som vanner, står i blått med
pulserende ikon og **Stopp** framme.

### Programmene

Nytt kort: ikon, navn og en meta-linje — «man, ons, fre · 40 min · ca. 480 L» — i stedet for sju
dagspiller, klokka som det store tallet til høyre, og sonene som en liten liste der stolpen viser
hvor stor del av tiden hver sone får. Nederst **Kjør nå**, blyanten og av/på-bryteren på én linje.

### Fordelingen

Én stablet stolpe for hele perioden, fargelagt per sone, og en liste under med samme farger, liter
og andel i prosent. Soner uten vann i perioden står dempet nederst i stedet for som tomme stolper.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Kortet er i tillegg
tegnet med et OpenSprinkler-oppsett som ligner ditt — prefiks `ute_opensprinkler`, regnpause aktiv,
et program som kjører, strømtrekk 320 mA — og alle fanene sjekket: tidspunktene formatert og ingen
rå ISO-dato igjen, vannivået borte, regnkortet med dato og tid igjen, tre sonefliser med bare
stoppknappen synlig før du åpner en, programkortet med meta-linje og sonerader, fordelingen 70/30 med
den tomme sonen dempet, og historikken som nå henter fra `sensor.ki_vanning_forbruk_totalt` og viser
døgnene. Ingen `NaN` noe sted. Ikke kjørt mot det ekte anlegget.
