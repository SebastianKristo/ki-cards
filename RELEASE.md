# ki-cards 4.27.0

## Pilla satt feil helt til du byttet fane

Du så det presist: feil ved første visning, riktig etter en tur til fane 2 og tilbake.

Ett `requestAnimationFrame` er ikke nok. Ved oppstart kan kortet fortsatt legge ut,
skrifta er ikke byttet fra reservefonten — som er smalere — og i en popup animeres hele
flata inn mens vi måler. Første måling traff derfor et mellomstadium, og først ved
fanebytte ble den gjort på nytt.

Nå måles det flere ganger: to bilder på rad, og igjen etter 120 og 400 ms. Det er billig,
usynlig når målingen alt er riktig, og dekker både treg fontlasting og en popup som glir
inn.

`ResizeObserver` ser nå også på **hver enkelt fane**, ikke bare rada. Rada kan ha samme
bredde mens en fane inni vokser, og da fikk pilla gammel bredde uten at noe varslet oss.

Samme rettelse i `KI.pillefaner`, som gir simple-tabs den samme pilla.

## Editoren for `ki-tabs-card` viser alle valgene

Den hadde to felt. Kortet leser åtte.

Nå er de gruppert i to sammenleggbare seksjoner, som i simple-tabs' editor — utseende
først, så oppførsel. Det er den rekkefølgen man leter i.

**Utseende:** plassering, tittel, tittelstørrelse, avstand under rada, bakgrunn når rada
er festet.
**Oppførsel:** form (automatisk, piller, rullbar, nedtrekk), fest rada ved rulling,
nedtrekk under rada.

Standardverdier skrives ikke til YAML-en. Uten det ville `bg: ""` og `sticky: false` stått
igjen og sett ut som noe du hadde valgt.

### Kontrollert

Begge gruppene med riktige felt og norske etiketter, og en lagring med bare
standardverdier gir en konfigurasjon uten støy.

---

# ki-cards 4.26.0

`KI.pillefaner` gir simple-tabs samme glidende pille, uten å røre den minifiserte fila.
