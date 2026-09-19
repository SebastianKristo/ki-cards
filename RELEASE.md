# ki-cards 4.19.0

## `ki-rom-card`: mellomrom nederst når rommet har få seksjoner

Et rom uten media, klima eller gardiner gir et kort på noen få rader. I en popup står det
da og flyter midt på skjermen i stedet for å begynne øverst.

Mangler én eller flere av de åtte seksjonene — header, gardiner, scener, lys, enheter,
klima, media, sensorer — legges det nå et mellomrom på 200 px nederst, som skyver
innholdet opp.

Har rommet alle åtte, er kortet høyt nok i seg selv, og mellomrommet blir som før.

### Den teller kort, ikke innstillinger

Et rom kan ha «Vis media» på uten å ha en eneste høyttaler. Da er kortet like kort som om
seksjonen var av, og det er høyden som avgjør hvordan det ser ut — ikke hva som står i
konfigurasjonen. Derfor telles seksjonene som faktisk **ga et kort**.

### Styres selv

```yaml
bunn_gap: 300   # egen høyde
bunn_gap: 0     # av, uansett hvor få seksjoner rommet har
```

Kontrollert for null til åtte seksjoner, og med `bunn_gap` satt til 0, 50 og 300.

---

# ki-cards 4.18.0

Editoren i `ki-hjem-card` slettet `hjem.stov`: «Vis Hjem-fanen» skrev `undefined` på veien
`hjem`, som tok hele objektet. Og skjemaet ble bygget på nytt ved hvert tilstandsbytte, som
er grunnen til at `#alarm::laser` ble lagret som `#alarm::lase`.
