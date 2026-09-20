# ki-cards 5.12.0

## UI-editor for `ki-varsling-card`

Kortet måtte settes opp i YAML. Nå kan det redigeres i brukerflaten, og nye
integrasjoner legges til uten at noen må skrive om konfigurasjonen.

### Integrasjonene hentes fra dine egne entiteter

Lista fylles fra entitetsregisteret: alt som faktisk har brytere hos deg står der, med
antall og sortert etter størrelse.

```
ki_energi (206)
ki_notifications (14)
zwave_js (3)
```

Antallet er med fordi det sier noe om hva du er i ferd med å slå på. 206 entiteter fra
KI Energi er ikke det samme som 14 fra varslingsintegrasjonen — selv om kortet filtrerer
bort alt som ikke handler om varsling.

Dukker det opp en ny integrasjon med varslingsbrytere, står den i lista av seg selv.

### De andre feltene

**Bare disse** og **Ikke disse** skrives som komma­separert tekst og lagres som liste.
De filtrerer på regelnavn, ikke entitets-ID — delvis treff holder, og store og små
bokstaver spiller ingen rolle.

**Ekstra brytere** er en entitetsvelger, så du slipper å skrive ID-er.

Under **Visning**: hovedbryter per regel, gruppering, antall og søkefelt.

### Standardverdier skrives ikke

Lar du alt stå som det er, blir konfigurasjonen tom i stedet for full av
`grupper: false` og `sok: true` som ser ut som noe du har valgt.

### Kontrollert

Integrasjonene sorteres etter antall og teller bare brytere — en `sensor.` fra samme
integrasjon regnes ikke med. Kommalista blir til YAML-liste. Standardverdier gir tom
konfigurasjon, og endrede verdier lagres.

---

# ki-cards 5.11.0

Kortet i fanen listes som en rad, og blyanten åpner Home Assistants egen kortdialog.
