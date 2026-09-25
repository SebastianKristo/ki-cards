# ki-cards 5.77.1

## ki-basseng-card 3.2.1: vannflisen kommer med en gang, og «Spart i dag» virker

- **Vannflisen lastet sakte.** Den lå i en `css-swipe-card`, som bygger kortene sine først
  når den har fått plass og hass, og i popupen tok det flere sekunder. Nå blar
  bassengkortet selv mellom de samme `universal_sensor_ny`-kortene, med prikkene fra
  css-swipe-card (`--gray400` aktiv, `--gray200` ellers). Kortene lages én gang og beholdes.
- **Trykk på «Spart i dag» viste ikke oppdelingen.** Den foldet seg ut langt nede, under
  «I dag», og noen utgaver av button-card sender ikke med egne nøkler i handlingen. Nå
  kjennes trykket igjen på kortet det kom fra, og oppdelingen legger seg rett under
  flisene og rulles fram. Det samme gjelder Spart-raden i «I dag».

---

# ki-cards 5.77.0

## ki-basseng-card 3.2.0: flisene er dashbordets egne kort

Flisene øverst på Oversikt lages nå med de samme kortene som i Strøm-dashbordet, i et
rutenett med to kolonner:

- **Venstre:** `css-swipe-card` (190 px, prikker `--gray400`/`--gray200`) med tre
  `button-card` med malen `universal_sensor_ny` og `size: big`: vann, ute og effekt nå.
- **Høyre:** ett `universal_sensor_ny`-kort med trykkmerke, «Spart i dag». Et trykk folder
  ut oppdelingen i bassengkortet.

Mangler css-swipe-card eller button-card, eller står `dashbordfliser: false`, brukes
kortets egne fliser som før.

---

# ki-cards 5.76.0

## ki-basseng-card 3.1.0: mer som resten av dashbordet

- **Setningene** («Vannet når 27° om ca 2 t 10 min …») tegnes nå av `ki-prosa-card`, det
  samme kortet som forsideteksten. Et trykk på en pille åpner verdien. Størrelsen settes
  med `prosa_storrelse:` (standard `1.2em`). Er ki-prosa-card ikke lastet, tegner
  bassengkortet setningen selv.
- **Flisene du blar i** er som `css-swipe-card` i Strøm-kortet: 190 px med prikkene. Aktiv
  prikk er `--gray400`, de andre `--gray200`, uten kant.
- **Temperaturvalgene** er kvadratiske som ladegrense-knappene i Tesla-kortet: 24 px
  hjørner, trykkmerket 36 × 3 px øverst og aktivfargen når verdien er valgt. Profilscenene
  har samme trykkmerke.

---

# ki-cards 5.75.0

## ki-basseng-card 3.0.0: nytt oppsett for bassengpopupen

Kombinasjonen av skissene A, B og C (og litt D), satt sammen av Tesla-, Strøm-, Innstillinger-
og Pult-kortene i dashbordet.

**Øverst på alle faner** står bassengscenen og hurtigknappene. Scenen viser bassenget fra
siden: bølgene og boblene går når pumpa går, viften snurrer og damp stiger når varmepumpa
varmer, lamellene ligger over vannet når taket er på, og det kommer måne ved nattsenking,
snø i vintermodus og lys i vannet når bassenglyset er på. Til venstre står modus, en pille
med varmestatus («Varmer · 26,3° → 27°»), temperaturen, målet og omsetningene. Knappene er
kvadratiske fliser med bare ikon (`hurtig_navn: true` viser navnene).

**Fanene** er Oversikt, Varme, Klor og Spreder, med Innstillinger bak tannhjulet.

- **Oversikt:**
  - To store fliser du blar i sidelengs: vann, ute og effekt, og spart i dag, spart i går og
    kostnad.
  - Én setning med verdiene i piller: «Vannet når 27° om ca 2 t 10 min. Pumpa går nå, og i
    natt står varmen av 23–04 og sparer ca 2 kroner.» Trykk på en pille åpner verdien.
  - «I dag» som liste: pumpet, omsetninger og spart. Spart folder ut oppdelingen.
  - Profilene som scener du ruller i (boost, spreder, eco, balansert, badeklar, ferie).
  - Automatikk, prisstyring og varmeprioritet som fargede rader. Klor blir oransje når det er
    på tide, og tar deg til Klor-fanen.
- **Varme:**
  - Varmepumpa (bryteren setter den i heat eller av) og effekten nå.
  - Forvalg for ønsket temperatur, 26–30° (`forvalg: [..]` for egne).
  - «Vannet er 26,3° og når 27° om ca 2 t 10 min, og det koster ca 4 kroner.»
  - Grafen med underfaner for temperatur, sirkulasjon og pris.
  - Nattsenkingen som lilla kort med bryter; trykk viser sammenligningen og innstillingene.
  - Pooltak og vintermodus som bilder med bryter.
- **Klor:**
  - Status øverst, oransje når det er på tide.
  - Navnene som fliser: trykk på den som la i. Det første navnet får den store flisen.
  - «Logg klortablett uten navn», og 1, 2 eller 3 stk.
  - Kalenderen, åpen til du lukker den. Velg en dag for å logge eller slette der.
  - Påminnelsen (intervallet), kalenderen det skrives til, og navnene.

**Eldre oppsett.** En `faner:`-liste skrevet for 2.x (uten `klor`) får Klor etter Varme, og
Sirkulasjon faller bort – den ligger under grafen på Varme nå, og styringen under
tannhjulet. Skriver du `klor` selv, gjelder lista som den står. Uten varmemodellen (KI
Basseng 1.2) er Sirkulasjon fortsatt en fane.

Tid og kostnad til målet krever KI Basseng 1.7. Med eldre integrasjon sier setningen bare
hva vannet er og hva målet er.

### Kontrollert

Begge byggesjekkene er kjørt. Alle fanene er tegnet i Chromium i telefonbredde, også i
vintermodus, uten faner, med en 2.x-liste og mot en integrasjon uten varmemodell.

---

# ki-cards 5.74.0

## ki-basseng-card 2.4.0: «Spart i dag» forklart, og fanerada ruller

**Spart i dag.** Trykk på cella, så folder oppdelingen seg ut under. Langt trykk åpner sensoren.

- **Uten KI mot med KI:** to stolper med hva dagen ville kostet og hva den kostet.
- **Færre pumpetimer:** «Pumpa gikk 2,4 t av 19,8 t · 13,9 kWh mindre».
- **Billigere timer:** «Pumpa betalte 0,62 mot snittet 0,91 kr/kWh».
- **Nattsenking** og **pooltaket:** anslag fra varmemodellen, i nøytral farge så de ikke
  blandes med det målte. Stenger taket ute mer sol enn det sparer, står det i oransje.
- **Nederst:** i går, denne måneden og totalt.

Krever KI Basseng 1.6. Med eldre integrasjon står bare det målte tallet, og en linje om å
oppdatere.

**Fanerada ruller, som i ki-tabs-card.** Får fanene plass, er det piller som før. Gjør de
ikke det (fire faner og tannhjulet i en smal popup), blir rada rullbar med tonede kanter,
og den valgte fanen rulles inn i midten. To ting stoppet rullingen før:

- **Rada krympet ikke.** Den kunne ikke bli smalere enn innholdet sitt, så den ble klippet
  i stedet for å rulle.
- **Fingeren på en fane rullet ikke.** Pillehjelperen satte `touch-action: none` på fanene
  for å kunne dra pilla, og fanene fyller hele rada. Nå tillates vannrett panorering.

På PC ruller hjulet rada sidelengs.

### Kontrollert

Begge byggesjekkene er kjørt. Oppdelingen er tegnet i Chromium med og uten KI Basseng 1.6.
I 330 px bredde er fanerada rullbar: 322 px innhold i 280 px, `touch-action` er `pan-x`,
og høyre kant er tonet. Spreder rulles inn i synet og venstre kant tones, og Oversikt ruller
tilbake til start.

---

# ki-cards 5.73.0

## ki-basseng-card 2.3.0: høydene tilbake, klor i kortet

**Høydene er som før 2.2.** Krympingen i 2.2 gjorde flisene, vannbildet, ringene og
hurtigknappene lavere. Det var ikke ønsket, så det laget med nedskalering er fjernet. Fra
2.2 står bare nattsenkingen igjen, med detaljene bak en knapp.

**Klor uten ark.** Arket som la seg over popupen, er borte. Klor logges der du er:

- **Oversikt:** Klor-flisa eller «Logg» i varselet folder ut et felt rett under flisene med
  «Hvem la i klor?». Trykk på et navn, så er det logget. Kvitteringen står et øyeblikk før
  feltet lukker seg. Antallet endres med − og +, og «Uten navn» logger uten person.
- **Varme:** klorlinja folder seg ut med de samme navneknappene og kalenderen under. Trykk på
  en dag først for å logge på den dagen («Hvem la i klor søn 20. sep.?»). Innslagene for
  dagen kan slettes med søppelbøtta.

### Kontrollert

Begge byggesjekkene er kjørt. Kortet er tegnet i Chromium med feltet åpent på Oversikt og
Varme. Trykk sender riktige kall:

- Ola på Oversikt gir `logg_klortablett` med `hvem: Ola`
- dag 20 og Ida på Varme gir `hvem: Ida` og `tidspunkt: 2026-09-20 12:00:00`

---

# ki-cards 5.72.0

## ki-basseng-card 2.2.0: mindre, klor-ark, vinter

For [KI Basseng 1.5](https://github.com/SebastianKristo/ki-basseng).

**Kompakt.** Kortet var for stort. Alt er krympet i ett lag med stiler, så det er lett å
justere:

- **Ringer:** 86 px, før 116.
- **Ikonfliser og panelikoner:** 36 px, før 46.
- **Luft:** paneler har 12 px, før 14.
- **Fliser:** 52 px høye, før 66.
- **Hurtigknapper:** 56 px høye, før kvadratiske.
- **Vannbildet:** 128 px, før 172.
- **Nattsenking:** viser vinduet og hva den sparer. Sammenligning, alternativer og
  innstillinger ligger bak «Detaljer og innstillinger».

**Klor-ark.** Klor-flisa på Oversikt, varselet og klorkortet på Varme åpner et ark nedenfra:

- **Navn:** trykk på et navn, og tabletten er logget for den personen. Du får en kvittering.
  «Uten navn» logger uten person.
- **Antall:** velges over navnene.
- **Etterregistrering:** trykk på en dag i kalenderen, så logges tabletten på den dagen.
- **Sletting:** innslagene for dagen står under kalenderen, med søppelbøtte.
- **Framtidige dager** kan ikke velges.

På Varme er klor nå én linje: en liten ring, neste dato og hvem som la i sist.

**Vinter.** Ny flis *Vinter* på Oversikt. Med vintermodus på viser Varme et vinterpanel:

- temperaturen i bassenghuset i ringen
- om varmeelementene er på
- om pumpa frostsirkulerer
- innstillinger for grensene og omsetningene om vinteren

Vannbildet blir iskaldt blått og viser ikke mål om vinteren. Det animerte bassengkortet
får vinterfarger og «Vintermodus» eller «Frostsikring» i pillen.

**Pooltak fra sensor.** Når taket kommer fra en dør-/vindussensor, sier flisa «lukket» eller
«åpent · sensor». Trykk åpner sensoren i stedet for å prøve å slå den av og på.

**Varmer ikke.** Når vannet er under målet uten at den varmer, kommer et varsel på Oversikt
med grunnen fra integrasjonen, for eksempel «Varmeprioritet er av».

### Kontrollert

Begge byggesjekkene er kjørt. Kortet er tegnet i Chromium sommer og vinter, med arket åpent.
I arket sender trykk riktige kall:

- dag 16 → søppelbøtta gir `ki_basseng.slett_klortablett` med tid-en til innslaget
- antall 2 og Ida gir `logg_klortablett` med `antall: 2`, `hvem: Ida` og
  `tidspunkt: 2026-09-16 12:00:00`
- kvitteringen sier «Logget 2 tabletter for Ida, ons 16. sep.»
- framtidige dager er avslått

---

# ki-cards 5.71.0

## ki-veggpanel-card 1.4.0: ingen tomrom nederst, familiedialogen over alt, lys du kan treffe

**Tomrommet nederst.** Kolonnene sluttet der innholdet sluttet, og med sidemenyen ble det i tillegg satt
av 16 px til en navbar som ikke finnes. Nå fyller kolonnene høyden, og ett kort i hver vokser til bunnen:
**scenene** til venstre (flisene blir høyere), det nederste i midten (**Nytt i Plex**), og **lysene** til
høyre (radene fordeles). Med sidemenyen er det ingen luft nederst. `vokser: { venstre, midt, hoyre }`
velger andre kort; `luft_bunn:` overstyrer luften.

**Familiedialogen havnet bak midtkolonnen.** Kortet var satt opp som container (`container-type`) for å
tilpasse seg bredden, og kolonnene hadde en fade-maske nederst. Begge deler gjør at et element med
`position: fixed` — dialogen i familiekortet — låses inne i kolonnen og tegnes under det som kommer etter.
Containment er byttet med vanlige skjermbredder (`@media`), og masken er borte. Dialogen legger seg over
hele panelet igjen.

**Lysradene er glidere, hele raden.** Glideren var en 3 px strek under navnet — vanskelig å treffe med en
finger. Nå er raden selve glideren: fyllet i bakgrunnen er lysstyrken, trykk slår av og på, dra sidelengs
dimmer. Raden er 52 px høy med egen flate, og teksten blir mørk når fyllet går bak den. Lamper uten dimming
fylles helt når de er på.

**«Ingenting nytt» i Plex.** Plex Recently Added lagrer plakatlista som en JSON-*streng*, ikke en liste,
og kortet leste bare lister. Begge former leses nå — også i `ki-lansering-card`, som hadde samme feil for
Plex-haken.

### Kontrollert

Begge byggesjekkene kjørt. Veggpanelet er kjørt med Plex-data som JSON-streng (to plakater, riktig
rekkefølge), sidemeny (ingen luft nederst), og scener, Plex og lys merket som de som vokser. Containment er
borte fra stilen. Lysradene: «Sofabord 100 %» med fullt fyll og mørk tekst, «Taklist Av» uten fyll.
KI Energi-varmen og overstyringen virker som i 5.70.0. Ingen `NaN` eller `undefined`.
