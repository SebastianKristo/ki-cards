# ki-cards 3.75.0

## `ki-klima-pro-card` 2.7.0: mer i UI-editoren

Editoren hadde tittel, standardfane og «husk valgt fane». Nå også:

* **Vis navn under faneikonene** — av gir bare ikoner, uansett skjermbredde. Valget kom i
  3.71, men lå bare i YAML for dette kortet. Nå står det i editoren.
* **Vis toppfeltet** — skjuler hero-feltet øverst hvis du vil ha et lavere kort.
* **Skjul disse fanene** — flervalg over de sju fanene. Tanker og Avansert er diagnostikk
  de fleste ikke trenger stående framme.

Skjuler du fanen som er satt som standard, eller den kortet husket fra forrige gang,
velges den første synlige med en gang — ikke først når neste tilstandsendring utløser en
opptegning. Skjuler du alle, vises alle: et kort uten faner er umulig å navigere.

Kontrollert i DOM: fanerada viser riktige faner, `vis_fanenavn: false` gir
`faner baretikon`, og alle seks feltene har etiketter i editoren.

## Om teksten under faneikonene

Den slås av med **«Vis navn under faneikonene»** i editoren, eller `vis_fanenavn: false`
i YAML. Begge kortene — klima og vanning — skjuler den automatisk under 430 px fra før;
valget gjelder brede skjermer.
