# ki-cards 5.22.0

## Glødefeltet kan slås av, og pilla er blitt glass

**Skjæret øverst i kortet** har hatt en bryter hele tiden, men den sto ikke i den visuelle
editoren — og i `enkel`-visningen virket den ikke i det hele tatt, fordi `--glod:0` bare ble
skrevet på den vanlige kortflaten. Begge deler er rettet:

```yaml
type: custom:ki-strompris-card
bakgrunn_glod: false     # fjerner det fargede skjæret
```

**Liquid glass på pilla.** Pilla bak «I dag / I morgen» er nå farget glass: gjennomskinnelig
toning av `--active-big`, lys kant øverst og uskarphet bak, så rada under skinner svakt gjennom.
Ved bytte flyter den — border-radius bølger seg gjennom bevegelsen mens et lysstrøk sveiper over
— og legger seg rund igjen.

Bevegelsen ligger i `border-radius` og lys, aldri i `transform`. Basen plasserer pilla med
`translateX(var(--x))`, så en animasjon på samme egenskap ville overstyrt plasseringen, og pilla
hadde hoppet tilbake til start midt i glidningen. `glass: false` gir flatt fyll som før.

**Dra begge veier.** «I morgen» er dempet før morgendagens priser er klare, men den har alltid
kunnet trykkes — kortet svarer da at prisene kommer rundt kl. 13. Dra var likevel sperret mot den,
så de to gestene gjorde forskjellige ting. `KI.pillefaner` godtar nå `av: false` for «ingen
sperret fane», og strømpriskortet bruker det. Pilla kan dras fra I dag til I morgen og tilbake,
og slipper du mellom dem, går den til nærmeste.

### Kontrollert

`node --check` og begge byggesjekkene (`verifiser-styles`, `verifiser-kort`) kjørt — 110 kort
leser styles, 59 kort bygges med hass. `av: false` er en ren utvidelse: uten feltet er oppførselen
som før (`tom`), og strømpriskortet er det eneste kortet som sender `av` i det hele tatt — de sju
andre faneradene er urørt. Glassanimasjonen startes på nytt ved hvert bytte (klassen fjernes,
layouten leses, klassen settes), så et raskt dobbeltbytte gir to bevegelser og ikke én.

Nye felt i editoren: **Farget skjær øverst i kortet** og **Glasseffekt på pilla ved fanebytte**.
