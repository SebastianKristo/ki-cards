# ki-cards 5.79.0

Bygget på 5.78.0 fra GitHub — bassengarbeidet (ki-basseng-card 3.3, vannivå) er med uendret. Denne
versjonen endrer bare veggpanelet, prosakortet og `DESIGN.md`.

## ki-veggpanel-card 1.5.0: iPad-designet

Veggpanelet er tegnet om etter iPad-skissen — temaet heter **varm** og er nå standard.

- **Palett:** nesten svart bunn, kort i `#1b1b1d` med en hårfin kant og radius 28, rolige grånyanser for
  tekst, og én varm, ravgul aksent for det som er på (i stedet for rosa). Varme er oransje.
- **Innebygde kort følger med:** fargene settes som dashbordets egne variabler på rammen, så prosa-,
  familie- og mediekortet arver paletten. Prosakortet har fått egne farger for tekst og piller
  (`--prosa-tekst`, `--prosa-pille`, `--prosa-pille-tekst`), så teksten står dempet med mørke piller,
  som i skissen — uten at noe endrer seg der prosakortet brukes ellers.
- **Toppen:** klokka 76 px, pillene 40 px høye med kant i kortfargen.
- **Sidemenyen:** smal (64 px), avrundet 32, aktiv side i en lysere grå i stedet for rosa.
- **Scener:** fliser i `#232326`; den du sist kjørte, står som aktiv med ravgul ramme og ikon, og
  overskriften sier «Aktiv: Filmkveld».
- **Varme:** radene med skillelinjer, − / + i runde knapper, temperaturen i 26 px/300; manuell-pillen
  i ravgul tone.
- **Lys:** hver rad har pæreikonet, som lyser ravgult når lampa er på; fyllet er en ravgul toning med en
  tynn kant der lysstyrken slutter, og bryteren er ravgul. Under lista står «Trykk for å slå av/på · dra
  for lysstyrke».
- **Nytt i Plex:** pil til høyre i hodet.
- **Gardiner og markise:** knappene 40 px i `#262629`.

`tema: mysmarthome` gir det gamle utseendet med dashbordets rosa aksent. Reglene for temaet står i
`DESIGN.md`.

### Kontrollert

Begge byggesjekkene kjørt. Veggpanelet er kjørt med temaet på rammen, scenen som blir «Aktiv: …» etter
trykk, pæreikon og hint i lysradene og pil i Plex-hodet; KI Energi-varmen, overstyringen og Plex som før.
Ingen `NaN` eller `undefined`.
