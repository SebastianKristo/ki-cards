# ki-cards 4.35.0

## Dra i etasjevelgeren: nettleseren tok gesten

Pilla var der og satt riktig, men lot seg ikke dra. Årsaken var ikke koden min — det var
at **rada er rullbar sidelengs**. `simple-tabs` har `overflow-x: auto` på `.tabs`, og da
tolker nettleseren et horisontalt drag som en rulling, tar over gesten og sender oss
`pointercancel`.

Tre ting måtte til:

* **`touch-action: none` på knappene.** Bare på knappene, ikke hele rada — rulling med
  fingeren utenfor en fane skal fortsatt virke når det er flere faner enn det er plass
  til.
* **Pekerfangst ved trykk**, ikke først ved bevegelse. Ventet vi, rakk rada å starte sin
  egen rulling, og vi mistet resten av gesten.
* **Lyttere også på knappene.** Med pekerfangst går `pointermove` og `pointerup` til
  knappen, ikke til rada — uten dette kom bevegelsen aldri fram.

Kalenderfanene var aldri berørt: de er `ki-tabs-card`, ikke `simple-tabs`, og der er rada
ikke rullbar i samme form.

### Hvis dette heller ikke virker

Da vil jeg heller bytte etasjevelgeren fra `simple-tabs` til `ki-tabs-card` enn å lappe
videre. Der er pilla en del av malen, animasjonen har virket hele tiden, og du får
UI-editoren på kjøpet. Det er den ene fanerada som står igjen, og hjelperen har kostet
fem forsøk på den alene.

---

# ki-cards 4.34.0

Vakt som kobler pilla på igjen når kortet tegner fanerada på nytt.
