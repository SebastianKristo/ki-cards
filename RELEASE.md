# ki-cards 8.99.1

Bygget oppå 8.99.0 fra GitHub.

## family-status-card: vanlig dobbelttrykk

Dobbelttrykket er tilbake til det vanlige: første trykk på navnet venter et øyeblikk (280 ms). Kommer et andre
trykk innen da, er det et dobbelttrykk (innstillingene); ellers utføres trykket (servermenyen). Menyen åpnes
ikke lenger på første trykk, så det andre trykket kan aldri havne på bakgrunnen dens. Uten noen
dobbelttrykk-handling kjøres trykket med en gang, som før.

## ki-vanning-card 4.1.2: Forbruk som egen fane igjen

Forbruk er tilbake som egen fane, og Historikk viser kalenderen og døgn-for-døgn-grafen alene. `samle_forbruk: true`
legger forbruket under Historikk, for den som vil ha det slik.

### Kontrollert

Begge byggesjekkene kjørt. Dobbelttrykket er kjørt for seg: to raske trykk gir dobbelttrykket, ett trykk venter og
gir trykket etter fristen. Vanningskortet har fanene Nå, Soner, Programmer, Forbruk og Historikk.
