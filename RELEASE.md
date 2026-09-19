# ki-cards 4.22.0

## Én bryter per regel

«Alarm» har åtte entiteter og «Familie – hjemme/borte» ti, men bare én av dem hører
hjemme i en oversikt: den som slår hele regelen av og på. Resten er finjustering.

Kortet viser nå bare hovedbryteren. Den kjennes på navnet — «alle varsler», «aktivert»,
«varsling», eller at den heter det samme som regelen.

Finner kortet ingen hovedbryter for en regel, viser det alle bryterne for den. **Å skjule
noe vi ikke forstod er verre enn å vise for mye**, særlig når man ikke ser at det er
skjult.

`master: false` viser alle. Undertogglene ligger uansett under langt trykk.

Testet: åtte brytere fordelt på tre regler blir tre rader, og `master: false` gir alle
åtte.

## Navnene dine er lagt inn i kortet

Fjorten regler med navn, forklaring og ikon — vekking, ansiktsgjenkjenning, autolås,
fastkjørt lås, dørlys, hjemme/borte, alarm, Heimdall, Ruter, planter, støvsuger, Home
Assistant, værmelding og strømforbruk.

Integrasjonens egne navn er tekniske («Alarm - Alle varsler»). Disse er de som faktisk
forklarer hva bryteren gjør, og nå slipper du å skrive dem i hver installasjon.

`navn:` og `undertekst:` overstyrer som før, `kjente: false` slår tabellen av.

### Resultatet

Hele popupen er 71 linjer, mot rundt 240 i det håndskrevne oppsettet — og **uten en
eneste entitets-ID, navn eller ikon**. Alle tretten reglene kommer opp med riktig tekst
og ikon av seg selv.

---

# ki-cards 4.21.0

Filtrering på regelnavn med `enheter:` og `ikke_enheter:`, som overlever mellom
installasjonene der entitets-ID-ene varierer.
