# ki-cards 3.91.0

## `ki-basseng-card` 1.4.0: animasjon og graf for varme og sirkulasjon

Kortet hadde én bølge som gikk uansett hva som skjedde, og én graf som viste
temperaturen. Du kunne ikke se om bassenget sirkulerte, varmet, eller begge.

**Sirkulasjon og oppvarming er nå to forskjellige animasjoner**, og de kan gå samtidig:

* **Sirkulasjon** — strømmer som drar sidelengs gjennom vannet, seks lag i ulik høyde og
  fase. Vann som beveger seg.
* **Oppvarming** — bobler som stiger opp gjennom vannet, og varmedis som flimrer over
  overflaten. Varme som stiger.
* To bølger i stedet for én, den andre tregere og motsatt vei. Én bølge alene ser
  mekanisk ut.

«Varmer» avgjøres av effekten varmepumpa faktisk trekker — over 100 W — ikke av at den
står i `heat`. Pumpa kan stå i heat uten å kjøre, og da skal ingenting boble.

## Ny graf: sirkulasjon og oppvarming

Temperaturgrafen viser resultatet. Den nye viser arbeidet: pumpa som fylt blå flate,
varmepumpa som oransje over, i samme tidsvindu og med felles skala. Da ser du **om varmen
kom mens vannet sirkulerte** — som er hele forutsetningen for at den varmer noe.

Under grafen står forbruket i kWh for hver av dem, regnet med trapesregel over tiden, og
toppeffekten i vinduet.

To valg verdt å nevne:

* **Trappeform, ikke rette linjer.** En pumpe som slår på går fra 0 til 200 W momentant.
  En skrå linje mellom punktene ville antydet en opptrapping som ikke finnes.
* **Felles skala.** Med egen skala per serie ville en pumpe på 200 W sett like stor ut som
  en varmepumpe på 2 kW.

Historikken henter nå varmepumpeeffekten i tillegg til pumpeeffekten, i samme spørring.

Fanene er uendret — det er `simple-tabs`-formen fra før.
