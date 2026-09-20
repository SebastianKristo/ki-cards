# ki-cards 5.19.0

## `ki-strompris-card`: enkel visning

```yaml
type: custom:ki-strompris-card
enkel: true
tittel: Strømpriser
hoyde: 260
```

Overskrift til venstre, dagsvelger til høyre, og grafen i sin egen flate under. Ingenting
annet.

Hovedtallet, statistikken, billigste vindu, forklaringen og spart-tallene er nyttige —
men de konkurrerer med kurven. Vil man se prisen time for time, **er** kurven kortet, og
da skal den få plassen.

Overskriften står utenfor kortflata, så grafen fyller hele.

Standarden er uendret: uten `enkel: true` ser kortet ut som før.

### Kontrollert

Vanlig visning har alle åtte delene. Enkel har overskrift, dagsvelger, graf og tidsakse
— og verken hero, statistikk, vindu eller forklaring. Grafen tegnes, dagsvelgeren virker,
og klokkeslettene står på aksen.

---

# ki-cards 5.18.1

Redigereren i faneeditoren lukket seg for hver tast; ekkoet sammenlignes nå uavhengig av
nøkkelrekkefølge, og redigereren bygges aldri om mens den er åpen.
