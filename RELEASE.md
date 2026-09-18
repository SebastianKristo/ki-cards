# ki-cards 4.6.0

## `ki-hytte-card` 2.4.0: søk etter dag eller uke

Nytt søkefelt øverst i Kalender-fanen. Skriv en dato eller et ukenummer, og få svaret på
tvers av alle stedene: hvem var hvor.

Kalenderen svarer allerede på dette hvis du blar til riktig måned og trykker på dagen.
Søket er for når du vet datoen, men ikke måneden — «uke 27» er lettere å skrive enn å
bla tolv måneder bakover.

Formatene som tolkes:

| Du skriver | Tolkes som |
| --- | --- |
| `4.7` · `04.07.2026` · `2026-07-04` | den dagen |
| `4. juli` · `4 juli 2026` | den dagen |
| `uke 28` · `u28` · `uke 28 2026` | hele uka |
| `i dag` · `i går` | den dagen |
| `denne uka` · `forrige uke` | hele uka |

Ukenummer følger ISO-regelen, der torsdagen bestemmer hvilken uke og hvilket år dagene
hører til. Uten den havner nyttårsuka i feil år.

Ved uke eller flere dager står antall dager per person i parentes — «Cybele (2 d), Rune
(1 d)» — så du ser hvem som var der hele tiden og hvem som stakk innom.

Svaret bruker den samme dagboksen som kalenderen viser når du trykker på en dag, med
stedsfargen foran. Forstår den ikke det du skrev, sier den det og viser tre eksempler i
stedet for å vise ingenting.

`sok: false` skjuler feltet.

### Testet

Tretten inndataformater tolket riktig, inkludert ugyldige. Svarene kontrollert mot tre
steder med kjente dager: enkeltdag med to personer, uke som spenner over to steder, en
dato i fjor, en dag der ingen var noe sted, og tekst som ikke er en dato.
