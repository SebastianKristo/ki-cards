# ki-cards 3.21.1

## Loggen viste ikke ansiktsgjenkjenning

Spørringen brukte `minimal_response`, som utelater attributter. Sensoren
`sensor.ansiktsgjenkjenning_dorlas_sist_last_opp_av` står på samme navn flere
opplåsninger på rad — det er `bekreftet_tid` som flytter seg — og uten attributter fantes
de opplåsningene rett og slett ikke i svaret. Låser Rune opp tre ganger, så historikken
bare én tilstandsendring.

Ansiktssensoren hentes nå i en egen spørring **med** attributter, og hendelsene grupperes
på `bekreftet_tid` i stedet for på tilstandsendring. `kilde` vises som undertekst, så
raden blir «Rune låste opp / Ansiktsgjenkjenning · Lokal webhook». Er sensoren nylig lagt
til og historikken tom, vises i det minste siste opplåsning fra gjeldende tilstand.

## Døra sto utenfor huset

Veggen går fra x=80 til x=240, men døra var tegnet på 228–254 — altså halvveis ut i lufta
til høyre. Døra ligger nå på 206–232, og vinduene er flyttet til 96, 134 og 172 så
avstanden blir jevn.

## Sensorpillene ligner button-card-malene

`ki-sensor-liste-card` følger nå formen til `universal_sensor`-flisene: to i bredden som
standard, 64 px høye med 20 px hjørner, rundt ikonfelt til venstre med `rgba(250,251,252,.10)`
bak, navn i 15 px halvfet og tilstanden i 13 px under.

Aktiv flis farges og tekstfargen snur til `--gray100`, med `rgba(40,40,42,.10)` bak ikonet
— samme som malene dine. Standardfargen kommer nå fra typen når sonen ikke setter
`color:` selv: `--purple` for bevegelse, `--orange` for åpninger, `--red` for låser.

`kolonner: 1` gir de brede pillene tilbake.
