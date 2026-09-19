# ki-cards 4.16.0

## `utenfor: true` — en fane utenfor pillegruppa

```yaml
- icon: mdi:gift-outline
  aria: Post og bursdager
  utenfor: true
  cards: [...]
```

Fanen tas ut av pillerammen og får egen rund kant ved siden av, slik tannhjulet i
bassengkortet står.

Det skiller **et vedlegg** fra fanene som er likeverdige valg. Kalender og Framover er to
måter å se det samme på; post og bursdager er noe annet man stikker innom. Inne i samme
ramme ser de ut som tre jevnbyrdige alternativer, og det er ikke det de er.

### Tre detaljer

* Fanen **teller ikke i bredderegningen**. Kortet måler pillene for å avgjøre om de får
  plass eller må rulle — en knapp utenfor rammen skal ikke påvirke den avgjørelsen.
* Den er heller ikke med i den rullbare rada eller nedtrekksmenyen, av samme grunn.
* `data-i` beholdes, så fanevalg, animasjon og `ki-tab-changed` virker som for de andre.

Kontrollert: to piller i gruppa, én knapp utenfor i `.bar`, to i bredderegningen, tre
paneler, og `data-i="2"` på knappen.

---

# ki-cards 4.15.0

UI-editor for `ki-tabs-card`: faner kan flyttes, legges til og fjernes, kortene i hver
fane redigeres med Home Assistants egen kortvelger, og panelet glir inn fra den siden du
kom fra.

# ki-cards 4.14.0

Pakker fra Norwegian Parcel Tracker i `ki-post-card`, funnet selv. Bursdagsskjemaet lager
én gjentakende oppføring i stedet for ti kopier.
