# ki-cards 4.21.0

## `ki-varsling-card`: filtrer på regelnavn, ikke entitets-ID

`bare:` slo av hele autokonfigurasjonen — kortet viste nøyaktig de tre entitetene som sto
der, og ingenting annet. Det var feil råd fra min side.

Nye valg som filtrerer på **enhetsnavnet**, altså navnet på regelen i integrasjonen:

```yaml
enheter: [lås, dørlys, alarm]      # bare disse reglene
ikke_enheter: [lås, dørlys, alarm] # alt unntatt disse
```

Treffet er delvis og uten hensyn til store bokstaver, så `lås` finner «Autolås»,
«Dørlås fastkjørt» og «Ansiktsgjenkjenning – dørlås».

### Hvorfor navnet og ikke ID-en

Reglene heter det samme i alle tre installasjonene, mens entitets-ID-ene varierer — og
Toten har bare noen av reglene. Et navnefilter overlever flyttingen mellom Oslo, Toten og
Strömstad; en entitetsliste gjør det ikke.

Og en regel du legger til i morgen dukker opp av seg selv i riktig fane. Det var hele
poenget med å finne dem automatisk, og `bare:` tok det bort igjen.

`bare:` finnes fortsatt for den som vil styre rekkefølgen nøyaktig, men er ikke lenger
veien jeg anbefaler.

### Kontrollert

Mot alle elleve reglene dine: uten filter finnes alle elleve, `enheter: [autolås, dørlås,
dørlys]` gir fire, `ikke_enheter` med de samme gir de sju andre, og et navn som ikke
finnes gir en tom liste uten å feile.

---

# ki-cards 4.20.2

Overskriften per gruppe er av som standard; `grupper: true` og `teller: true` slår dem på.

# ki-cards 4.20.1

Radene bruker målene fra `template_toggle_card_small`, og `friendly_name` deles på
bindestrek som malen gjør.
