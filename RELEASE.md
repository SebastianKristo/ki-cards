# ki-cards 5.29.0

## Fanerada står over kortet, og pilla har riktig farge

**Rada er sitt eget spor.** Den lå inne på kortflaten sammen med tallene; nå ligger den over
kortet, med egen bakgrunn og luft under — samme plass et `ki-tabs-card` ville hatt. Kortet under
er uendret.

**Fargen.** Pilla hentet fargen fra `--active-big` uten reserve. Når variabelen ikke når inn i
kortet, faller bakgrunnen helt bort, og igjen står bare skyggen — en mørk flis med en kant, i
stedet for en fylt pille. Det var det du så. Regelen ligger nå i kortet selv, sterkere enn basens,
og med `#ee95ff` som reserve:

```css
.skinne .ki-pille { background: var(--active-big, #ee95ff); }
```

Den valgte fanen får samme farge og mørk tekst, så markeringen ser lik ut enten glidepilla er der
eller ikke — står kortet uten ki-cards-basen, er det fanen selv som bærer fargen. Kalenderknappen
følger samme farge når den er på.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Rota i kortet er nå
`style` + `.skinne` + `.k`, og rada finnes ikke lenger inne i `.k` — kontrollert i alle fire
fanene, med og uten integrasjonen, pluss `faner: false` som fortsatt gir bare måneden uten rad.

Inneholder også 5.26.0 til 5.28.0. Ingen andre kort er rørt.
