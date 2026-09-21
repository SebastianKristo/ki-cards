# ki-cards 5.48.0

## family-status-card: velg siden serverbyttet åpner

`server_sti` fantes, men het bare «Side som åpnes» i editoren og sto som standard på `lovelace` —
altså standarddashbordet på den andre serveren, ikke ditt.

```yaml
server_sti: /dashboard-mysmarthome     # skråstrek foran er valgfritt
```

gir `homeassistant://navigate/dashboard-mysmarthome?server=Strømstad`.

**Ny standard:** uten `server_sti` åpner byttet **samme dashbord som du står i nå**. Står du i
`/dashboard-mysmarthome` i Oslo og bytter til Toten, havner du i `/dashboard-mysmarthome` på Toten.
Bare hvis kortet ikke vet hvor det står, brukes `lovelace` som før. Et sted kan fortsatt ha sin
egen `sti:`, som vinner over begge.

**Servernavnet skrives som det står.** Lenka var kodet fullt, så «Strømstad» ble til
`Str%C3%B8mstad`. Mushroom-kortet ditt som virker, har `server=Strømstad` med ø-en rett i lenka, og
det er ikke sikkert appen dekoder navnet før den leter etter serveren. Nå kodes bare tegn som ville
brutt selve lenka (mellomrom, `&`, `?`, `#`, `%`).

Feltet i editoren heter nå «Side som åpnes (f.eks. /dashboard-mysmarthome)».

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Lenkene er bygget for
seg: `server_sti: /dashboard-mysmarthome` → `…/dashboard-mysmarthome?server=Strømstad`; uten sti,
stående i `/dashboard-mysmarthome/hjem` → `…/dashboard-mysmarthome?server=Toten`; `sti: hytta` på
stedet vinner over `server_sti`; ingen sti og ukjent side → `…/lovelace?server=Oslo`.
