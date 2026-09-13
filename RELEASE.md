# ki-cards 3.43.0

## Romflisene finner KI Energis romtemperatur selv

Termostat-knappene på den store romflisa i `ki-hjem-card` brukte en `input_number` du måtte
lage og koble opp selv, med `input_number.<klima>_teller` som gjetning.

Finnes `number.ki_rom_<rom>_temp` fra KI Energi 2.16, brukes den i stedet. Den setter alle
varmekildene i rommet på én gang — panelovn og oljefyr i stua, panelovn og gulvvarme på
kjøkkenet — så knappene virker uten oppsett.

Rekkefølgen er: KI Energis romtall, så `teller`/`input_number`, og til slutt
`climate.set_temperature` rett på klimaenheten som før. Steget leses fra entiteten, så
0,5-graders trinn virker.

Romnavnet gjøres om til entitetsnavn med samme regel som integrasjonen bruker — ø og ö
til o, æ/ä/å til a, resten til understrek. «Kjøkken» blir `number.ki_rom_kjokken_temp`.

`rom_tall: false` slår av automatikken, og en streng peker på en annen entitet.
