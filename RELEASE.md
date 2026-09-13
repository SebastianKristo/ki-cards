# ki-cards 3.41.0

## `ki-sparing-card` 2.0.0 – samme form som resten av Tesla-popupen

Kortet hadde sitt eget uttrykk med delt stolpe, tallrad og prislinje. Det så greit ut for
seg selv, men sto fremmed ved siden av batteriflisene og knapperaden i popupen.

Nå er alt bygget som `universal_sensor_ny`-fliser: `--gray200`-bakgrunn, 24 px hjørner,
rundt ikonfelt på 58 px til venstre med `rgba(250,251,252,.10)` bak, etiketten i 13 px over
og verdien i 26 px under, med enheten som en liten 14 px span i vekt 300 — nøyaktig som
rekkevidde- og kilometerflisene dine.

* **Spart-flisen** går over hele bredden, med beløpet i 38 px, en linje som sier hva diesel
  ville kostet mot hva strømmen kostet, og en stolpe nederst slik `show_bar` gjør det.
  Stolpen viser hvor stor andel av dieselregningen dere slapp unna — 91 % i praksis.
* **De to bilene** står side om side med kroner per mil. Trykk åpner more-info.
* **Kjørt, liter og CO₂** følger under i samme rutenett.
* **Periodevelgeren** har fått samme pilleform som `simple-tabs` i popupen: tynn hvit
  ramme, valgt pille i `--active-big` med mørk tekst og skygge.

Prislinjen nederst står igjen som en dempet fotnote, og bytter til oransje med årsaken hvis
hentingen av pumpeprisen feiler.
