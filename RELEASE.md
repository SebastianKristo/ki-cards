# ki-cards 5.70.0

## ki-veggpanel-card 1.3.0: varmen styres gjennom KI Energi, og «Nytt i Plex» er tilbake

**Varmen er ett kort, koblet til KI Energi.** De to store termostatkortene er erstattet av ett kort,
**Varme**, med én rad per sone: ikonet (oransje når ovnen faktisk varmer), navnet, rommets temperatur,
hva KI Energi vil ha, og − / + med temperaturen i midten.

- **− og + er en manuell overstyring.** Når KI Energi finnes, går trykkene til `ki_energi.overstyr`
  for sonen i stedet for rett til termostaten — ellers ville motoren satt sin egen verdi tilbake ved
  neste tick. Overstyringen gjelder i to timer (`overstyring_min:`). Trykkene samles i 0,8 s og sendes
  som ett kall.
- **Raden sier til når:** «Manuelt til 11:34» som en pille, med et kryss som gir styringen tilbake til
  KI Energi med en gang (`ki_energi.fjern_overstyring`).
- **Sonen finnes av seg selv** — raden i `sensor.ki_laster` som har termostaten blant entitetene. `sone:`
  overstyrer.
- **Overskriften** sier om KI Energi styrer, hvor mange som varmer, eller hvor mange som er manuelle.
  Trykk åpner `#klima`, hold åpner statussensoren.
- Uten KI Energi går − og + rett til termostaten, som før.

**«Nytt i Plex»** — plakatene fra Plex-sensorene i en rad som rulles sidelengs, nyeste først, med
«i dag / i går / 3 d siden» i hjørnet og episode eller årstall under. Trykk åpner i Plex-appen.

```yaml
plex:
  sensorer:
    - sensor.d_day_darling_plex_recently_added_movie
    - sensor.d_day_darling_plex_recently_added_show
strom: false        # strømkortet ut
```

**`strom: false`** tar strømkortet vekk.

Krever KI Energi 2.32.0 for «til 11:34»; med eldre versjon står bare «Manuelt».

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med stuas to soner og en overstyring: «1 manuelt overstyrt»,
oljefyren med «rommet 22,6° · KI vil ha 21,5° · venter», panelovnen med «Manuelt til …», + på oljefyren
sender `ki_energi.overstyr {sone: stue_oljefyr, temp: 22.5, minutter: 120}`, krysset sender
`fjern_overstyring`. Plex: to plakater i riktig rekkefølge med episode og årstall, trykk åpner
`plex://`-lenken. Strømkortet borte. Ingen `NaN` eller `undefined`.
