# ki-cards 5.56.0

## ki-basseng-card 1.11.0: varmepumpa og hurtigknappene er med i kortet

Toppen av bassengpopupen var bygget av egne kort: to `conditional` med `button-card` for
varmepumpa, og et rutenett med fem ikonknapper uten navn. Nå er begge deler en del av
`ki-basseng-card`, i samme form som resten av kortet.

```yaml
type: custom:ki-basseng-card
varmepumpe: climate.basseng_bassengvarmepumpe
stillemodus: switch.baseng_basengvarmepumpe_stillemodus
hurtig:
  - entity: light.bassenglys
    navn: Lys
  - entity: switch.bassengpumpe
    navn: Pumpe
    ikon: mdi:pump
```

**Statuskortet for varmepumpa**, øverst:

- **varmer** — rød toning: «Varmer bassenget · 26,4° → 28°», med en merkelapp når stillemodus er på,
  og en stolpe som viser hvor nær målet vannet er
- **auto** — oransje advarsel: i auto kan den kjøle, og KI Basseng setter den tilbake til varme
- **av** — en stille linje med vanntemperaturen, så du ser det uten at det roper

Trykk åpner varmepumpa.

**Hurtigknappene** har fått navn under ikonet — før var det fem ikoner uten tekst. Fargen viser
tilstanden: aktivfargen når noe er på, rød når varmepumpa varmer, oransje når den står i auto,
stiplet kant når enheten ikke svarer. Trykk veksler, langt trykk åpner mer info, og begge gir
haptikk i appen. Ikonet følger tilstanden av seg selv for lys og varmepumpe; `ikon:` overstyrer.

Alle tre feltene ligger i den visuelle editoren. Hurtigknappene velges der som en liste; navn og ikon
satt i YAML tas vare på. Uten feltene er kortet nøyaktig som før.

Samtidig rettet i editoren: en faneliste fra YAML (`faner: [oversikt, sirkulasjon, …]`) ble gjort om
til `true` så snart noe ble endret i editoren. Den står nå.

`basseng-popup.yaml` viser popupen med alt samlet i kortet.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Toppen er i tillegg tegnet
med ditt oppsett i alle tilstandene: varme med «26,4° → 28°» og stillemodus, auto med advarsel og
oransje knapp, av med «Vannet er 24,2°», fem knapper i riktig tilstand (lys på, pumpe av, varme,
stille på, stikkontakten stiplet), statuskortet og knappene over fanerada, og kortet uten de nye
feltene helt uendret.
