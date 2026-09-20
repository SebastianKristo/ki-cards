# ki-cards 5.25.0

## ki-strom-detaljer-card er med i bundelen

Kortet ditt er lagt inn som `src/89-ki-strom-detaljer-card.js` og følger nå med ki-cards, i stedet
for å måtte installeres som egen ressurs. Koden er tatt inn uendret — den registrerer seg gjennom
`KI.define` som alle de andre, så en eldre kopi installert separat ikke lenger kolliderer, men
hopper over med en advarsel i konsollen.

Fem visninger, valgt med `vis:`:

```yaml
type: custom:ki-strom-detaljer-card
vis: regning        # regning | effekt | effektledd | norgespris | sammenligning
```

- **regning** – estimat for måneden, fordelt på strøm, nettleie og avgifter, med Norgespris og
  strømstøtte trukket fra, og forbruk dag mot natt/helg under
- **effekt** – snittet av de tre toppene, margin til neste trinn og hva trinnet over koster
- **effektledd** – søyle per måned, trykkbar, med avvik fra snittet
- **norgespris** – spart i år, med time, dag og uke som brikker
- **sammenligning** – spotpris mot Norgespris med periodevelger

Alle sensorene har standardverdier fra installasjonen din og kan overstyres under `sensorer:`.

Kortet har fått ikon i `brand/` (kvittering med tre søyler foran, i samme stil som de andre) og en
rad i kort-tabellen i README.

### Kontrollert

Begge byggesjekkene kjørt med kortet inne: 111 kort leser styles, 60 kort bygges med hass — begge
tallene er ett høyere enn før. Kortet bruker ikke LitElement, så det pakkes i en egen try-blokk:
feiler det, tar det ikke med seg resten av bundelen.

Ingen andre kort er rørt.
