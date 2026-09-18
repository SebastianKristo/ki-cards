# ki-cards 4.2.0

## `ki-alarm-card` 1.3.0: `zones:` som oppslag krasjet kortet

```
Uncaught (in promise) TypeError: (this._config.zones || []).map is not a function
    at KiAlarmCard._sonedata (ki-alarm-card.js:235)
```

`zones:` må være en liste. Er den skrevet som et oppslag — uten bindestrek foran hver
sone — ble `.map` kalt på et objekt, og kortet kastet **før det rakk å tegne noe**. Da
står et gammelt bilde igjen, og all ny konfigurasjon ser ut til å bli ignorert. Det var
grunnen til at `hero: false` «ikke gjorde noe».

Kortet tar nå imot begge former. Et oppslag gjøres om til en liste der nøkkelen blir
tittel, med en advarsel i konsollen om hva som bør rettes i YAML-en. Er `zones:` noe helt
annet enn en liste eller et oppslag, brukes ingen soner i stedet for at kortet dør.

Testet: riktig liste går urørt gjennom, oppslag blir liste med nøkkelen som tittel, en
egen `title:` i sonen vinner over nøkkelen, manglende `zones` gir tom liste, og en streng
gir tom liste med advarsel.

## Om duplikate ressurser

Konsollen viser at `ki-alarm-card` defineres to ganger:

```
KI-ALARM-CARD 1.2.1    ki-alarm-card.js:18
KI-ALARM-CARD 1.2.1    ki-cards.js?hacstag=…:25621
ki-cards: ki-alarm-card er allerede definert – hopper over
```

Den frittstående `ki-alarm-card.js` lastes først og vinner; bundelens kopi hoppes over.
Denne rettelsen ligger i bundelen, så den får ingen virkning før den frittstående
ressursen er fjernet under Innstillinger → Dashbord → Ressurser.

Samme situasjon som `ki-klima-pro-card` tidligere i dag, og samme løsning: én kopi, ikke to.
