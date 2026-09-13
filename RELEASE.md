# ki-cards 3.42.1

## `ki-sparing-card`: flisene fløt utenfor kortet

Verdiene i flisene hadde ikke overflow-vern. «18,89 kr/mil» i 26 px er bredere enn halve
kortet på en mobil, og siden `.flis` selv er et rutenett uten `min-width:0`, presset
innholdet flisa bredere enn kolonnen. Rutenettet vokste forbi kortbredden, og hele kortet
ble dyttet ut mot venstre — derfor lå ikonene halvveis utenfor kanten og kolonnene så
ujevne ut.

* `min-width:0` på flisa og alle barna, og `minmax(0,1fr)` på tekstkolonnen.
* Verdien klippes med ellipse i stedet for å presse på.
* Verditeksten er ned fra 26 til 23 px, ikonfeltet fra 58 til 50 px og kolonnen fra 76 til
  64 px, så «Audi A6 Avant 2011» og «18,89 kr/mil» får plass ved siden av hverandre.
* Under 380 px krymper det et hakk til.

## «Diesel ville kostet 0 kr»

Rett etter oppsettet står alt på null: integrasjonen har satt nullpunktet sitt, men bilen
har ikke kjørt noe ennå. Linja under beløpet sa da «Diesel ville kostet 0 kr, strømmen
kostet 0 kr», som ser ut som en feil.

Nå står det «Venter på de første kilometerne» til det finnes noe å regne på. Har bilen
kjørt, men prisen mangler, sier den det i stedet.
