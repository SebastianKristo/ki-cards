# ki-cards 8.99.6

Bygget oppå 8.99.5 fra GitHub.

## ki-fjernkontroll-card: egne handlinger for volum og demping

Volum opp, volum ned og demping kan overstyres med egne handlinger — for eksempel når Apple TV-en styres med
fjernkontrollen, men volumet sitter i TV-en:

```yaml
volum:
  opp: switch.tcl_google_tv_series_volume_up
  ned: switch.tcl_google_tv_series_volume_down
  demp: button.tcl_google_tv_series_button_mute_toggle
```

- En **entitet** kjøres «på»: knapper trykkes (`button.press`), skript og scener startes, og alt annet — brytere,
  `input_boolean` — slås på (`homeassistant.turn_on`). Bare «på», aldri av: volumbryterne i TV-en er momentane.
- En **full handling** (`action: perform-action`, `perform_action: …`) kjøres som den er.
- Holder du inne volum opp eller ned, gjentas handlingen tre ganger i sekundet, som før.
- Uten `volum:` er alt som før: volum går til fjernkontrollen, demping til mediaspilleren.
- I editoren ligger feltene under «Egne volumhandlinger».

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med dine tre entiteter: volum opp slår på `switch…volume_up` (og gjentar
mens du holder), volum ned slår på `switch…volume_down`, demp trykker `button…mute_toggle`. Uten `volum:` går volum
til `remote.send_command` og demp til `media_player.volume_mute` som før.
