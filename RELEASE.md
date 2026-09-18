# ki-cards 3.96.0

## `ki-basseng-card` 1.6.0

### Rutenettet av småfliser er borte

Jeg dro inn det tette tallrutenettet fra serverpopupen i 1.5.0 uten at det var bedt om
det, og det passer ikke her. Bassengkortet er bygget av **brede flater med rundt
ikonfelt** — som bannerne og sensorkortene i dashbordet — og småfliser fire per rad
bryter det språket.

Sirkulasjon og Spreder bruker nå full-bredde rader: 42 px rundt ikonfelt til venstre,
navn, og verdien til høyre. Stolpen ligger langs underkanten av raden i stedet for inne i
en flis, så den viser nivå uten å ta en egen linje.

### En feil rutenettet skjulte

Kortet hadde allerede en metode som het `_flis`, med signaturen
`(ikon, navn, tekst, aktiv, klikk, farge)` — den bygger handlingsflisene i Oversikt, og
brukes seks steder.

Min nye `_flis(navn, verdi, under, pst)` fra 1.5.0 hadde samme navn, og **overskygget
den**. En klasse kan ikke ha to metoder med samme navn; den siste vinner. Oversikt-fanens
seks fliser har derfor fått feil argumenter siden 1.5.0 — ikon der det skulle stå navn, og
ingen klikkhandling.

Den nye metoden heter `_infoRad`, og den opprinnelige `_flis` er intakt. Kontrollert: én
definisjon, og alle seks kallene stemmer med signaturen.

Det er andre gang i dag samme feil har oppstått — navnekollisjon mot en eksisterende
metode. Første gang var `this._histData` mot `_historikk()`.
