# ki-cards 3.45.0

## Termostatknappene setter og leser tilbake det samme

**Klimakortet i rom-popupen** (`ki-rom-card`, inne i expander-kortet) bruker nå
`number.ki_rom_<rom>_temp` fra KI Energi når den finnes, på samme måte som romflisa fikk i
3.43. Trykk opp eller ned skriver til romtallet, og tallet i midten leses tilbake fra
nøyaktig samme entitet — ikke fra en teller ved siden av som kan komme ut av takt.

Rekkefølgen er den samme begge steder: KI Energis romtall, så `input_number`-telleren, og
til slutt `climate.set_temperature` rett på enheten. Steget hentes fra entiteten, så
halvgradersendringer virker.

**Uten KI Energi skrev romflisa bare til den første varmekilden.** Et rom med både
panelovn og oljefyr fikk dermed bare den ene justert, mens visningen viste den enes
settpunkt som om det gjaldt rommet. Fallback-en sender nå til alle klimaenhetene i rommet.

`rom_tall: false` slår av oppslaget, og en streng peker på en annen entitet — begge
kortene forstår det.
