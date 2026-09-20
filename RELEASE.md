# ki-cards 5.13.0

## Nytt kort: `ki-utelys-card`

Animert himmel med huset under, i samme stil som `ki-tesla-card` og `ki-strom-card`.

* Himmelen skifter farge etter solhøyden: dag, gyllen time, skumring, natt med stjerner
* **Sola står der den faktisk er** — asimut gir plassering øst–vest, solhøyde gir høyde
  over horisonten
* Solbanen er tegnet som en stiplet bue, med horisonten som skille
* Utelyset ved inngangen og på verandaen tennes og kaster lys når lyset er på
* Vinduene lyser svakt om kvelden

Til venstre: status fra KI Utelys med begrunnelsen, når lyset tennes og slukkes neste
gang, og sol ned og opp.

Alle entiteter har standardverdier som peker på KI Utelys og sol-sensorene, så kortet
virker uten konfigurasjon.

### Uten KI Utelys installert

Kortet tegner himmelen og sola likevel, bare uten status og neste-tider. Da er det et
solkort — ikke en tom rute med feilmelding.

### Kontrollert

Seks tidspunkter gjennom døgnet: midt på dagen, gyllen time, skumring, natt, grålysning
og morgen. Alle tegner uten å kaste. Kortet tåler at KI Utelys mangler, og at ingen
entiteter finnes i det hele tatt.

Bundelen er nå 56 kort.

---

# ki-cards 5.12.1

Avkrysningen i varslingseditoren spratt tilbake fordi `ha-form` aldri fikk de nye
verdiene.
