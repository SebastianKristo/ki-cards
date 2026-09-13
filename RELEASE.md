# ki-cards 3.22.0

## Kortene finner lysene etter at ki_lys ble slått inn i ki_rom

`ki-jul-card` og `ki-rom-card` fant entitetene ved å se etter attributtet
`integrasjon: ki_lys`. Etter sammenslåingen setter integrasjonen `ki_rom` på jul-delen, og
julekortet sto tomt med «Fant ingen julelys fra KI Lys».

Begge kortene godtar nå både `ki_lys` og `ki_rom`, så de virker uansett hvilken versjon av
integrasjonen som står installert, og uansett rekkefølge du oppgraderer i. Teksten i det
tomme julekortet peker nå til KI Rom → Innstillinger → Julelys.

Selve integrasjonen er også rettet i KI Rom 2.1.1, der jul-entitetene beholder
`ki_lys`-markøren som resten av lysdelen. Du trenger bare én av delene for at det skal
virke, men ta gjerne begge.
