# ki-cards 3.85.0

## `ki-enhet-card`: kortet er halvert i høyde

Det var kortet som skapte rullingen. Med seks nettverksenheter etter hverandre ble det
bare lange kort å bla forbi.

**Heroen er ned fra 180 til 132 px.** Målerringene er 48 px i stedet for 56, og etikettene
under dem klippes med ellipse i stedet for å presse kortet bredere.

**Detaljlista er lukket.** Den er den lengste delen av kortet, og den leses bare når noe er
galt. Nå står den bak «Detaljer» med antall felt og en pil — trykk for å åpne. `info_apen:
true` åpner den fra start hvis du vil ha den gamle oppførselen.

Valget huskes i kortet, ikke i konfigurasjonen: neste gang du åpner popupen er den lukket
igjen, som den skal være.

En felle underveis: kortet har to måter å vise info på, `.info`-fliser og `.panel`-rader,
og det er radene som faktisk brukes. Første forsøk pakket inn fliskoden, altså grenen som
ikke er i bruk, og da skjedde ingenting. Begge er nå dekket.

## Server-popupen: Nettverk-fanen

De tre `ki-unifi-card`-blokkene med hver sin seksjon — Ruter, Switcher, Aksesspunkt — er
slått sammen til **ett kort med alle seks enhetene i velgeren**. Før måtte du rulle gjennom
dem etter hverandre; nå bytter du med ett trykk.

`figur` settes per enhet i stedet for på kortet, så ikonet fortsatt sier hva det er når de
ikke lenger er delt i grupper.

Fanen er fra fjorten kort til åtte, og med det lavere enhetskortet er den nå omtrent en
tredel så høy.
