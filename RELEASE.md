# ki-cards 5.52.0

## family-status-card: handlinger for trykk, dobbelttrykk og langt trykk på navnet

Hilsenen har fått tre gester, hver med sin egen handling — i samme form som ellers i Home Assistant:

```yaml
type: custom:family-status-card
greeting_tap_action:
  action: navigate
  navigation_path: /config
greeting_double_tap_action:
  action: perform-action
  perform_action: input_boolean.toggle
  target:
    entity_id: input_boolean.kiosk_mode
# greeting_hold_action: …
```

**I editoren** ligger de tre under **Hilsen**, med HAs eget handlingsvalg: naviger, utfør handling,
veksle, åpne URL, mer info eller ingenting. Der kan du endre dem senere uten å røre YAML.

**Dobbelttrykk koster ingenting når det ikke brukes.** Finnes det en handling på dobbelttrykk,
venter kortet 250 ms etter et trykk for å se om det kommer et til. Finnes det ingen, utføres
trykket med en gang — hvert trykk blir ikke tregere for en gest du ikke bruker.

**Servermenyen** ligger på en gest den også: `server_meny_med: tap | double_tap | hold | ingen`
(standard trykk). Den gesten åpner menyen og vinner over handlingen for den samme gesten. Vil du at
trykk skal til `/config` og likevel beholde menyen, flytter du den til langt trykk.

**De gamle feltene virker fortsatt** som reserve: `greeting_navigation_path` for trykk og
`greeting_hold_entity` for langt trykk. Editoren viser dem som handlinger, så du ser hva som gjelder.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Gestene er kjørt for seg:
uten dobbelttrykk navigerer trykket til `/config` med en gang; med dobbelttrykk venter et enkelt trykk
og navigerer etter 250 ms, mens to trykk kaller `input_boolean.toggle` på `input_boolean.kiosk_mode`
uten å navigere; langt trykk kjører sin egen handling og teller ikke som trykk; `greeting_hold_entity`
virker som før; servermenyen på trykk vinner over trykkhandlingen; og med menyen flyttet til langt
trykk navigerer trykket igjen.
