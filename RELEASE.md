# ki-cards 4.4.0

## Jeg leste dashbordet, og bygget serverpopupen av dine egne klosser

Til nå har jeg designet serverpopupen sju ganger uten å ha sett dashbordet — hvert
vedlegg kom fram tomt, og jeg fortsatte å gjette i stedet for å stoppe. Nå kom fila
gjennom.

M�nsteret er et helt annet enn det jeg har laget:

* `button-card` med `template: universal_sensor_ny`, **to per rad** i et vanlig `grid`
* `custom:mini-graph-card` som **stolpediagram**, `group_by: date`, med card_mod som gir
  den `--gray200`-bakgrunn, 14 px navn og 32 px verdi
* `simple-tabs` med den runde fanerada og `--active-big` på valgt

Det er nøyaktig formen vanningspopupen har. `examples/server-popup.yaml` følger den nå:
22 fliser og 6 grafer fordelt på fire faner, alle bygget av dine maler i stedet for mine
egne korttyper.

## `ki-server-card` 1.2.0: `bare_hero`

Kortet beholdes øverst i hver fane, men bare som **hero** — statuslinja med helsen og det
store tallet. `bare_hero: true` fjerner fanerada, tallene og listene, og `fane:` låser
hvilken den viser.

Uten det ville popupen hatt to fanerader og to sett med tall oppå hverandre — to design i
samme kort, som er akkurat det som gjorde de forrige forsøkene rotete.

Testet: fullt kort gir hero, fanerad, 8 rader og 2 lister. Med `bare_hero: true` gir det
hero og ingenting annet, og `fane:` treffer riktig hero i alle fire.
