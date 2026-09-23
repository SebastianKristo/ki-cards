# ki-cards 5.60.0

## Bassenget: heroen som eget kort, ki-tabs i kortet, ny sprederscene

**Heroen som eget kort.** Vannflaten med temperaturen, statusmerket og omsetningene kan stå alene i
dashbordet:

```yaml
type: custom:ki-basseng-card
visning: hero
```

**Det animerte kortet henter tall fra KI Basseng.** `ki-basseng-hero-card` viser nå «3,90 av 2,50
omsetninger» under temperaturen, og pillen sier hva anlegget gjør — Filtrerer, Varmer opp, Spreder,
Boost — i stedet for bare hva varmepumpa gjør. Varmer og auto vises fortsatt først. Integrasjonen
finnes av seg selv; `ki: false` slår det av. Da er de to kortene kombinert: scenen fra det ene med
tallene fra det andre.

**Fanerada er ki-tabs.** Tynn ring, piller, og glidepilla med klem og sprett — samme rad som ellers i
pakka. Tannhjulet står utenfor som før.

**Sprederscenen er tegnet på nytt.** Kveldshimmel med stjerner og måne, vannflaten med to bølger som
driver, dysa midt i bassenget, fem stråler som bygger seg opp i bue og faller ned i vannet, dråper
langs buene, og ringer i vannet der strålene lander. Står sprederen, dempes dysa og alt er stille.
Hele svg-en står i klartekst i malen — ingen nøstede maler inni, som ville lagt elementene i feil
navnerom og gjort dem usynlige.

**Retting: dagvalget i grafen åpnet entiteten.** Panelhodet over grafen åpner vanntemperaturen når du
trykker på det (fra 1.13), og knappene 24 t / 3 d / 7 d ligger i det hodet — trykket gikk videre til
hodet. Knappene stopper det nå selv.

### Kontrollert

Begge byggesjekkene kjørt: 114 kort leser styles, 62 kort bygges med hass. Hero-kortet er tegnet med
KI Basseng til stede: «Varmer» når varmepumpa varmer, «Filtrerer» når den bare venter på mål, og
omsetningene i underteksten. Bassengkortet: fingeren på grafen, panelhodene og alle fanene som før.
