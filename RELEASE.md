# ki-cards 3.68.0

## `ki-vanning-card` 3.8.0: fanerada etter mønsteret fra klimakortet

Rada lot seg ikke rulle. Årsaken var min egen konstruksjon: en skinne med
`width: fit-content` sentrert inne i en flex-boks. Den overflyter i stedet for å krympe,
og da hjelper ikke `overflow-x` heller — det er ingenting å rulle inni, for elementet er
aldri smalere enn innholdet. Samme feil som ruterkortet hadde i 3.30.

`ki-klima-pro-card` løser det strukturelt, og det er en bedre løsning enn min:

* Rada fyller hele bredden og har sin egen `--gray200`-bakgrunn, i stedet for en tynn
  ramme rundt en sentrert pillegruppe.
* Fanene deler bredden med `flex: 1 0 auto`.
* Ikonet står over teksten, tekst i 11,5 px.
* **Under 430 px skjules teksten**, og ikonene deler bredden likt. Fem faner får dermed
  plass på en mobil uten at noe må rulles i det hele tatt.
* Valgt fane i `--active-small` med lys tekst, som bryterne ellers i bundelen.

Ikonene måtte være til å skille fra hverandre siden de bærer fanen alene på mobil:
vanndråpe for Nå, sprinkler for Soner, kalender for Programmer, søylediagram for Forbruk,
tidslinje for Historikk. Hver fane har `title` og `aria-label` med hele navnet.

Rullingen ligger igjen som sikkerhetsnett for de tilfellene der teksten vises og det
likevel blir trangt — men i praksis skal den ikke trenges nå.
