# ki-cards 3.27.0

## `ki-vanning-card` 3.5.0: forbruksdelen skjuler seg uten vannmåler

Uten en måler er alle literne estimater regnet ut fra en standardrate. Kortet viste dem
likevel som «brukt i dag», med kostnad og stolpe, som om de var målt.

Forbruk-fanen og literblokken i Nå-fanen forsvinner nå når det ikke finnes noen måler.
Kortet ser etter, i tur og orden:

1. `har_flyt` fra KI Vanning 3.1 — felles måler eller en sone-måler
2. eldre versjoner: om noen sone i oversikten har `flow` satt
3. OpenSprinklers egen `sensor.<prefiks>_flow_rate`

Kan overstyres med `flyt: true` eller `flyt: false` i kortkonfigurasjonen.

Resten av kortet er uendret — soner, programmer og kjøretider virker som før, siden de
ikke er avhengige av en måler.
