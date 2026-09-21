# ki-cards 5.46.0

## family-status-card: serverbyttet virker, og navnet alene kan åpne menyen

**Retting — trykk på Strömstad eller Toten gjorde ingenting.** Kortet byttet server med
`location.href = "homeassistant://…"`. Inne i appens nettleservindu blir en slik endring stille
ignorert. Home Assistant selv åpner en url-handling — `tap_action: url`, slik mushroom-kortet ditt
gjør — med `window.open`, og det er **den** appen fanger opp og tolker som «bytt server». Kortet
bruker nå `window.open`, akkurat som HA.

**Ny plassering: `server_plass: navn`.** Bare navnet, ingen servernavn noe sted — og et trykk på
navnet åpner servermenyen. De to andre er uendret:

```yaml
server_plass: tittel   # «Oslo ▾» erstatter hilsenen
server_plass: under    # hilsenen står, «Oslo ▾» på linja under er knappen
server_plass: navn     # bare hilsenen/navnet med ▾, trykk åpner menyen
greeting: "{name}"     # for bare fornavnet, uten «Hei»
```

Pila står etter navnet også i den nye varianten, så det synes at det kan trykkes. Menyen merker
fortsatt serveren du står på med hake, selv om navnet ikke vises. Valget ligger i Servere-panelet
i editoren som «Ikke vist – trykk på navnet åpner menyen».

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Logikken er kjørt for
seg: `navn` med `greeting: "{name}"` gir «Sebastian» stort, lar den store linja åpne menyen og
beholder underteksten; `tittel` åpner fra den store linja, `under` gjør det ikke. Byttet går nå
gjennom `window.open(url)`, og `location.href` er borte fra kortet.
