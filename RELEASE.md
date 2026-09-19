# ki-cards 5.7.0

## `ki-rom-card`: viftene ligger under Klima

De lå i «Enheter» sammen med bryterne. En vifte er noe man styrer sammen med varmen, ikke
en bryter på linje med stikkontakter.

Viftene kommer **sist** i Klima, etter varmekildene: man ser etter temperaturen først, og
vifta er justeringen.

### Hva som fulgte med

**Effektsummen flyttet også.** Viftene telles nå i Klima-seksjonens sum i stedet for i
Enheter. Summen for rommet er den samme; den står bare et annet sted.

**Tomhetsreglene måtte endres begge veier.** «Enheter» skjules når det ikke er noen
brytere, selv om rommet har vifter. «Klima» vises nå når det finnes vifter, selv uten
varmekilde — et rom med bare en vifte ville ellers mistet den helt.

**En vifte som også står i `klima_ekstra`** vises bare én gang.

Etikettene i editoren sier nå «Vis enheter (brytere)» og «Vis klima (varme og vifter)».

### Kontrollert

Seks kombinasjoner: bare vifte, bare bryter, varme med vifte, og ingenting — hver med
riktig seksjon synlig eller skjult. Og at en vifte i `klima_ekstra` ikke gjentas.

---

# ki-cards 5.6.0

Nytt kort `ki-robot-card` for robotklipper og robotstøvsuger.
