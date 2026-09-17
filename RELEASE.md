# ki-cards 3.88.0

## `ki-rack-card` finner enhetene selv

`oppdag: unifi | pve_ct | pve_vm`. Ingen liste å vedlikeholde — setter du opp en ny
container eller bytter et aksesspunkt, er den der ved neste oppdatering.

**UniFi** kjennes igjen på **par av en `device_tracker` og en «uptime»-sensor med samme
slug**, ikke på et navnemønster. Et mønster ville brutt så snart du døper om noe, og
telefonene dine ville blitt nettverksutstyr.

Oppdagelsen løser tre ting jeg før måtte skrive inn manuelt:

* **`_2`-etterfikset** på Dream Machine Pro finnes ved å se hvilken sensor som faktisk
  eksisterer — `sensor.x_uptime_2` eller `sensor.x_uptime`.
* **Portene telles** ved å gå oppover til `button.x_port_N_power_cycle` slutter å finnes,
  så Treets får sine 16 uten at tallet står noe sted.
* **LED, firmware, temperatur og latens** tas med bare der entitetene finnes.

Figuren gjettes fra navnet: Dream/UDM/gateway blir ruter, USW/Flex blir switch, U6/U7/Lite
blir aksesspunkt. Ruter først i lista, så switcher, så AP.

**Proxmox Extended Sensors**: alt som har en `_status`-sensor under prefikset. Knappene
tas med bare der de finnes, så en container uten «reset» får ikke en død knapp — og
tjenestenavnet i knappen utledes fra id-en, som dekker `speedtest_tracker_104` og
`haos_18_2_115`.

`overstyr:` retter navn eller ikon per enhet, eller skjuler den med `skjul: true`.

### En feil oppdagelsen avdekket

Knappene het enhetens navn — «Dispatcharr / Dispatcharr / Dispatcharr» i stedet for
«Start / Stopp / Restart». Løkkevariabelen het `navn`, og det skygget over enhetens
`navn` i samme funksjon. Den heter `kNavn` nå.

## Server-popupen

Nettverk og Proxmox er nå rene oppdagelseskort: tre linjer YAML i stedet for de 400 som
listet seks nettverksenheter og tolv Proxmox-enheter med alle entitetsnavn. Popupen er fra
1659 til 734 linjer.
