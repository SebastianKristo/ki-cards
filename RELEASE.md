# ki-cards 4.9.0

## `ki-hytte-card` 2.6.0: søk på helg

Det er sjelden datoen man husker. Det er «vi var på Toten den helga».

Nye søk:

| Du skriver | Tolkes som |
| --- | --- |
| `helg 37` · `helgen 37` · `helg uke 37` | fredag, lørdag og søndag i uke 37 |
| `helga` · `denne helgen` | helga denne uka |
| `forrige helg` | helga forrige uke |

**Og ved ethvert ukesøk legges helga til som egen linje.** Søker du `uke 37` og dere var
på Oslo mandag til torsdag og Toten fredag til søndag, står det:

```
Uke 37, 2026 · 7 dager
  Toten     Sebastian (3 d), Rune (3 d)
  Oslo      Cybele (4 d)
  ─────────────────────────
  Helgen    Toten
```

Var dere flere steder i helga, står fordelingen: «Toten (2 av 3), Oslo (1 av 3)». Linja er
skilt fra dagene over med en hårfin strek, så den leses som et sammendrag og ikke som enda
et sted.

Helga regnes fra `dager`-oppslaget, altså de samme dataene kalenderen bruker. Den krever
ikke helgesensoren fra KI Hyttebesøk, men stemmer overens med den.

### Kontrollert

Sju skrivemåter tolket riktig, inkludert at `helga` og `denne helgen` treffer inneværende
uke og `forrige helg` uka før. Svaret kontrollert mot en uke der Oslo hadde mandag til
torsdag og Toten fredag til søndag: helgelinja sier Toten.
