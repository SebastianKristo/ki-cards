# ki-cards 3.79.0

## `ki-hjem-card`: etasje per rom i editoren

Overstyringen `rom.<id>.etasje` fantes i kortet fra før, men bare i YAML. Nå er den et
nedtrekk under hvert rom i UI-editoren, med etasjene som faktisk finnes:

* **Som i Home Assistant** — standard. Rommet følger områdets egen etasje, og ingenting
  lagres i konfigurasjonen.
* Etasjene fra rommene dine, sortert etter nivå, med navnet fra
  `etasje_innstillinger` hvis du har gitt dem et eget — så «2. etasje» vises som «2. etg»
  når det er det du kaller den.
* **Uten etasje**, for rom som ikke er lagt i en etasje i Home Assistant.

Valgene leses fra rommenes egne attributter, ikke fra etasjeregisteret, slik resten av
kortet gjør. Da stemmer nøklene med det `etasjeFor()` sammenligner mot — hadde jeg brukt
registeret, kunne en id matchet på papiret uten å treffe.

Setter du feltet tilbake til «Som i Home Assistant», fjernes nøkkelen fra
konfigurasjonen. Rommets øvrige innstillinger — ikon, rekkefølge, plassering — står
urørt; kontrollert med test.
