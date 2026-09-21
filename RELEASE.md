# ki-cards 5.45.0

## family-status-card: servernavnet som tittel eller under, og en undertekst med vær

Samme form som i companion-appen: stort navn med en fylt pil, og en linje under.

```yaml
type: custom:family-status-card
servere: "Oslo, Strömstad=Strømstad, Toten"
server_plass: tittel            # tittel | under
undertekst: "{temp} • {vaer}"
vaer: weather.forecast_home
```

**`server_plass: tittel`** (standard) — servernavnet er den store linja, med `▾` etter, og det er den
som åpner menyen. Undertekst under:

    Oslo ▾
    13 °C • Klar himmel

**`server_plass: under`** — hilsenen står som før og gjør det den alltid har gjort. Servernavnet
ligger på linja under, og det er **det** som åpner menyen:

    Hei Sebastian
    Oslo ▾ • 13 °C • Klar himmel

Det er altså alltid feltet med servernavnet i som er knappen.

**`undertekst`** tar `{temp}` og `{vaer}` fra værentiteten, pluss `{name}` og `{server}` som i
hilsenen. Været står på norsk («Klar himmel», «Delvis skyet», «Sludd» …). Mangler et av tallene,
fjernes skilletegnet som ville stått alene, så det aldri står «• Klar himmel». Underteksten virker
også uten `servere:`.

Pila er nå den fylte `mdi:menu-down`, som i appen, og snur seg når menyen er åpen. Menyen legger
seg under begge linjene. Alle de nye feltene ligger i Servere-panelet i editoren.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Logikken er i tillegg
kjørt for seg: `tittel` gir «Oslo» stort og «13 °C • Klar himmel» under; `under` gir «Hei
Sebastian» stort og servernavnet som knapp under; en værentitet som ikke finnes gir tom undertekst
uten løs prikk; og uten `servere:` er hilsenen som før, med underteksten om den er satt.
