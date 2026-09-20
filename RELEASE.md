# ki-cards 5.17.1

## Lagring fra kortdialogen, tredje forsøk

Konsollsjekken viste at alt var på plass: editoren, kortrada, blyanten og dialogen. Da
sto det igjen ett sted feilen kunne ligge — uthentingen av kortet etter lagring.

Jeg lette på `views[0].cards[0]`, der jeg selv la det. Men Home Assistant
**normaliserer visningen** før den sender den tilbake, og kortet kan havne under
`sections` i stedet.

Nå leter vi etter det første elementet i en `cards`-liste, uansett hvor i strukturen den
ligger.

### En feil testen fanget underveis

Første forsøk lette etter det første objektet med en `type`. En visning kan selv ha
`type: "sections"` — og da ble visningen forvekslet med kortet, og hele dashbordet
havnet inne i fanen.

Derfor ser vi nå etter elementer i en `cards`-liste, ikke bare etter `type`.

### Kontrollert

Fem former: kortet på `views[0].cards[0]`, under `sections`, i en visning med
`type: "sections"`, et tomt objekt og en visning uten kort. De tre første lagrer riktig
kort; de to siste lagrer ingenting i stedet for å slette.

---

# ki-cards 5.17.0

`ki-utelys-card` forklarer selv hva som skjer når statusen mangler.
