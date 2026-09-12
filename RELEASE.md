## Nytt

**ki-rom-card 1.12.0**
- Scener-raden plukker nå opp lysscenene fra [KI Lys](https://github.com/SebastianKristo/ki-lys) automatisk. Kortet finner `sensor.<rom>_lys_oversikt` for rommene det viser, og legger knappene først i raden – foran skriptene og scenene du har fra før
- `lysscener: false` slår det av
- Sceneknapper kan nå være `button`-entiteter, ikke bare `script` og `scene`

**ki-rom-card 1.11.0**
- Bryter og effektsensor pares mot samme fysiske enhet i enhetsregisteret, ikke bare på navn. Ligger flere sensorer på enheten, velges den som måler effekt nå, og alt i kWh forkastes
