# ki-cards 5.14.0

## `ki-utelys-card` oppdatert

247 linjer endret. Scenen er bygget opp i fire lag i stedet for ett: stjerner, bakke,
selve scenen og en skygge over.

Vinduene i huset er nå egne elementer som toner inn om kvelden, i stedet for å være
tegnet inn i husflaten.

Tilstandsklassene er tydeligere: `uk kveld paa` i skumringen, `uk natt kveld paa` når det
er mørkt, og rent `uk` midt på dagen. Det gjør det lettere å style scenen videre uten å
røre koden.

### Kontrollert

Seks tidspunkter gjennom døgnet gir riktige klasser. Alle fire lagene tegnes, og
vinduene er der. Kortet tåler at KI Utelys mangler, og at ingen entiteter finnes.

---

# ki-cards 5.13.0

Nytt kort `ki-utelys-card` med sola plassert etter asimut og solhøyde.
