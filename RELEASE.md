# ki-cards 8.96.0

Bygget oppå 8.95.1 fra GitHub.

## ki-vanning-card 4.0.0: Vanning v4

Vanningspopupen etter designet «Vanning v4». Hagescenen, hurtigknappene og fanerada er som før; fanene er tegnet
om.

**Nå**
- **Vanner nå** — eget kort med sonen («S05 Plen nord»), metoden og hva som står i kø, nedtellingen stort
  (mm:ss, teller hvert sekund), et blått fyll som vokser mens sonen vanner, litrene i dag og **Stopp**.
- **Regnpause** som før, øverst når den er på.
- **Neste vanning** — dag og dato, klokkeslettet stort, de tre første sonene med ikon, varighet og liter, og
  **Kjør nå**. **Hopp over** vises når KI Vanning har tjenesten `ki_vanning.hopp_over`.
- **Neste 7 dager** — søyler med planlagte liter per dag; den første dagen med vanning er sterkest.
- **Strøm** og **Sist vannet** som to fliser.

**Soner** — en liste per boks («Boks 1 · 3 soner»): ikon, «S05 Plen nord», metode og varighet, og spill/stopp
til høyre. Sonen som vanner, er blå med et fyll som vokser. Spilleknappen starter med standardvarigheten
(`standard_min:`, ellers den andre i `varigheter:`); trykk på raden legger fram alle varighetene. Deaktiverte
soner ligger bak «N deaktiverte soner».

**Programmer** — klokkeslettet stort til venstre med dagene under, navnet og sonene i midten, **Kjør nå** og en
grønn bryter til høyre; avslåtte programmer er dempet. **Kommende vanninger** er en agenda per dag med antall
soner og liter, og klokkeslett, hva og mengde per kjøring.

Forbruk og Historikk er som før.

### Kontrollert

Begge byggesjekkene kjørt (64 kort). Kortet er kjørt med demo-dataene: «Vanner nå · S05 Plen nord · 7:24»,
Neste vanning med to soner og Kjør nå / Hopp over, sju dagsøyler, tre bokser med sju soner der S05 er blå,
deaktiverte bak egen knapp, og programmene med klokkeslett og av/på. Ingen `NaN` eller `undefined`.
