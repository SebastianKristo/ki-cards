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
