# ki-cards 9.3.0

- **Ny: ki-lys-card** – «Lys v3» fra Claude Design med ekte data: Utelys-scene, tidene, Automatikk/Kveld/Morgen, utelamper, Sola og Innstillinger, pluss fanene Første etg / Andre etg / Lys på.
- **ki-person-card** er nå personarket fra Hjem-dashbordet (Tilstedeværelse: sone, mobil, soner i dag, søvn).
- **family-status-card**: trykk på et bilde gir samme hurtigpopup som i Hjem-dashbordet (Hjemme/Borte, Våken/Sover, Ferdig, «Mobil, soner og søvn ›»). `person_hash: '#personer'` åpner en bubble-card-popup i stedet for arket.
- **Tilpass** (familiekort og navbar) holder seg under statuslinja på iPhone. «Tilpass rommet»-linja er kompakt på mobil.
- KD-grunnmuren fra Hjem-dashbordet er med i bundelen (brukes av ki-lys-card og ki-person-card).

# ki-cards 9.2.0

- **Ny: ki-person-card** – popupen for en person, samme type som rom-toppkortet: status (Hjemme / Sover / Borte / sone), stedet stort, «siden 15:40», mobilbatteri som søyle, og under det «Soner i dag», «Mobil» (batteri, Wi-Fi/mobildata, skritt, distanse, sted) og «Søvn».
- **family-status-card**: trykk på en person åpner ki-person-card i et ark nederst (`person_popup: false` gir den gamle dialogen). Per person: `popup: {…}`, `sovn`, `mobil`, `farge`.
- **family-status-card**: ny profil **«Hjem»** (`layout: hjem`) – stedet som tittel med vær under, deg selv til høyre med stedsmerke og de andre personene under med navn og sted, som i det andre dashbordet. Velges i Tilpass.
- **ki-rom-hero-card**: grå bakgrunn og temperaturgraf for siste døgn i kortet. Fargen følger varme/lys, eller velg den selv under «Farge på grafen» i «Tilpass rommet» (`farge`, `graf: false`).
- **ki-rom-card**: «Tilpass rommet»-knappen nederst er fjernet – tannhjulet i toppkortet åpner redigeringen (`tilpass_knapp: true` gir knappen tilbake).

# ki-cards 9.1.0

- **Ny: ki-rom-hero-card** – toppkortet for et rom: romnavn, statuspille (varmer / lys på / holder / rolig), stor temperatur, fukt, spennet siste døgn, fuktsøyle og levende bakgrunn. Finner sensorer, termostat og lys selv ut fra området (`omrade: stue`).
- **ki-rom-card**: hero-kortet er nå toppen i hvert rom. Tannhjulet oppe til høyre åpner «Tilpass rommet». Brukerens valgte temperatur-/fuktsensor brukes. `topp: klassisk` gir den gamle toppen, `topp_hoyde` endrer høyden, `tilpass: false` gir romikonet tilbake i stedet for tannhjulet.
- Står hero-kortet alene, åpner tannhjulet termostaten (eller `ikon_tap_action`). `tannhjul: false` viser romikonet.

# ki-cards 9.0.2

- **ki-floating-navbar**: glasslinsen skjules når en popup (hash) er åpen – popupen ligger uansett over. `lens_popup: true` gir den gamle oppførselen.
- **family-status-card**: navnet får plassen først igjen. Blir det trangt, skjules serverpila, så krymper profilbildene (ned til 32 px, merkene følger med), og helt til slutt krympes/kortes teksten.

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
