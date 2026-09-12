## Endret

**ki-rom-card 1.11.0**
- Enheter-seksjonen parer nå bryter og effektsensor mot **samme fysiske enhet** i enhetsregisteret, ikke bare på navn. `switch.fryseskap` finner `sensor.hvitevarer_plug_1_power` selv om de heter helt ulikt
- Ligger det flere sensorer på enheten, velges den som måler effekt nå – døgn- og totaltall (`_energy_daily`, `_total`) velges bort, og alt i kWh forkastes
- Navnemønstrene er utvidet med `_strom` og `_stromforbruk`, og som siste utvei godtas en sensor som starter med samme slug og måler watt
- Registeret hentes én gang per sidevisning, og kortene tegnes på nytt når det er klart
