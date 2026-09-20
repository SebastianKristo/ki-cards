# ki-cards 5.20.0

## Dagsvelgeren i strømpriskortet er lavere, og høyden er din

Rada med «I dag / I morgen» var 48 px høy. Den er nå 44, og du bestemmer selv:

```yaml
type: custom:ki-strompris-card
fane_hoyde: 44      # hele rada, i px (standard 44)
fane_tekst: 14      # valgfritt – utelat den, så følger skriften høyden
```

Høyden ligger nå i selve knappen (`height`) i stedet for i loddrett luft (`padding`). Det er
forskjellen som gjør at du kan gå helt ned til 28–30 px uten at teksten klippes: med padding
ville skriftens egen linjehøyde lagt seg i bunnen og satt et gulv.

Sideluften og skriftstørrelsen skaleres med høyden, så pilla beholder formen sin når den blir
lav — `fane_tekst` overstyrer skriften hvis du vil ha noe annet. På skjermer under 420 px
strammes sideluften inn som før.

Begge feltene ligger i den visuelle editoren: **Høyde på fanerada (px)** og **Skriftstørrelse i
fanene**.

### Kontrollert

`node --check` og begge byggesjekkene (`verifiser-styles`, `verifiser-kort`) kjørt — 110 kort
leser styles, 59 kort bygges med hass. Standarden gir 36 px pille inni en 44 px rad med 14 px
tekst; `fane_hoyde: 30` gir 24 px pille med 11 px tekst, `fane_hoyde: 56` gir 48 px pille med
15 px tekst. Den glidende pilla (`KI.pillefaner`) måler fortsatt med `offsetLeft`/`offsetWidth`
og treffer riktig i alle tre høydene.

Ingen andre kort er rørt.
