# ki-cards 3.69.0

## `ki-klima-pro-card`: brytere med egen entitet oppdaterte ikke

Slo du av eller på berederbryteren under Varmtvann, ble bryteren stående i gammel
stilling til du lukket kortet og åpnet det igjen.

Kortet tegner bare om når signaturen endrer seg, og signaturen bygges av en fast liste
over fulgte entiteter. Men mange rader henter entiteten sin fra et attributt — bereder­
bryteren er `a("bryter", "switch.varmtvannsbereder")`, håndklevarmeren likeså. Bruker du
standardnavnet, virker det; har du en annen entitet, sto den ikke i lista, og da endret
ikke signaturen seg i det hele tatt når du trykket. Tjenestekallet gikk gjennom — det var
bare visningen som ikke fulgte etter.

Etter hver opptegning plukkes nå entitetene opp fra det som faktisk er tegnet, og legges
i den fulgte lista. Neste tilstandsendring treffer dermed uansett hvilken entitet du har
konfigurert. Oppsamlingen settler seg selv: andre gang finnes de allerede.

Gardinbryteren `input_boolean.ki_gardin_folg_sol` var i tillegg den ene faste bryteren
som manglet i lista, og hadde samme symptom. Nå er alle med, kontrollert mekanisk mot
markupen.
