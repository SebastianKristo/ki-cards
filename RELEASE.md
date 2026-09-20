# ki-cards 5.24.0

## Popupen i family-status-card er bygget om

Bryterne hoppet: den aktive knappen fikk bakgrunn, den andre mistet den, uten noe imellom.
Nå ligger det en glidende pille i sporet, med samme oppførsel som i `ki-tabs-card`.

**Dra eller trykk.** Pilla følger fingeren mellom Hjemme og Borte, og mellom Våken og Sover.
Slipper du mellom dem, går den til den nærmeste, og det valget settes — akkurat som et trykk
ville gjort. Trykk virker som før; et dra ender i et klikk på knappen under fingeren, og det
klikket sperres i 400 ms, ellers ville det satt tilbake verdien du nettopp dro bort fra.

**Bevegelsen.** Fingeren ned: pilla klemmes flat. Dra: den strekker seg i fartsretningen. Slipp:
den spretter på plass. Klemmen ligger på `::before`, ikke på pilla selv — pilla eier transformen
til plasseringen, og en skalering på samme element ville overskrevet den.

De to valgene er alltid like brede, så plassen regnes i prosent (`calc(50% - 8px)` og
`translateX(calc(100% + 6px))`). Ingen måling betyr ingenting som må rettes når skrifta byttes fra
reservefonten.

**Pilla venter ikke på Home Assistant.** Rett etter et valg stoler kortet på valget i stedet for
på entiteten i inntil tre sekunder. Uten det spratt pilla tilbake til utgangspunktet før den kom
fram igjen — nettopp det bevegelsen skal skjule.

**Ferdig-knappen** får sin egen sprett, og popupen lukkes 130 ms etter, slik at trykket rekker å
bli sett. Knappene trykkes inn (0,96) mens fingeren står på.

**Resten av redesignet:** popupen kommer opp med fjær i stedet for å tone inn, og lukkes med en
egen utgang i stedet for å forsvinne momentant. Avataren faller på plass i en farget ring som
følger tilstanden — aktivfargen hjemme, lilla når personen sover, dempet når hen er borte. Under
navnet står tilstanden i klartekst («Hjemme · Våken»), og et svakt skjær i aktivfargen ligger øverst
i popupen. Farger, ikoner og etiketter styres av de samme feltene som før.

### Kontrollert

`node --check` og begge byggesjekkene (`verifiser-styles`, `verifiser-kort`) kjørt — 110 kort leser
styles, 59 kort bygges med hass. Avataren henger utenfor popupen, så skjæret er klippet med egen
`border-radius` i toppen i stedet for `overflow:hidden` på dialogen, som ville skåret av hodet.
`prefers-reduced-motion` slår av både fjærene, sprettene og glidningen.

Ingen andre kort er rørt.
