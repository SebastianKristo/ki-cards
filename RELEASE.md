# ki-cards 3.54.0

## Nytt kort: `ki-vann-card`

Viser hva vannet går til, fra sensorene til KI Vann.

```yaml
type: custom:ki-vann-card
prefiks: sensor.hjemme_
mal: 400          # liter per dag du sikter mot – styrer hvor høyt vannet står
```

Heroen er en tank som fyller seg: vannstanden er dagens forbruk mot målet, med to bølger
som ruller i ulik fart og motsatt retning, og dråper som faller ovenfra. Liter i stort til
venstre, kostnaden for vann og avløp til høyre, og hva vannet stort sett gikk til under.

Under heroen en delt stolpe med én farge per kategori, og så kategoriene i rekkefølge
etter forbruk — ikon i farget sirkel, liter og andel. Trykk åpner more-info.

Nederst to brikker: modellens status med antall timer den har lært av, og hvor stor andel
av forrige time sensorene forklarer. Er den under 60 %, blir brikken oransje.

Fargene er hentet fra temaet, så kortet følger resten av dashbordet. `prefers-reduced-motion`
slår av alle animasjonene.

## `examples/vanning-popup-faner.yaml`

To faner til vanningspopupen, bygget i de samme komponentene som resten av dashbordet.

**Vanning** — `ki-vanning-card` med flytmåler, vannet i dag og neste vanning som fliser,
og en månedsgraf. Øverst et grønt banner som bare vises mens et program faktisk vanner,
med sonen som går.

**Vann** — `ki-vann-card`, liter per person, andel forklart, forbruk per dag, og en graf
med de tre største kategoriene ved siden av hverandre så du ser vanene endre seg over
uker. Nederst et oransje varsel som dukker opp når mindre enn halvparten av forrige time
kan forklares — det er lekkasjesignalet.
