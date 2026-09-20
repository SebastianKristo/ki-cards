# ki-cards 5.26.0

## Årlig strømregning i ki-strom-detaljer-card

Ny visning: `vis: aar`.

```yaml
type: custom:ki-strom-detaljer-card
vis: aar
```

Øverst året hittil, med avviket mot i fjor som merke, og tre brikker: i dag, denne uken og
måneden som går. Under er det to visninger, og knappen øverst til høyre bytter mellom dem:

- **Månedssøyler** for hele året. Trykk på en måned, så står postene under — strøm, nettleie,
  avgifter, strømstøtte og Norgespris — med fradragene i grønt og forbruket i kWh nederst.
- **Kalender** med én rute per døgn. Kronene står i ruta, og bakgrunnen blir sterkere jo dyrere
  døgnet var, så måneden leses som et varmekart. Trykk på en dag for postene for akkurat det
  døgnet; pilene blar bakover, og fram er sperret der måneden som går slutter.

Kortet regner ingenting selv. Tallene kommer fra `ki_enhetsforbruk` 1.1.0, som fører boka av
Strømkalkulators månedssensorer. Oversiktssensoren finnes av seg selv på markørene sine
(`integrasjon: ki_enhetsforbruk`, `type: regning`), siden entitets-id-en følger navnet du ga
regningen. Vil du peke den ut selv:

```yaml
sensorer:
  regning: sensor.stromregning_stromregning_oversikt
```

Blar du lenger bakover enn de 95 døgnene sensoren bærer, henter kortet måneden med tjenesten
`ki_enhetsforbruk.historikk` og beholder svaret. Mangler integrasjonen, sier kortet fra i klartekst
i stedet for å stå tomt.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Årsvisningen er i
tillegg tegnet med oppdiktede tall: 42 ruter i kalenderen med 12 utenfor måneden for september
2026 (som begynner på en tirsdag), dagvalg, månedsvalg og bakoverbla uten data — ingen `NaN` og
ingen tomme beløp noe sted. Kortet tåler en Home Assistant uten tjenesten: da blir eldre måneder
bare stående tomme.

Ingen andre kort er rørt.
