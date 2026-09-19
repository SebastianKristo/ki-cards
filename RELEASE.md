# ki-cards 5.9.0

## Nytt kort: `ki-eksempler-card`

Hva hverdagslige ting koster ved dagens strømpris — lading, dusj, tørketrommel,
panelovn — som **én liste** i stedet for ett knappekort per eksempel.

Elleve eksempler følger med. Egne settes med `eksempler:`, der hver linje er navn, ikon,
kWh og en note.

### Noten er poenget

Et anslag uten forutsetninger ser ut som fasit. «Dusj 10 min · 3,24 kr» sier lite uten
«8 l/min, 30 °C oppvarming» under — da kan man justere tallet selv om ens egen dusj er
en annen. `vis_note: false` skjuler dem.

Beløp over ti kroner vises uten desimaler. 99 kr er lettere å lese enn 98,83 kr, og
presisjonen er likevel ikke der.

Kortet tegner bare om når prisen endrer seg, ikke ved hver tilstandsendring i huset.

### Kontrollert

Elleve eksempler med riktig regnestykke — 85,2 kWh mot 1,16 kr/kWh gir 99 kr. Egne
eksempler, skjulte noter, og en tydelig melding når prissensoren mangler.

Bundelen er nå 55 kort.

---

# ki-cards 5.8.0

Pilla holdes skjult til skrifta er lastet, så den ikke vises et øyeblikk med feil bredde.
