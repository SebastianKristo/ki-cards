# ki-cards 5.11.0

## Kortet i fanen listes, og blyanten åpner HAs dialog

I 5.10.0 lå kortredigereren **brettet ut inne i** faneeditoren. Nå står kortet som en
rad — «1 Vertical stack» med blyant og søppelbøtte — og blyanten åpner Home Assistants
egen kortdialog i fullskjerm.

Det er den samme flyten som i HAs stabel-editorer: forhåndsvisning ved siden av,
«Vis koderedigering», Avbryt og Lagre.

### Reserve hvis dialogen ikke lar seg åpne

`hui-dialog-edit-card` er intern i frontenden og kan endre seg mellom versjoner. Lar den
seg ikke åpne, brettes den innebygde editoren ut under rada i stedet.

Da mister man dialogen, ikke muligheten til å redigere. Er heller ikke den tilgjengelig,
sier editoren fra at YAML-visningen må brukes — i stedet for å vise en tom rute.

### Kontrollert

Tom fane gir «+ Legg til kort», som skriver
`card: {type: vertical-stack, cards: []}`. En fane med et kort gir rada med riktig navn
og ingen innebygd editor. Blyanten ber om `hui-dialog-edit-card` med kortet og en
lagringsfunksjon. Uten dialogen kommer reserven fram. Søppelbøtta fjerner kortet.

---

# ki-cards 5.10.0

`fast_hoyde` låser paneldelen til den høyeste fanen, så popupen ikke endrer størrelse
ved fanebytte.
