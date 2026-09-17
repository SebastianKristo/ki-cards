# ki-cards 3.87.0

## Nytt kort: `ki-rack-card` — fliser, med detaljene bak et trykk

De forrige rundene gjorde kortene lavere. Det var å behandle symptomet: problemet er
**prinsippet**, ikke høyden. Et fullbreddekort per enhet stablet nedover blir rulling
uansett hvor lavt hvert kort er — seks nettverksenheter er seks skjermhøyder.

`ki-rack-card` legger enhetene som fliser i et rutenett, to per rad, med fire
opplysninger hver: ikon, navn, statusprikk, ett stort tall og én liten linje. Hele parken
er på én skjerm.

**Trykker du på en flis, glir detaljene inn over rutenettet** i stedet for å ligge under
det, med en «Alle enhetene»-knapp tilbake. Da ser du én enhet av gangen og har ingenting å
bla forbi. Detaljene er `ki-enhet-card` som før, så alt innholdet er med — og `under:`
legger flere kort under detaljene, som PoE-portene på Treets.

Uten svar vises som oransje prikk og «Uten svar», ikke som nede — vi vet ikke, og det skal
se annerledes ut.

Heltall blir heltall: «0 klienter», ikke «0,0 klienter».

## Server-popupen

**Nettverk** er fra sju kort til fire: statuskort, ett flisrutenett med alle seks
enhetene, og Wi-Fi. Før var det tre enhetskort med hver sin seksjonsoverskrift.

**Proxmox** har to flisrutenett — tolv containere og maskiner som fliser i stedet for tolv
nøstede faner. CPU på flisen, RAM under, alle knappene bak trykket.

Entitetsnavnene er kontrollert for de skjeve tilfellene:
`button.3_ct_speedtest_tracker_104_stop_speedtest_tracker` og
`button.4_vm_haos_18_2_115_reset_haos_18_2`.

YAML-en er generert som data og skrevet av yaml-biblioteket, ikke satt sammen som tekst.
Første forsøk regnet innrykket manuelt og la enhetene på feil nivå, så halve fanen ble
tolket som tomme kort.
