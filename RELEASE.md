# ki-cards 3.46.0

## Romtemperaturen finnes på varmekilden, ikke på navnet

Kortene lette etter `number.ki_rom_<romnavn>_temp` ved å gjøre romnavnet om til et
entitetsnavn. Det krever at navnet på flisa er nøyaktig det samme som `rom`-feltet på
sonen i KI Energi — og det er det sjelden. Heter flisa «Soverom» mens sonen har
«Soverom barn», bommer oppslaget, og kortet faller tilbake på den gamle
`input_number`-telleren.

Romtallet lister varmekildene sine i attributtet `kilder`, med klimaentiteten på hver.
Kortene matcher nå på den i stedet: finn romtallet som inneholder klimaentiteten rommet
bruker. Navnet er bare reserve.

Det virker også begge veier for et rom med flere kilder — stua treffes enten kortet kjenner
panelovnen eller oljefyren.

Finner den fortsatt ingenting, skriver den én linje i konsollen med hvilke romtemperaturer
som finnes og hva den prøvde, så du ser om det er KI Energi som mangler eller sonen som
ikke har rommet satt.
