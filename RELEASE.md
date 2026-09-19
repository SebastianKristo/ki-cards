# ki-cards 4.25.0

## `ki-tabs-card`: pilla glir, og den kan dras

### Den aktive fyllingen er nå ett element

Før var `background` på den aktive fanen skrudd av og på. Nå er det **én pille som glir**
mellom fanene, med fanene liggende over så teksten er lesbar mens den passerer under.

Det var ikke bare pynt: en bakgrunn som skrus av og på kan ikke dras i.

### Dra

Hold på pilla og dra — den følger fingeren fritt, ikke fane for fane, og det er det som
gjør at den føles festet til fingeren. Den snapper til nærmeste fane først når du
slipper.

Under seks piksler teller som **trykk, ikke dra**. Uten den terskelen ville et vanlig
trykk med litt skjelv blitt tolket som en bevegelse, og du kunne endt på nabofanen.

Slipper du utenfor en fane, eller avbryter, snapper pilla tilbake dit den var.

### Trykk

Fanen synker til 94 % mens fingeren er nede, og pilla klemmes litt sammen. Uten det er
det ingen respons i det øyeblikket man trykker — bare et resultat et kvart sekund senere.

### Detaljer

* Pilla plasseres i `requestAnimationFrame` etter bygging. `offsetWidth` er 0 før første
  layout, og uten dette sto pilla usynlig til første fanebytte.
* Den følger med når den rullbare rada scrolles.
* `prefers-reduced-motion` slår av både glidningen og trykket.

### Kontrollert

Stilen: glidende pille, ingen overgang under dra, trykk som krymper, fanene over pilla.
Logikken: terskel mot skjelv, snapping til nærmeste, avbrudd håndtert, klemt innenfor
rada. Snapping testet mot tre faner — slipp ved x = 47 gir fane 0, 136 gir fane 1, 300
gir fane 2.

---

# ki-cards 4.24.0

`family-status-card` finner sonene selv og bruker sonens eget ikon; `locations:` er nå
overstyringer.
