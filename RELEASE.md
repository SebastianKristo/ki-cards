# ki-cards 3.57.0

## `ki-kamera-card` 1.10.0: luft rundt kortet

Nytt valg **`luft`**. I en panelvisning gir Home Assistant ingen padding, og da lå
kameraene klemt helt ut i skjermkanten.

```yaml
luft: 12          # px
luft: "0 14px"    # eller en hvilken som helst CSS-padding
```

Et rent tall blir piksler, alt annet brukes som det står. Den loddrette lufta trekkes
automatisk fra høydeberegningen, så `fill_screen` fortsatt treffer skjermhøyden.

En felle underveis: jeg brukte først `parseFloat` for å avgjøre om verdien var et tall,
og den godtar alt som *begynner* med et tall — så `0 14px` ble tolket som `0`. Nå
sjekkes hele strengen.

## Om panelvisning

En panelvisning viser bare ett kort. Har du flere, får du advarselen «en panelvisning kan
bare vise 1 kort», og de øvrige forsvinner. Løsningen er en `vertical-stack` rundt dem —
se `examples/kamera-dashboard.yaml`, der kameraet og Tilbake-knappen ligger i samme
stabel. Knappen har fått `z-index: 5`, siden kortet ellers dekker den.
