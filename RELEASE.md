# ki-cards 5.36.0

## Periodevelgeren i «Spotpris mot Norgespris» er samme fanerad som resten

`vis: sammenligning` hadde sin egen velger: fire like brede ruter i et fylt spor, med en dempet
grå markering på den valgte. Den er byttet ut med fanerada kortet bruker ellers — tynn ring rundt,
rada like bred som fanene, og den valgte fylt med `--active-big` og mørk tekst.

Den står samme sted som før, rett under overskriften og over stolpene. Bare utseendet er endret;
`I dag / Uke / Måned / År` gjør nøyaktig det samme, og resten av kortet er urørt.

Glidepilla følger med, siden rada nå er den samme som de andre: den glir mellom fanene, klemmes
når du legger fingeren på og spretter på plass.

Samtidig ryddet: den gamle `.faner`-regelen lå igjen i stilarket og kolliderte med den nye rada,
som ble lagt inn i 5.28.0 under samme navn. Den nyeste regelen vant, så velgeren i
sammenligningen sto allerede med halvt nytt utseende — en rad som var ment å være et rutenett.
Nå finnes det bare én fanerad i kortet.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. `vis: sammenligning`
tegner nå `.faner > .skinne` med de fire periodene, «Måned» merket med `valgt`, og ingen rester av
den gamle `aktiv`-klassen.
