# ki-cards 3.99.0

## `ki-basseng-card` 1.9.0: temperatur og sirkulasjon i samme graf

Konseptet fantes fra før — sirkulasjonen som bånd bak temperaturkurven — men utførelsen
hadde tre feil, og det er dem jeg tror gjorde grafen ubrukelig:

**1. Aksetallene var forvrengt.** Alt lå i én `svg` med `preserveAspectRatio="none"`. Den
strekker innholdet etter bredden, så tallene under grafen ble strukket med. Nå er det to
lag: kurvene i en strukket svg, tekst og nå-punkt i en som ikke strekkes.

**2. Terskelen for «pumpa går» var 10 W.** Standby-trekk ligger over det, så det ble bånd
hele døgnet — og da sier båndene ingenting. Nå 40 W, og perioder kortere enn to minutter
forkastes: et blaff er ikke en pumpeperiode.

**3. Flaten under temperaturkurven la seg over båndene** og gjorde begge grumsete. Kurven
står nå som en rein strek.

I tillegg: minst to graders vindu på y-aksen. Med ett grad ble en halv grads måle-støy en
dramatisk fjellkjede på en dag da ingenting skjedde.

Under grafen står temperaturspennet med målet, og antall pumpeperioder med samlet tid.
Tidsvinduet velges med 24 t / 3 d / 7 d.

**Grafen ligger nå i Sirkulasjon-fanen**, over planstripa. Der hører den: stripa viser
hva som er *planlagt*, grafen hva som *skjedde*. Arbeidsgrafen fra 3.91.0 er fjernet — den
var den ene av to som ikke sa noe nytt.

Grafen er på som standard igjen.

### Testet

Én to-timers periode gir ett bånd og «2,0 t». Et blaff på 60 sekunder gir ingen bånd.
Standby på 12 W hele døgnet gir ingen bånd. Standby på 45 W gir ett langt bånd, som det
skal — da trekker pumpa faktisk strøm. En flat kurve varierer 3,9 px av 96 i stedet for å
fylle hele høyden.
