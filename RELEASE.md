# ki-cards 3.24.0

## Dyplenken til en fane virket ikke fra ki-hjem-card

`KI.navigate` forsto `#alarm::laser`, men ki-hjem-card bygger flisene som button-card med
`tap_action: navigate` — den går gjennom Home Assistants egen navigering, ikke gjennom
`KI.navigate`. Hele strengen havnet derfor i adressefeltet, og bubble-card kjente ikke
igjen `#alarm::laser` som sin hash. Ingenting åpnet seg.

Fane-delen fanges nå globalt i bundelen: en vakt på `hashchange` og `location-changed`
rydder hashen til `#alarm` og melder fra om fanen. Det virker uansett hvilket kort som
navigerer, og uansett om stien går gjennom `KI.navigate` eller ikke.

```yaml
hjem:
  las: lock.dorlas
  las_path: '#alarm::laser'
```

## Tastaturet dro deg nedover i kortet

Når tastaturet foldes ut og igjen, endrer kortets høyde seg kraftig, og du ble stående
midt nede i kortet etter at koden var tastet ferdig. En `ResizeObserver` på tastaturboksen
ruller nå kortet til toppen når høyden endrer seg mer enn 40 px. Små justeringer teller
ikke. Slås av med `rull_topp: false`.

## Profilbilder i loggen

Låste Rune opp med ansiktsgjenkjenning, vises bildet hans i stedet for ikonet. Personen
finnes automatisk blant `person.*`-entitetene ved å matche navnet fra sensoren mot
`friendly_name` eller entitets-ID-en, så Rune, Cybele og Sebastian kommer med uten
oppsett. Har du navn som ikke matcher, sett dem selv:

```yaml
logg:
  ansikt: sensor.ansiktsgjenkjenning_dorlas_sist_last_opp_av
  personer:
    Rune: person.rune
```

Finnes ingen person eller mangler bildet, brukes ansiktsikonet som før.
