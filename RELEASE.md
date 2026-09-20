# ki-cards 5.16.0

## Mastermodus samler når enheten faktisk har en hovedbryter

KI Utelys har en hovedbryter — Automatikk — og det er som regel bare den man vil se.

Regelen er nå: samle til hovedbryteren når enheten **har** en. Hovedbryteren kjennes på
navnet, og `_auto` og `_automatikk` er lagt til i mønsteret.

Jeg har hatt dette feil begge veier. Først var unntaket hardkodet til `ki_energi`, så
begrenset jeg det til `ki_notifications` — og ingen av delene tålte at du legger til en
ny integrasjon, som var hele poenget med editoren.

### KI Energi er fortsatt unntatt, og det er et ekte unntak

De seks bryterne der er **sidestilte valg** — effektgrense, hjemkomst, varmtvann — ikke
underinnstillinger under en hovedbryter. Samlet ville fem av seks forsvunnet.

`ikke_master:` lar deg gjøre det samme for andre integrasjoner, og `ikke_master: []`
slår av unntaket helt.

### Resultat med dine tre integrasjoner

```
Dørlås                 ← samlet til hovedbryteren
Effektgrense           ← KI Energi, sidestilt
Varmtvann              ← KI Energi, sidestilt
Utelys automatikk      ← samlet, morgen og kveld skjult
```

`master: false` viser alle sju.

### Kontrollert

Tre plattformer samtidig gir fire rader. `master: false` gir sju. `ikke_master: []`
endrer ikke KI Energi her, siden ingen av de to bryterne i testen er en hovedbryter —
i praksis ville `ki_energi_varsler` blitt samlingspunktet.

---

# ki-cards 5.15.0

Navn for KI Utelys, og mastermodus begrenset til `ki_notifications` — rettet igjen her.
