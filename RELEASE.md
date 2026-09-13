# ki-cards 3.45.1

## «Kunne ikke utføre handlingen input_number/increment»

Klimakortet i rom-popupen bygget kallet feil:

```js
{ service: 'input_number.increment', data: { entity_id: teller, amount: 1 } }
```

`entity_id` må ligge i `target`, ikke i `data` — derfor klagde Home Assistant på at kallet
«must contain at least one of entity_id, device_id, area_id…». Og `increment` tar ingen
`amount`; steget ligger på selve `input_number`-hjelperen. Begge deler er rettet, også i
romflisa, som sendte en `amount` den ikke skulle.

## Hvorfor den ikke brukte KI Energi

Kortene ser etter `number.ki_rom_<rom>_temp`. Finnes den ikke, faller de tilbake på
`input_number`-telleren — og det var det som skjedde her.

Finner de ingen match, skrives det nå én linje i nettleserkonsollen med hvilke
romtemperaturer som faktisk finnes, eller at det ikke finnes noen i det hele tatt. Da ser
du med én gang om det er romnavnet som ikke stemmer, eller om KI Energi mangler.

Romtallet krever KI Energi 2.16 eller nyere, og at sonen har et `rom`-felt. For et rom som
heter «Soverom» blir entiteten `number.ki_rom_soverom_temp`.
