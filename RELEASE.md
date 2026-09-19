# ki-cards 4.24.0

## `family-status-card` finner sonene selv

Hver sone måtte listes opp i `locations:`. Glemte du en, fikk personen
standardikonet — **et fly** — mens hun sto på skolen.

Kortet leser nå alle `zone.*` fra Home Assistant og bruker **sonens eget ikon**. Sonene
har allerede både navn og ikon; det var ingen grunn til å skrive dem inn en gang til.

### `locations:` er nå overstyringer

Din `zone.toten` med traktor vinner fortsatt over sonens eget låveikon. Det du har satt
opp beholdes uendret — oppdagelsen fyller bare på med resten.

Det betyr at du kan korte ned lista til de sonene der du vil ha et annet ikon eller en
annen farge enn sonen selv har, og la resten komme av seg selv.

### Detaljer

* `zone.home` utelates — hjemme har sin egen `home_icon`.
* En sone uten ikon får `mdi:map-marker`, ikke flyet. Personen er på et **kjent** sted,
  og et fly sier det motsatte.
* Fargen på oppdagede soner er `--blue`; `zone_color:` endrer den for alle.
* `auto_zones: false` slår oppdagelsen av og gir den gamle oppførselen.

### Kontrollert

Med `zone.toten` satt opp: traktoren vinner, og skole, treningssenter og en sone uten
ikon kommer med. Uten oppsett: alle fire med sine egne ikoner. `auto_zones: false` gir
bare den ene fra YAML-en. `zone.home` er aldri med, og ingenting annet enn `zone.*`
plukkes opp.

---

# ki-cards 4.23.0

`ki-varsling-card` tar også varslene fra KI Energi, med egen filtrering og uten
mastermodus der alle bryterne ligger på én enhet.
