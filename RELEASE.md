# ki-cards 3.17.0

## `ki-sikkerhet-card` er nå hele panelet

Huset og tastaturet er slått sammen til ett kort. `ki-alarm-card` bakes inn under huset
med `hero: false`, så det ikke lenger står to overskrifter og to skjold oppå hverandre.
Sonene defineres ett sted og sendes videre til det innebygde kortet.

```yaml
type: custom:ki-sikkerhet-card
entity: alarm_control_panel.alarm
navn: Hjemme
tastatur:                 # false gir bare huset
  code_length: 6
  arm_requires_code: true
zones: …
```

Skallet bygges én gang og bare heroen tegnes på nytt ved tilstandsendringer. Uten det
ville tastaturet blitt bygget om midt i inntastingen og mistet sifrene.

## Huset er tegnet om

Bort med de flate rektanglene. Veggen har nå gradient og panelskjøter, taket har utstikk
og egen skygge, pipa har hatt, og vinduene har karm, sprosser og vinduskarm.

Nye og forbedrede animasjoner:

* **Vinduene tennes etter tur** når noe åpnes — 0,22 sekunders forsinkelse per vindu — og
  får en myk glødeflekk som flimrer svakt, som lys innenfra.
* **Døra svinger opp** i perspektiv når en lås står ulåst eller en dør er åpen, i stedet
  for bare å skifte farge.
* **Lampe over døra** som tennes når alarmen er på eller døra står åpen.
* **Røyken** stiger med en tegnet strek som drar seg oppover og fader ut, to pust i
  vekselvis rytme, og bare når alt er lukket og låst.
* **Radaren** har fått en utoverbølgende ring i tillegg til viften.
* **Sirenene** kommer i tre buer på hver side, forskjøvet i tid.

Fargene er bygget med `color-mix` mot `--gray1000` og `--tone`, så huset følger temaet
ditt i stedet for å ha faste farger. Alt stopper under `prefers-reduced-motion`.

## `ki-alarm-card`

Nytt valg `hero: false` som skjuler kortets egen topp. Brukes av kortet over; alt annet
er uendret, og kortet virker som før alene.
