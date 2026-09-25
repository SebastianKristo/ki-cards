# ki-cards 8.94.1

Bygget oppå 8.94.0 fra GitHub.

## Veggpanelet: bunnene står likt

Plex-kortet i midten sluttet 16 px høyere enn scenekortet til venstre og lyskortet til høyre. Under Plex lå den
tomme plassen for strømkortet (`strom: false`), og kolonnens avstand mellom kortene ble lagt til under den. Tomme
plasser — strøm av, ingen buss, ingen dekker — skjules nå helt, så kortet som vokser i hver kolonne går helt ned
og bunnene står på linje.

### Kontrollert

Begge byggesjekkene kjørt. Stilen har regelen for tomme plasser, og midtkolonnen er kjørt med innholdet som før.
