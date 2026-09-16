# ki-cards 3.78.0

## `ki-prosa-card` 2.13.0: låse-pillen bruker vanlig stil

Pillen i «Lås alle dørene» hadde den rosa-oransje gradienten, mens alle de andre pillene
i kortet er hvite på mørk bakgrunn. Låsing er en rutinehandling, og fargen betydde
ingenting — den gjorde bare denne ene pillen annerledes.

Den innebygde profilen setter nå `stil: vanlig` for `laser`, så den matcher resten.

**Bursdag beholder gradienten.** Der markerer den noe, og pillen er ment å skille seg ut
den dagen den vises.

Vil du ha gradienten tilbake på låsene:

```yaml
type: custom:ki-prosa-card
profil: stromstad
laser:
  stil: gradient
```

Stilene er `vanlig`, `varsel` (rød og pulserende), `gradient` og `glans` — de to siste kan
kombineres, som bursdagspillen gjør.
