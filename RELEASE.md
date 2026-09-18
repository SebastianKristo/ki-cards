# ki-cards 4.5.0

## `ki-server-card` 2.0.0: bygget etter dashbordet, ikke etter gjetning

Jeg leste dashbordet ditt, og de tre popupene du peker på har alle **samme form**: ett
kort og en gap-card, ingen sammensatt YAML.

```yaml
- type: custom:ki-planter-pro-card
  scene: true
  scene_hoyde: 200
```

Serverpopupen følger den formen nå — 111 linjer i stedet for tusen.

### Animert scene øverst

Et serverrom: rack med fire disker som blinker i **ulik takt** — samme takt ville sett ut
som ett lys, ikke fire disker som jobber hver for seg — vifte som snurrer når noden
jobber, og pakker som renner langs kabelen mot skyen når nettet er oppe.

Hver fane tenner sin del: Unraid og Proxmox får viften, UniFi og Nedlasting får pakkene.
`scene: false` slår den av, `scene_hoyde` endrer høyden.

### Flisene har dashbordets egne mål

Hentet rett fra `universal_sensor_ny`: 160 px høy, rundt ikonfelt på 52 px med 30 px
ikon, verdien i `2em/300` med enheten i 14 px, og navnet under. To per rad.

Det er den samme flisen vanningspopupen bruker — nå tegnet av kortet i stedet for av
button-card, så den følger med automatisk for alt som oppdages.

`fliser: false` gir de brede radene fra 1.1.0 i stedet.

### Testet

Alle fire fanene: scene tegnet, fire diskblink med ulik forsinkelse, viften bare på
Unraid og Proxmox, pakkene bare på UniFi og Nedlasting. Flisene måler 160 px med 2em
verdi, og første flis viser «12 % / CPU» med riktig ikon.

### Om backticks

Femte gang i dag skrev jeg backticks i en CSS-kommentar og lukket template-strengen.
`node --check` fanget det denne gangen. Byggeskrittet fra 3.98.1 fanger det uansett.
