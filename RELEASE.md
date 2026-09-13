# ki-cards 3.19.1

## `ki-sikkerhet-card` ved armering og avkobling

Tre feil som alle slo ut nettopp når panelet går `disarmed → arming → armed_away`.

**Hele heroen ble bygget på nytt ved hver tilstandsendring.** Ved armering skjer det tre
ganger på under et sekund, og huset ble tegnet om midt i animasjonene — røyk, radar og
døråpning startet forfra hver gang. Heroen er nå delt i tre deler (topp, hus, brikker) som
oppdateres hver for seg, og bare når innholdet faktisk er nytt. Ved armering endrer bare
toppen seg; huset står stille, med unntak av nedtellingsringen som legges til og fjernes
som den skal.

**Kortet klippet innholdet.** `.kort` hadde `overflow:hidden` fordi bakgrunnsgløden lå på
elementet selv. Når tastaturet foldet seg ut, ble bunnen kappet. Gløden har fått sitt eget
lag som klipper seg selv, og kortet kan vokse fritt.

**Det innebygde alarmkortet fikk ikke fersk `hass`** på ticks der ingen av
sikkerhetskortets egne entiteter endret seg, siden `set hass` returnerte tidlig. Tastaturet
kunne dermed stå igjen med gammel tilstand. `hass` sendes nå alltid videre.

Minimumshøyden med `soner: false` er hevet fra 9 til 11 rader, så det er plass til
tastaturet uten at det reserveres plass til soner som ikke tegnes.
