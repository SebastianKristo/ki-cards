# ki-cards 3.67.0

## `ki-avfall-card` 2.0.0 – lagt om

Skjermbildet viste fire layoutfeil på én gang, og de hang sammen.

**Heroen hadde to kolonner.** Fraksjonsnavnet lå i en egen kolonne til høyre, med
«Deretter»-linja under. På en mobil ble den kolonnen så smal at teksten rant inn over
nedtellingen. Alt ligger nå i én kolonne ved siden av ikonet: etikett, fraksjon,
nedtelling, dato.

**«I morgen» brakk over to linjer.** Nedtellingen sto på faste 52 px, og et ord er
bredere enn et tall. Størrelsen er nå `clamp(28px, 9vw, 42px)` med `nowrap`, så den
krymper til den passer i stedet for å brekke. Datoen brakk over tre linjer av samme
grunn, og klippes nå med ellipse.

**Bøtta lå oppå datoen.** Scenen var absolutt plassert over hele heroen. Nå er den et
bånd nederst i full bredde, med teksten over i sin egen rad — de kan ikke overlappe.

**Flisene klipte alt.** To kolonner med navn og verdi i samme lille rute ga
«Plastemball…» og «I mo…». Fraksjonene står nå som én rad hver: ikon i farget sirkel,
navn og dato i midten, nedtellingen til høyre. Da får både «Glass og metallemballasje» og
«I morgen» plass. `kolonner: 2` gir det gamle oppsettet for den som vil.

## Animasjonen

Lokket vipper opp når bøtta tømmes. Bilen kjører inn, **stopper ved bøtta** mens den
tømmes, og kjører videre — før gikk den rett over i konstant fart. Eksos pufter ut mens
den står. Hjulene ruller som før.

Tømmedagen gir full farge og alle animasjonene. To dager eller nærmere gir dempet farge
og en tydeligere scene enn før. Resten av tiden er kortet rolig.

Alt slås av med `prefers-reduced-motion`.
