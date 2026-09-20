# ki-cards 5.16.1

## Lagring fra kortdialogen kom ikke tilbake til fanen

Redigerte du vertical-stacken og trykket Lagre, skjedde ingenting i `ki-tabs-card`.

`hui-dialog-edit-card` har byttet API mellom Home Assistant-versjoner. Eldre kaller
`saveCardConfig(kort)`; nyere kaller `saveConfig(heleLovelaceKonfigurasjonen)` og finner
kortet via `path`. Jeg ga den bare den første.

Dialogen får nå en liten konstruert konfigurasjon der kortet ligger på `[0, 0]`, og vi
plukker det ut derfra igjen. Da virker begge veier, uten at vi må vite hvilken
HA-versjon som kjører — og uten å måtte rette dette på nytt ved neste oppdatering.

Kommer det noe uventet tilbake, lagrer vi ingenting i stedet for å slette kortet.

### Kontrollert

Dialogen får `cardConfig`, `path`, en konstruert `lovelaceConfig` og begge
lagringsfunksjonene. Begge API-ene lagrer riktig kort tilbake i fanen. En konfigurasjon
uten `views` gir ingen lagring.

---

# ki-cards 5.16.0

Mastermodus samler til hovedbryteren når enheten har en; KI Energi er fortsatt unntatt.
