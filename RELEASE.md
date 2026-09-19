# ki-cards 5.1.0

## `ki-tesla-card` oppdatert

Erstattet med den nye fila. 142 linjer endret.

### Tydeligere biltegning

Lykter som lyser opp når bilen kjører eller står ulåst, røde baklys, vinduer, speil,
dørlinjer, håndtak, kamera og skulderlinje. Sentrykameraet har fått sitt eget blinkende
lys.

### Frunk og bagasjerom har fått ekte standardentiteter

`switch.tesla_model_y_car_trunk_front` og `switch.tesla_model_y_car_trunk_rear`. Før var
frunk uten standard og bagasjerommet pekte på `cover.folkevogn_trunk`.

Autooppdagelsen tar nå også `switch`-domenet for frunk, ikke bare `cover` — Tesla-brua
gir dem som brytere.

### Lading utledes fra tre kilder

Ladestatusen, laderbryteren, **eller** en effekt over 0,3 kW. Det siste er verdt å vite
om: viser ladeeffekten 2,3 kW mens ladestatusen sier «Stopped», regnes bilen som ladende.
Det er riktig — det er effekten som forteller hva som faktisk skjer.

### Kontrollert

Seks tilstander mot de nye standardnavnene: står stille på 0 kW, lader på 2,3 kW, ulåst,
bagasjerom åpent, frunk åpen og defrost. Alle gir riktig klasse på scenen, og kortet
tåler at ingen entiteter finnes.

---

# ki-cards 5.0.0

Fire kort fjernet: `ki-klima-card`, `ki-energi-card`, `ki-stromregning-card` og
`ki-vaer-card`.
