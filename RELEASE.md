# ki-cards 8.99.7

Bygget oppå 8.99.6 fra GitHub.

## ki-kamera-card: ruteoppsett per bruker og enhet

Hver bruker kan ha sitt eget ruteoppsett i Alle-visningen, og hver enhet sitt eget — iPaden på veggen, telefonen og
PC-en husker hver sin, og to brukere på samme iPad har hver sin.

**Tilpass rutene …** nederst i oppsettsmenyen (trykk på kameraikonet ved tittelen) åpner et panel under tittelen:
- **Oppsett:** Mosaikk, Hovedkamera, Rutenett eller Liste.
- **Rekkefølge:** flytt kameraene opp og ned — det første er hovedkameraet i Hovedkamera og Mosaikk.
- **Vis / skjul:** øyet tar et kamera ut av Alle-visningen (fanen for kameraet er der fortsatt).
- **Tilbake til standard** fjerner det du har tilpasset.

Valget lagres i nettleseren under brukeren, så det følger brukeren på den enheten. Kameraene huskes på navnet, så
rekkefølgen tåler at nye kameraer legges til. Å velge et oppsett rett i menyen lagres også nå.

**Standard per bruker** kan settes i konfigurasjonen — det gjelder til brukeren tilpasser selv:

```yaml
per_bruker:
  Rune:
    grid_layout: liste
    rekkefolge: [Hage, Inngang]
    skjul: [Garasje]
```

### Kontrollert

Begge byggesjekkene kjørt. Kortet er kjørt med fire kameraer og tre brukere: Sebastian åpner «Tilpass rutene …»
(«For Sebastian på denne enheten», fire rader), skjuler Bod, flytter Hage opp og velger Hovedkamera — det lagres og
står likt i en ny visning; Cybele har fortsatt standardoppsettet; Rune får listeoppsettet fra `per_bruker`; og
«Tilbake til standard» fjerner det lagrede.
