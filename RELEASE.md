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
