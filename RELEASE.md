# ki-cards 5.83.0

Inneholder også 5.82.0 (veggpanelet: nattkort over to kolonner, «God morgen», farger i varme og lys, Plex),
som ikke er pushet ennå — notatet for den står under.

## ki-sikkerhetspanel-card 1.1.0

**Hvem låste opp med ansikt.** Med `ansikt: sensor.ansiktsgjenkjenning_dorlas_sist_last_opp_av` kobles hver
opplåsing til ansiktshendelsen rett før (innen to minutter):

- i **Siste hendelser**: «Inngang låst opp — Sebastian · ansiktsgjenkjenning»; en gjenkjenning uten
  opplåsing står som «Cybele ble gjenkjent»
- i **Rom**: låsen sier «Låst opp av Sebastian» i stedet for «Dørlås ulåst»
- i **Krever oppmerksomhet**: «Inngang · låst opp av Sebastian med ansikt»

**Kodetastaturet** ble delvis dekket av navbaren. Det har nå 96 px ekstra luft nederst (pluss den trygge
sonen på iPhone), så nederste rad står over navbaren. `tastatur_luft:` justerer.

**Ingen egen overskrift eller X** som standard — bubble-cardens topp (navn, ikon og lukkeknapp) brukes.
`topp: true` gir den tilbake.

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med en opplåsing 60 s etter at Sebastian ble gjenkjent og en eldre
gjenkjenning av Cybele: loggen viser «Inngang låst opp (Sebastian · ansiktsgjenkjenning)» og «Cybele ble
gjenkjent», låsen i rom-lista sier «Låst opp av Sebastian», toppen er borte, og tastaturet får 96 px luft.
Ingen `NaN` eller `undefined`. Bygget oppå 5.81.0 fra GitHub.

---

## (5.82.0)

## ki-veggpanel-card 1.8.0: nattkort over to kolonner, «God morgen», mer farge, og Plex som virker

**Nattkortet ligger over to kolonner** — over media og varme i midten og lysene til høyre — i stedet for å
skyve media ned i én kolonne. Venstre kolonne (prosa, familie, scener) står urørt. `natt.kort_plass: midt`
eller `venstre` gir de gamle plassene.

**God morgen.** Når nattmodus slås av om morgenen, blir nattkortet til et morgenkort: soloppgang med en
sol som stiger opp, stråler og fugler som flyr forbi, «God morgen», når nattmodus ble slått av, været, lås
og alarm. Det står til kl. 9 (`natt.morgen_til`) eller til du krysser det ut — utkryssingen huskes resten
av dagen. Står nattmodus fortsatt på om morgenen, sier nattkortet «God morgen» i stedet for «God natt».

**Mer farge i varmen og lysene** (`levende: true`, standard):

- **Varme:** ikonet gløder oransje med en flamme som blafrer når ovnen varmer, og blir blått når rommet er
  under målet uten at det varmes. Under hver sone en stolpe fra blått til oransje som viser rommets
  temperatur mot målet.
- **Lys:** hver rad får lampas egen farge — RGB når den har det, ellers en varm tone ut fra
  fargetemperaturen — i fyllet, en tynn ring og en glød. Pæreikonet lyser i samme farge, og ikonet i
  overskriften gløder i fargene til lampene som er på.

`levende: false` gir det rolige utseendet tilbake.

**Nytt i Plex virket ikke.** Nå er det en stor plakat med bakgrunnsbildet, som i swipe-kortet ditt: tittel,
episode eller år og spilletid, og når den ble lagt til. Den bytter hvert 10. sekund (`plex.intervall`),
kan sveipes, og har prikker nederst. Dataene leses slik `dashboard_plex`-malen gjør (`data[1]`, `data[2]`
…). Finner kortet ingenting, sier det hvorfor — sensoren finnes ikke, har ingen data-liste, eller er tom —
så vi ser hva som mangler i stedet for bare «Ingenting nytt».

### Kontrollert

Begge byggesjekkene kjørt. Veggpanelet er kjørt med nattmodus på (kortet i rutenettet over midten og
høyre), slått av om morgenen («God morgen» med vær, lås og alarm; krysset ut forsvinner det, og det holder
seg borte ved ny visning samme dag), panelovnen som varmer (oransje) og oljefyren under målet (blå) med
stolper, lampene i sine egne farger og glød i overskriften, og Plex med tre plakater i riktig rekkefølge som
bytter tittel og undertekst — og en forklaring når sensoren mangler. Ingen `NaN` eller `undefined`.
Bygget oppå 5.81.0 fra GitHub.
