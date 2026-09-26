# ki-cards 9.0.1

- **ki-floating-navbar**: samme størrelse som den gamle navbaren. «Standard» bruker config; størrelsene er nå Liten 8/20, Middels 12/24 (klassisk), Stor 16/28 og Ekstra stor 20/32. Gamle størrelsesvalg ignoreres, så navbaren går tilbake til config-utseendet.
- **ki-floating-navbar**: «...»-menyen kan redigeres i «Tilpass navbar» – «I navbaren», «Bak de tre prikkene», «Skjult» og «Ny knapp» (til navbaren eller menyen). Virker på dots-knappen fra config.
- **family-status-card**: serverpila skjules når navnet ikke får plass, så navnet vises i full lengde.

# ki-cards 9.0.0

Bygget oppå 8.99.8. Alt kan nå tilpasses fra dashbordet, per bruker. Valgene lagres i Home Assistant
(`frontend/set_user_data`) og følger brukeren til alle enheter. Config er standarden; brukerens valg legges over.

## Ny: ki-floating-navbar
Lik `mysmart-floating-navbar` (samme config og utseende – bytt bare `type`), med:
- **Glasslinse** som glir til aktiv knapp og kan **dras med fingeren** mellom knappene (slipp = åpne).
- **Tilpass navbar** (langt trykk): rekkefølge, skjul, flytt til «Mer», egne knapper (side, popup, lenke, bryter, mer-info),
  navn av/på, krymp ved scrolling, bredde og størrelse.
- **GUI-editor** for knapper, undermenyer, merker og stiler.
- Nye nøkler: `indicator`, `drag`, `customize`, `edit_entry`, `shrink_on_scroll`, `nav_id`; handlingene `toggle` og `more-info`.
- Setter `--kd-dokk-h` så Tilpass-panelene i andre kort legger seg rett over baren.

## ki-rom-card / ki-rom-tile-card: Tilpass rommet
Skjul/vis entiteter, velg temperatur- og fuktsensor (med søk – brukes også på romflisene), flytt/skjul/gi nytt navn til
seksjonene, og rediger scener (legg til scene/skript). Langt trykk = mer-info der det manglet. Rettet `enqueueBuild`-feil.

## ki-hjem-card: Tilpass Hjem (langt trykk på en fane)
Faner (rekkefølge, synlighet), rom per etasje, seksjoner, romflis-størrelse og klimaknapp, og **høyde/bredde på fanerada**.
Nye nøkler: `romkort`, `klimaknapp`, `fane_bredde`, `fane_hoyde`, `fane_rekkefolge`, `skjul`, `seksjoner`, `tilpass`, `tilpass_knapp`.

## ki-tabs-card
`fane_hoyde` (lav/middels/hoy/ekstra) og `fane_bredde` (standard/kompakt/full), «Tilpass faner» ved langt trykk, og pilla
strekkes som flytende glass når den dras.

## family-status-card: Tilpass
Oppsett (familie, sted, navn, under, kompakt), personer (vis/skjul/rekkefølge), bildestørrelse, merke, navn/sted/ring,
hilsen og dobbelttrykk. Nye nøkler: `layout`, `show_location`, `badge_style`, `ring_me`, `tilpass`.

### Kontrollert
`build.sh` med begge byggesjekkene (styles og kort). Hvert kort er kjørt i en testside med testdata og skjermbilder.
