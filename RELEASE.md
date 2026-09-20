# ki-cards 5.38.0

## Kalenderen ser ut som månedskalenderen i Framover-fanen

`ki-kalender-card` hadde sitt eget rutenett: firkantede ruter i en boks, med prikker under
tallet. Nå er det det samme rutenettet som i `ki-lansering-card`:

- runde dager rett på bakgrunnen, uten boks rundt
- dager med noe på seg står lysere og i halvfet
- **merke med antallet** oppe til venstre, utenfor sirkelen
- i dag har ring, valgt dag er fylt og løftes litt
- måneden midtstilt mellom pilene

Er alt den dagen fra samme kalender, får merket fargen til den kalenderen; er det flere, står det
rosa som i lanseringskortet — da lyver ikke fargen om hvem det gjelder. Filterpillene og lista
under er som før.

```yaml
visning: antall      # standard
visning: prikker     # den gamle formen: én prikk per hendelse, fargene ved siden av hverandre
```

`examples/kalender-popup.yaml` viser Kalender-fanen med en fanerad inni: «Neste» med kortene dine
slik de er, og et kalenderikon ved siden av — samme form som Alle / Serier / Filmer + kalender i
Framover-fanen.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Kortet er i tillegg
kjørt mot et oppdiktet kalender-API: 35 ruter for september 2026, fire dager med merke og riktige
tall, i dag merket, hendelsene for dagen i lista med «Hele dagen» og «09:00 – 10:00», og en
heldagshendelse fredag–mandag som legger seg på fredag, lørdag og søndag. Filter av endrer tallene
i merkene, og bla fram gir oktober.
