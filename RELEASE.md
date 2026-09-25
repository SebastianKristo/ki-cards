# ki-cards 5.80.0

## ki-veggpanel-card 1.6.0: nattmodus synes

Mens `switch.nattmodus` er på, er det ikke lenger bare én scene-flis som sier det.

**Et animert nattkort øverst i midten.** Nattehimmel med stjerner som blinker, en måne som svever, skyer som
driver forbi og et stjerneskudd av og til. På kortet:

- «God natt» om kvelden og natta, ellers «Nattmodus er på»
- når nattmodus ble slått på, og når vekkingen går (`natt.vekking`)
- om døra er låst, alarmen, og hvor mange lys som står på — grønt når alt er i orden, gult når noe står på
- nattens handlinger fra `natt.handlinger` (som «Alt lys av») og **Slå av**
- langt trykk åpner nattmodus-bryteren

**Pille i toppstripa:** «Nattmodus» fylt med aktivfargen, først i rekka.

**Dashbordet ordner seg om natta:** nattkortet legger seg øverst, og kort du ikke trenger om natta, legges
bort så lenge — **Nytt i Plex** som standard (`natt.skjul:` velger andre). Når nattmodus slås av, er alt
tilbake som før.

Ingen nye felt trengs: kortet bruker `natt.entity`, `natt.vekking` og `natt.handlinger` du allerede har.
`natt.kort: false` slår det av, og `natt.kort_plass: venstre` legger det øverst til venstre. Nattkortet har
sin egen nattehimmel; resten av panelet beholder dashbordets farger.

### Kontrollert

Begge byggesjekkene kjørt. Veggpanelet er kjørt med nattmodus på: nattkortet øverst i midten med tittel,
«på siden … · vekking …», «Låst | Natt | 1 lys på», 22 stjerner, knappene «Alt lys av» og «Slå av»,
Nattmodus-pillen i toppen og Plex skjult. Slått av: kortet borte og Plex tilbake. Ingen `NaN` eller
`undefined`. Bygget oppå 5.79.1 fra GitHub.
