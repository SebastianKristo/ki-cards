# ki-cards 8.91.0

Bygget oppå 8.90.0 fra GitHub.

## ki-basseng-card 3.4.0: Spreder og Innstillinger i nytt design

- **Spreder:** scenen er et bilde med «Står» / «8 min igjen», start og stopp er én stor knapp
  (blå / rød), «Brukt i dag» med stolpe mot taket og «Program» med bryter er fliser, og hvor lenge
  den går velges med faste knapper (5–30 min). Under står programmet som rader: start hver,
  maks per døgn, varighet og frostvakt.
- **Innstillinger:** gruppert i Styring, Pumpe, Varme, Varmemodell, Klor, Vannivå og I dag, med
  rader i samme form som resten av kortet – ikon, navn, en linje om hva den gjør, og verdien til
  høyre. Trykk hvor som helst på en tallrad for hjulvelgeren. Det modellen har lært, står som
  brikker.

Klorstatus og valg av mobiler for varsel ligger i KI Basseng 1.9.

---

# ki-cards 8.90.0

Bygget oppå 5.88.0 fra GitHub.

## ki-kart-card 1.1.0: kartet fyller skjermen

Kartet tar nå nesten hele skjermen i popupen (`visning: stor`, standard). Personene og bilen flyter nederst
over kartet i glassbrikker — bilde med ring i sonefargen, sone og hvor lenge, avstand eller batteri — og
sonene flyter øverst med hvem som er der. Brikkene kan rulles sidelengs; resten av flaten slipper fingeren
gjennom til kartet, så du drar og zoomer som vanlig.

Høyden er skjermhøyden minus `luft:` (170 px som standard, for popup-toppen og navbaren). Kartkortet får
sideforholdet regnet ut fra boksen, og det settes på nytt når iPaden snus.

`visning: liste` gir det gamle oppsettet: kartet øverst og listene under.

## Buss som popup

`examples/buss-popup.yaml` legger bussen (`ki-entur-card`) i en egen popup (`#buss`) i samme stil som de andre,
så den kan åpnes fra sidemenyen. **Buss** i sidemenyen får rød farge når den er åpen. Bussen kan fortsatt ligge
i veggpanelet med `buss:`.

### Kontrollert

Begge byggesjekkene kjørt. Kartkortet i stor visning: tre soner øverst og fire brikker (tre personer og bilen)
nederst, alle i glass, kartet først i boksen og høyden regnet fra skjermen minus 170 px. Listevisning: lister
under kartet og ingen flytende brikker. Ingen `NaN` eller `undefined`.
