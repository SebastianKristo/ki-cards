# ki-cards 5.34.0

## ki-tabs-card: velg fanen kortet åpner på

Feltet `default` fantes, men tok bare et nummer, og sto ikke i editoren. Nå tar det **tittelen på
fanen** også:

```yaml
type: custom:ki-tabs-card
default: Strøm        # eller default: 1
tabs:
  - title: Oversikt
    cards: […]
  - title: Strøm
    cards: […]
```

Tittelen er den som holder: flytter du om på fanene senere, peker et nummer plutselig på en annen
fane, mens tittelen følger med. Titler sammenlignes uten hensyn til store bokstaver og luft rundt.

I den visuelle editoren ligger valget under **Oppførsel** som **«Fanen kortet åpner på»**, med
fanene dine i lista og «Første fane» øverst. Det lagres som tittelen, og tas ut av YAML-en igjen
hvis du setter det tilbake til «Første fane».

Peker verdien ingen steder — en tittel som ikke finnes, et nummer utenfor lista eller et negativt
tall — åpner kortet på den første fanen i stedet for på ingen.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Oppslaget er i tillegg
kjørt for seg: uten `default` → 0, `2` → 2, `"1"` → 1, `"Varme"` → 2, `"  strøm "` → 1, ukjent
tittel → 0, `9` → siste fane, `-3` → 0. Editoren lister «Første fane» pluss de tre fanene, viser
«Varme» når det er valgt, og oversetter et gammelt `default: 1` til «Strøm» i feltet.
