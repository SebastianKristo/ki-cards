# ki-cards 4.20.0

## Nytt kort: `ki-varsling-card`

Bryterne fra **KI Varslinger og sikkerhet** finnes automatisk gjennom entitetsregisteret,
filtrert på plattformen `ki_notifications`.

Det erstatter `auto-entities`-lista der hver bryter måtte skrives inn med entitets-ID,
navn, ikon, tekst og seks linjer `variables`. **Legger du til en regel i integrasjonen,
dukker den opp av seg selv** — lista i YAML-en var utdatert i samme øyeblikk du la til
noe.

### Hvorfor registeret og ikke tilstandene

Plattformen står bare i entitetsregisteret. To brytere kan hete det samme og komme fra
hver sin integrasjon, og da er navnet ikke nok til å skille dem.

### Grupperes per regel

Integrasjonen lager ett config entry per regel, med én enhet hver. Kortet grupperer per
enhet og viser «2 av 3 på» per gruppe. Er det bare én gruppe, droppes overskriften — en
overskrift over alt er ikke en gruppering.

Enhetsnavnet fjernes når det gjentas i entitetsnavnet: «Autolås Autolås» blir «Autolås».

### Ikoner gjettes

Fra navnet, med de mest spesifikke først: «fastkjort» treffer låsevarselet og ikke låsen.
Tretten mønstre dekker låser, alarm, familie, støvsuger, vær, Ruter, strøm og oppstart.
`ikoner:` overstyrer.

### Valg

* `bare:` — bare disse, i den rekkefølgen. Med to faner som deler de samme bryterne
  slipper hver fane å kjenne den andres innhold for å skjule det.
* `ekstra:` — automasjoner utenfor integrasjonen
* `skjul:`, `navn:`, `undertekst:`, `ikoner:`
* Søkefelt fra åtte brytere; `sok: false` slår det av

Kort trykk veksler, langt trykk åpner entiteten — ellers må man inn i innstillingene for
å se hvilken automasjon en bryter egentlig styrer.

### Kontrollert

Seks brytere fra seks enheter: sensorer og brytere fra andre integrasjoner utelates,
ikonene treffer, enhetsnavn-duplikater fjernes, og `bare` styrer både utvalg og
rekkefølge. Ukjente navn i `bare` hoppes over uten å feile.

---

# ki-cards 4.19.0

`ki-rom-card` legger 200 px mellomrom nederst når rommet mangler seksjoner, så korte kort
ikke flyter midt i popupen. `bunn_gap` styrer det.
