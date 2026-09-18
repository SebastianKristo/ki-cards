# ki-cards 4.1.0

## `ki-sikkerhet-card` 1.1.0: UI-editor og stedsprofiler

### Editor

Kortet hadde ingen editor og måtte settes opp i YAML. Nå felt for alarmpanel, navn,
sted, batterigrense, faner, soneknapper, tastatur og kompakt.

Standardverdiene står i editorens `data`, ikke bare i kortet. Uten det viser editoren
tomme felt, og første lagring skriver tomme verdier over standardene — en felle jeg har
gått i før med `vis_fanenavn`.

### Tre steder, tre bakgrunner

`profil:` bytter det som står rundt huset. **Huset selv er uendret** i alle tre — vinduene,
døra, skannestreken, blinklysene og sirenene hører til alarmen og skal se like ut uansett
sted. Profilen tegnes BAK huset, så ingen av animasjonene påvirkes.

* **`oslo`** — rekkehus: naboene på hver side, litt lavere og dempet, med hekk langs
  fortauet som binder rekka sammen.
* **`toten`** — åker med rader som smalner innover for å gi dybde, låve og silo bak huset,
  og en traktor som kjører over åkeren på 26 sekunder.
* **`stromstad`** — sjøen med to bølgelinjer i ulik fart, brygge med stolper foran huset,
  og fyrtårnet til venstre med røde stripar og en lysstråle.
* **`ingen`** — bare huset, som før.

Hver profil har **én bevegelse**, ikke flere: traktoren kjører, fyrlyset svinger, bølgene
glir. Mer enn det ville konkurrert med blinklysene når alarmen går, og da er kulissene i
veien.

Fyrstrålen svinger fram og tilbake i stedet for å rotere. En full rotasjon ville pekt inn
i huset halve tiden og sett ut som en feil.

Alt i bakgrunnene er dempet med vilje — 0,16 til 0,5 i gjennomsiktighet. Huset og alarmen
skal eie oppmerksomheten.

De tre nye animasjonene er lagt inn i `prefers-reduced-motion`-blokka.

### Testet

Alle fire profilene tegnet: Oslo 6 elementtyper, Toten 11, Strömstad 11, «ingen» tom.
Bakgrunnen ligger før huset i markupen, og vinduer og dør er uendret. Editorens skjema
har åtte felt, og stedsvelgeren har de fire valgene med lesbare etiketter.
