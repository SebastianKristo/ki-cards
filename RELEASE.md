# ki-cards 4.17.0

## Editoren hakket fordi den bygde seg selv på nytt 200 ganger i minuttet

`set hass` fyres hver gang **én** tilstand i huset endrer seg. Editoren bygde hele DOM-en
på nytt hver gang — nye `ha-form`, nye kortredigerere, alt sammen. Det var derfor den
hakket mens du skrev.

Nå sendes `hass` bare videre til underelementene, som er det de faktisk trenger.

M�lt i testrigg: 200 tilstandsbytter ga **200 ombygginger før, 0 nå**. Fanebytte bygger
fortsatt, som det skal.

## Ikonet står inntil rada nå

`.bar` har `gap: 10px` fra før, og jeg la på `margin-left: 8px` i tillegg — 18 px til
sammen, som fikk knappen til å se løsrevet ut. Negativ margin trekker den inn til 4 px:
rett utenfor rammen, ikke et eget element lenger borte.

## Velg hvor fanerada står

Nytt felt i editoren: **Venstre, Midten, Høyre**.

`align` tar nå både norske ord og CSS-verdier — `venstre`, `midten`, `hoyre`, `høyre`,
og fortsatt `flex-start`, `center`, `flex-end`. Den som alt har skrevet `flex-start`
trenger ikke endre noe.

## Editoren har fått en seksjon for kortet

Øverst: plassering av fanerada og valgfri tittel til venstre. Under: fanene, og så den
valgte fanen. Tomme felt fjernes fra YAML-en i stedet for å stå igjen som `tittel: ""`.

### Kontrollert

To `ha-form` i editoren — én for kortet, én for fanen — begge får `hass` ved endring.
Fire overskrifter i riktig rekkefølge, tre plasseringsvalg, og `align` lagres som valgt
mens tom tittel forsvinner.
