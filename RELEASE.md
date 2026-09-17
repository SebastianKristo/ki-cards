# ki-cards 3.84.0

## Nytt kort: `ki-status-card`

Toppkortet i hver fane, i samme form som heroen i søvn- og klimakortet: rundt ikonfelt, én
linje som sier hvordan det står, og nøkkeltallene under.

```yaml
type: custom:ki-status-card
navn: Unraid
ok_tekst: Alt friskt
sjekker:
  - { entity: binary_sensor.parity_valid, ok: 'on', feil: Pariteten er ugyldig, alvor: rod }
  - { entity: sensor.varsler, over: 0, feil: '{verdi} varsler' }
tall:
  - { navn: CPU, entity: sensor.cpu, enhet: ' %', desimaler: 0 }
```

Kortet gjør sjekkene og sier hva som feiler — og bare da. Én feil får hele linja
(«Pariteten er ugyldig»), flere blir oppsummert med detaljene under («3 ting krever
oppmerksomhet»). Kortet blir oransje ved advarsel og rødt ved `alvor: rod`, der ikonet
også pulserer.

To ting jeg passet på. **Utilgjengelige entiteter regnes ikke som feil** — vi vet rett og
slett ikke, og et falskt rødt kort er verre enn ingenting. Og tallene krever at hele
strengen er et tall: `parseFloat` godtok «7.2.1-beta» som 7,2, så et versjonsnummer ble
vist som et måltall.

## Server-popupen bygget om

Fire faner uten nøsting: **Nettverk, Unraid, Proxmox, Nedlasting**. Den gamle hadde tre
nivåer faner og tolv underfaner.

Hver fane er bygget i den rekkefølgen den brukes:

1. **Statuskort** — er alt friskt, og hva feiler om noe gjør det. 7 til 12 sjekker per
   fane, pluss fire nøkkeltall.
2. **Handlinger** — velgere, brytere og containerlista.
3. **Detaljer** — alle tallene, under en «Detaljer»-seksjon nederst.

Paritetssjekkens fem tall vises bare mens den kjører. Resten av tiden er de støy.

Alt innholdet fra den gamle popupen er med. 114 entiteter, alle fra din egen
konfigurasjon — ingen er oppdiktet, og prefiksene kortene søker på er kontrollert.
