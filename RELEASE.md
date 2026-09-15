# ki-cards 3.63.0

## `ki-k2-scene-card` 1.1.0: skrivehodet følger emnet

Kommentaren i koden sa at hodet «stiger med laget», og `dyseY` ble regnet ut på linje 174
— men verdien ble aldri brukt noe sted. Hodet sto i fast høyde mens emnet vokste oppover,
så ved høy framdrift stakk dysa ned inni emnet.

Hodet senkes nå til platen ved start og stiger med emnet, slik at dysespissen ligger to
piksler over øverste lag hele veien. Er printeren av, parkeres hodet øverst i stedet for
å stå nede ved platen som om den er midt i en jobb.

Geometrien er kontrollert i alle fire tilstandene: dysa er over emnet, og hodet holder seg
innenfor kabinettet.

## Resten av scenen

**Lagstriper.** Emnet var en glatt boks. Nå tegnes en linje per fjerde piksel, så det ser
printet ut i stedet for støpt. Antallet vokser med framdriften.

**Øverste lag lyser.** En tynn varm stripe på toppen av emnet, som pulserer mens den
skriver — det er der plasten nettopp ble lagt.

**Dysa glør** når den er varm, med uskarp kant.

**Kammerlyset** slås på mens den skriver og dempes når den er ferdig.

**Hodet svinger som en portal.** Den gamle bevegelsen var en ren fram-og-tilbake og så ut
som en metronom. Nå går den litt forbi ytterkanten og hviler et øyeblikk i enden av
sveipet.

**Vifta går dobbelt så fort når det er varmt**, slik den gjør i virkeligheten.

**Framdriftslinja** har fått et lysstrøk som går over mens den skriver.

Plasttråden legges nå ut rett under dysa i stedet for å strekke seg ned til platen — med
hodet i riktig høyde er det bare et par piksler mellom dyse og emne, og en lang tråd der
ga ingen mening.

Alt slås av med `prefers-reduced-motion`.
