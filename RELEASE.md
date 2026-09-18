# ki-cards 3.95.0

## Nytt kort: `ki-server-card` — hele serverpopupen i ett kort

Fem runder med sammensatte kort ble dårligere for hver gang. Årsaken var metoden, ikke
detaljene: åtte korttyper med hver sin stil, limt sammen i YAML, kan ikke bli et
helhetlig design. Her eier ett kort alt, så formspråket er ett stykke arbeid.

Popupen er fra 1037 linjer YAML til 107.

### Fanene viser hvor problemet er

Hver fane har en prikk: grønn når alt er friskt, gul ved advarsel, rød og pulserende når
noe er nede. Helsen regnes ut for alle fire uansett hvilken som er åpen, så **du ser
hvilken fane problemet ligger i uten å åpne den**.

Unraid har åtte sjekker, UniFi én per enhet pluss latens, Proxmox fire pluss hver
container og maskin, nedlasting fire.

### Heroen

Grafen ligger **bak** tallet, ikke ved siden av. Det er det som gjør at et stort tall og
en tidsserie får plass på samme flate uten å slåss om oppmerksomheten. Kortet måler selv
hvert femtende sekund og holder et kvarter tilbake, med egen serie per fane.

Øverst: ikon i domenets farge, hva det er, tilstanden i klartekst, og en pille til høyre
når noe feiler. Nederst det ene tallet som betyr mest — array-bruk, klienter, node-CPU,
nedlastingsfart.

### Innholdet

* **Tett tallrutenett**, fire per rad, med stolpe og terskler. 18 tall i Unraid-fanen,
  13 i Proxmox.
* **Lister** over enheter, containere og maskiner med prikk, navn og nøkkeltall på
  høyre side. Trykk veksler containere, eller åpner more-info.
* **Knapper** i domenets farge, med bekreftelse der det trengs. Node-avstenging er rød.
* **Søk** i Unraid-containerne.
* **Tannhjul** for oppsettet: hvilke prefikser kortet bruker, og versjonsnumrene.

### Alt finnes automatisk

UniFi-enhetene (par av `device_tracker` og en uptime-sensor, så telefonene faller
utenfor), Proxmox-containerne og -maskinene, Unraids containere, disker og delinger.
`navn_kort` gir penere navn, ellers utledes de fra entitetens eget navn.

`_2`-etterfikset på Dream Machine Pro og portantallet på Treets finnes ved å se hvilke
entiteter som faktisk eksisterer.

### Testet

Alle fem faner tegnet mot et fullt datasett: 6 UniFi-enheter, 11 containere, 4 Proxmox-
containere, 2 maskiner, 5 disker, 5 delinger, 5 lagringsområder. Interaksjonene
kontrollert: containerveksling, VM-knapper, oppdateringsknapp, node-avstenging med
bekreftelse, søk med og uten treff, fanebytte og tannhjul. Og med tom
entitetsliste — kortet tegner fanene og krasjer ikke.
