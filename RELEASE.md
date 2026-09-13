# ki-cards 3.18.0

## `ki-ruter-card` 2.0.0

Kortet er skrevet om fra bunnen. 950 linjer er blitt til 276, og oppsettet er enklere.

```yaml
type: custom:ki-ruter-card
tittel: Ruter
visning: valgt            # valgt = holdeplassvelger øverst, alle = alle tavlene under hverandre
maks: 5                   # avganger per holdeplass
gange: 4                  # minutter å gå – avganger du ikke rekker tones ned
stops:
  - entity: sensor.transport_majorstuen
    name: Majorstuen
    icon: mdi:subway-variant
    gange: 7              # overstyrer gangetiden for denne holdeplassen
disruptions:
  summary: sensor.ruter_disruption_summary
  lines:
    - entity: sensor.ruter_disruption_rut_line_1
      name: '1'
```

* **Gangetid per holdeplass.** Avganger du ikke rekker fram til, tones ned i stedet for å
  fjernes — du ser fortsatt at de går.
* **Nedtellingen går hvert tiende sekund** i kortet selv, uten å vente på at Home
  Assistant sender ny tilstand. Timeren stoppes i `disconnectedCallback`.
* **Transportmiddel gjettes** fra `transport_mode`, så fra ikonet du har satt, og til
  slutt fra linjenummeret: 1–6 er T-bane, 11–19 trikk, resten buss. Hver modus har sin
  farge og sitt ikon.
* **Avvik fra Ruter** vises som en rad med linjeknapper der antall aktive avvik står som
  et merke; trykk åpner more-info.
* Leser både `route`/`due_at` og de nummererte `route_1…12`, og faller tilbake på
  sensorens egen tilstand og `next_due_in` for den første avgangen.

Den gamle 1.0.0-fila er erstattet. Entitets-ID-er og korttypen er uendret, så
dashbordene trenger ingen endring — men se over konfigurasjonen din, siden nøklene er
færre nå.
