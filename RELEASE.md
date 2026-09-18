# ki-cards 4.0.0

## `ki-basseng-card` 1.10.0

### Fanerada sto til høyre

Da tannhjulet kom i 1.6.0 satte jeg `margin: 0 0 12px auto` på rada, som skjøv hele
gruppa mot høyre kant. Den skal stå midt på, og gjør det igjen.

### Helt ny graftype: timesøyler

Kurven var feil form for dette, og det er derfor ingen av forsøkene ble gode. En
temperaturkurve over et døgn er nesten flat: enten blir den en kjedelig strek, eller — med
stramt vindu — en dramatisk fjellkjede av målestøy. Ingen av dem sier noe.

Én søyle per time sier det kurven ikke kunne: **hvor mye vannet steg eller falt den
timen**, og om pumpa gikk mens det skjedde.

* Søyla går **opp** fra midtlinja når temperaturen steg i løpet av timen, **ned** når den
  falt. Oransje opp, blå ned.
* Under hver søyle et blått merke som viser **minuttene pumpa gikk** den timen.
* Midtlinja er nullpunktet, så du ser med én gang hvilke timer som var netto varme.
* Ingen strukket svg, altså ingen forvrengt tekst. Ingen levende måling, altså ingenting
  som hopper mens du ser på det.

Under: temperaturen nå med målet og spennet i vinduet, og samlet pumpetid. 24 t / 3 d /
7 d velger vinduet — over et døgn fortynnes søylene til 24 i stedet for å bli hårtynne.

Kontrollert for alle tre vinduene: 24 søyler hver gang, og opp + ned = 24.

### Sprederen er bygget om i vanningskortets form

Den gamle var div-er som falt i rette streker. Vann beveger seg ikke i rette streker.

Nå en SVG-scene som følger sprinkleren i `ki-vanning-card`: hodet vipper, **strålegruppa
svinger i samme takt** — ellers ville strålene stått stille mens dysa beveget seg — og
åtte dråper kastes ut langs buen med hver sin retning og forsinkelse, via `--dx`/`--dy`
og samme `sprut`-kurve som vanningskortet.

Står sprederen, er scenen stille og strålene usynlige.

De gamle `.dyse`, `.draper` og `.bakke`-stilene er fjernet, og reduced-motion dekker de
nye animasjonene.
