# ki-cards 4.12.0

## Post og bursdager i romflisenes språk

Begge kortene er bygget om etter skissen. Fire trekk er hentet rett fra romflisene i
dashbordet:

* navnet oppe til venstre, ikonet i en rund sirkel i motsatt hjørne
* den store verdien nede til venstre, lett skrift, med en dempet hale ved siden av —
  bygget som «23°» med «48%»
* sirkelen er **farget bare når det haster**, nøytral ellers, slik et rom som er av ikke
  lyser
* de mindre radene er piller med rundt ikon og to linjer, som «Låst / Dørlås»

### `ki-post-card` 3.0.0

Én pille i stedet for et kort med dato-skive. Tittelen er **når**, underteksten **hva**:
«I morgen» over «Post leveres». Det er når-delen man leser først.

Sirkelen er blå når leveringen er i dag eller i morgen, nøytral ellers. På selve dagen
faller brevet ned i kassa i en rolig løkke.

`dager: [2, 4]` gir en ukestripe til høyre med ukedagene posten kommer, der 1 er mandag.
**Uten den vises ingen stripe** — sensoren kjenner bare neste levering, og en gjettet
stripe er verre enn ingen. Stripa skjules under 520 px.

### `ki-bursdag-pro-card` 3.0.0

Den nærmeste bursdagen er en høy flis: navn, kakesirkel i hjørnet, dagene igjen i stort
lett tall med «dager» dempet ved siden av, og en stripe langs underkanten som fylles jo
nærmere man kommer — 60 dager er hele vinduet.

På selve dagen står det «I dag» i stedet for et tall, flata får personens farge, og
flammen på kaka blafrer. Den blafrer **bare** da; ellers ville tre kort blinket samtidig.

De neste blir piller med navn, dager og alder. Sirkelen deres farges når det er under 14
dager igjen.

Kakeikonet er nå én konstant brukt begge steder. Sto det to steder, ville de kommet ut av
takt ved første endring.

### Kontrollert

Postkortet i fire tilstander: i dag, i morgen, om 3 dager («På mandag»), om 10 dager
(«28. sep»), med riktige klasser. Ukestripa tennes på tirsdag og torsdag med `dager: [2,4]`
og forsvinner uten.

Bursdagskortet med tre personer: flis for Cybele med «3 dager» og 95 % fylt stripe, to
piller for Rune og Mormor med riktige datoer. På selve dagen: «I dag», `i_dag`-klasse og
full stripe.
