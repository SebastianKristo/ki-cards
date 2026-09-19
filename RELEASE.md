# ki-cards 4.33.1

## Pilla hoppet i stedet for å gli

Den var på plass og riktig plassert i alle kortene — men i strømpriskortet og
etasjevelgeren **flyttet den seg uten animasjon**.

Årsaken var min egen plassering. Kort som tegner markupen på nytt får en ny pille, og den
settes først på forrige plass med overgangen AV, så den ikke blinker. Deretter skal den
gli til den nye fanen — men alle målingene etterpå kalte `flytt(true)`, som slår av
overgangen. Sluttposisjonen ble altså satt uten animasjon, og pilla hoppet.

Nå er det bare **første** plassering som er stille, der det ikke finnes noen forrige
posisjon å gli fra. Har vi en, animeres flyttingen.

De to sene målingene på 120 og 400 ms — de som retter bredden når skrifta er byttet —
animeres også. Med `flytt(true)` slo 120 ms-målingen av overgangen midt i glidningen, og
pilla hoppet resten av veien.

### Hvorfor `ki-tabs-card` alltid virket

Der overlever fanerada, så pilla er den samme noden hele veien. Den fikk aldri den
stille gjeninnsettingen, og `_select` animerer som normalt.

### Kontrollert

Første tegning: pilla settes stille på 4 px. Ny tegning etter fanebytte: den står først
på 4 px med overgangen av, og glir så til 154 px med den på.

---

# ki-cards 4.33.0

Editoren for `ki-tabs-card` bygget om: fanen utvides der den står, med nummerert
kortliste.
