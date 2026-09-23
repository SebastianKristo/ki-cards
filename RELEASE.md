# ki-cards 5.61.0

## Bassengkortet: knappene og dagens regnskap i dashbordets form, og heroen kan tas vekk

`ki-basseng-card` 1.15.0.

**Knappene** på Oversikt var seks høye fliser i tre kolonner, med ikonet oppe og navnet nede. Nå er de
liggende, to i bredden, som de små flisene i dashbordet (`template_toggle_card_small`): ikonsirkelen
til venstre — den lyse, gjennomskinnelige med tynn kant — og navnet med tilstanden under til høyre.
Aktive fliser fylles med aktivfargen og får svart tekst. Trykk gir haptikk.

**Dagens regnskap** — pumpet i dag, effekt nå, spart i dag — beholder én flate med hårfine skiller,
men teksten er dashbordets: navnet i 12 px/500 med 70 % opasitet i stedet for versaler, tallet i vekt
300 i stedet for halvfet, og ikonet i tekstfargen.

**`hero: false`** tar vannheroen vekk fra Oversikt — for deg som har den som eget kort i dashbordet
(`visning: hero`) og ikke vil se den to ganger.

```yaml
type: custom:ki-basseng-card
hero: false
hurtig: …
graf: true
```

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass. Oversikt tegnet med
`hero: false`: ingen hero, seks liggende fliser med ikon, navn og tilstand, og de tre regnskapscellene.
