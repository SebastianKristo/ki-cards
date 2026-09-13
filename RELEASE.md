# ki-cards 3.27.1

## Rullingen i `ki-sikkerhet-card` gikk ikke langt nok

To feil, én i hver retning.

**Ned:** tastaturet ble rullet inn med `scrollIntoView({ block: "nearest" })`, som gjør
minst mulig — den flytter så vidt nærmeste kant innenfor synsfeltet og stopper der.
Nederste tastrad ble liggende under kanten.

**Opp:** `block: "start"` på kortet lander der kortet begynner, men inne i en
bubble-card-popup ligger det en overskrift over, og kortet havnet delvis under den.

Begge deler regnes nå ut mot boksen som faktisk ruller. Den finnes ved å gå oppover fra
kortet, via `host` når `parentElement` tar slutt, til vi treffer et element med egen
`overflow-y` og mer innhold enn høyde — inne i en popup er det ikke vinduet.

* Ned: ruller nøyaktig så langt at hele tastaturet er synlig, med 16 px luft under.
* Opp: ruller til toppen av kortet med 16 px luft over, klemt til 0 om vi alt er nær toppen.

Ventetiden før målingen er økt fra 80 til 180 ms, så høyden har satt seg før vi regner —
måler vi mens boksen fortsatt vokser, blir avstanden for kort.

Finner vi ingen rulleboks, faller det tilbake på `scrollIntoView` med `end` og `start`
i stedet for `nearest`.
