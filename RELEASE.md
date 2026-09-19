# ki-cards 5.6.0

## Nytt kort: `ki-robot-card`

Animert robotklipper eller robotstøvsuger, sett ovenfra.

**Klipper:** roboten kjører i baner og etterlater et lysere, nyklippet spor. Posisjonen i
banemønsteret følger fremdriften. I dokken lyser ladestasjonen, RTK-antennen pulserer og
lynet blinker når den lader.

**Støvsuger:** gulvet med sofa og teppe, sidebørsten snurrer, og støvkorn forsvinner i
sporet.

Felles: pause fryser roboten, «på vei hjem» viser pil mot dokken, og feil gir rødt blink
med feilmeldingen. `varsel` kan peke på en binærsensor som gir et rødt varsel med egen
tekst — for eksempel tom vanntank.

### Forhåndsvisningen var tom

`getStubConfig` ga `{ modell: "klipper" }`, men `setConfig` krever en entitet og kastet
«Velg robot-entiteten». Kortet ville derfor stått tomt i kortvelgeren.

Byggeskrittet fanget det: kortantallet ble stående på 53 i stedet for å gå til 54.

Stubben tar nå imot `hass` og velger en robot som faktisk finnes hos deg — første
`lawn_mower.` eller `vacuum.` — og faller tilbake på et navn når ingen finnes.

### Kontrollert

Klipperen i fem tilstander: klipper, pause, på vei hjem, i dokken med lading, og feil.
Støvsugeren i tre: suger, dokket og med varsel. Alle tegner uten å kaste. Stubben gir
`{modell: stovsuger, entity: vacuum.rolf}` når det er den roboten som finnes.

Kortet fikk merkeikon og README-rad. Bundelen er nå 54 kort.

---

# ki-cards 5.5.0

`ki-tesla-card` med vinduer på gløtt; låsrettelsen båret over igjen.
