# ki-cards 8.99.0

Bygget oppå 8.96.0 fra GitHub. Inneholder også 8.97.0 og 8.98.0, som ikke er pushet — notatene står under.

## ki-vanning-card 4.1.1: fanenavn på alle skjermer

Navnene under ikonene i fanerada ble skjult på skjermer smalere enn 430 px, uansett innstilling. Nå står de der på
alle skjermer så lenge `vis_fanenavn` er på: på smal skjerm deler fanene bredden likt, teksten blir litt mindre, og
et langt navn kuttes med … i stedet for å forsvinne. `vis_fanenavn: false` gir bare ikoner, som før.

---

## (8.98.0)

## family-status-card: dobbelttrykk virker igjen

Dobbelttrykk på navnet skulle gå til innstillingene, men åpnet bare servermenyen. Menyen åpnes på første trykk
(så den kommer med en gang), og bakgrunnen dens legger seg over navnet — så det andre trykket landet på
bakgrunnen og lukket bare menyen. Nå regnes et trykk på bakgrunnen innen fristen som det andre trykket i et
dobbelttrykk: menyen lukkes og dobbelttrykket kjøres. Fristen er også litt lengre (320 ms), siden det andre
trykket kommer senere på berøringsskjerm.

### Kontrollert

Begge byggesjekkene kjørt. Bakgrunnen til servermenyen kjører dobbelttrykket når fristen fra første trykk ikke
er ute; vanningskortet er kjørt på nytt med samme resultat som i 8.97.0.

---

## (8.97.0)

Bygget oppå 8.96.0 fra GitHub.

## ki-vanning-card 4.1.0

**Sist vannet vises.** Flisen kom bare når OpenSprinkler hadde en «last run»-sensor med verdi, og den finnes ikke i
alle oppsett. Nå brukes den når den finnes; ellers den siste dagen med forbruk i statistikken fra KI Vanning
(«21. sep · 310 L»). Statistikken hentes i bakgrunnen også når historikkfanen ikke er åpnet. Trykk på flisen går
til Historikk.

**Verdien i grafene.** Trykk eller dra fingeren over en søyle, så står dato og mengde over den — i «Neste 7 dager»
(planlagte liter) og i historikkens døgn-for-døgn (liter og kroner). Søylen du står på, markeres; lappen blir
stående til du trykker et annet sted, eller i fire sekunder.

**Historikk og forbruk i én fane.** Forbruksfanen er slått sammen med Historikk: kalenderen, så summen og
døgn-for-døgn-grafen i ett kort, og under «Forbruk per sone» med periodene I dag / Uke / Måned / År.
`samle_forbruk: false` gir egen forbruksfane igjen.

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med demo-dataene og 14 døgn statistikk: fanene er Nå, Soner,
Programmer, Historikk; Sist vannet viser siste dag med forbruk; historikken har 14 søyler med verdier og forbruket
under; et trykk på søylen for 14. september gir «962 L · 39,55 kr». Ingen `NaN` eller `undefined`.
