# ki-cards 5.17.0

## `ki-utelys-card`: statusteksten når den mangler

Kortet viste «ukjent» før KI Utelys hadde rukket å sette status — eller hvis
integrasjonen ikke er installert.

Nå kjenner kortet igjen ukjente verdier og forklarer i stedet hva som faktisk skjer:

* **«Venter på mørket»** når sola er oppe og automatikken er på
* **«Klar – tennes snart»** når det er mørkt, men lyset ennå ikke er tent
* **«På»** når lyset lyser
* **«Manuell · av»** når automatikken er slått av

Statusen vises ellers slik Home Assistant oversetter den, med `formatEntityState`. Uten
den brukes råverdien.

### Kontrollert

Sju tilfeller: vanlig status, uten `formatEntityState`, status satt til «ukjent», status
som mangler helt — både med sola oppe og i mørket — og med automatikken av.

---

# ki-cards 5.16.1

Lagring fra kortdialogen kommer tilbake til fanen; begge dialog-API-ene støttes.
