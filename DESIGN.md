# Designspråket i mysmarthome

Alle kort i ki-cards skal se ut som resten av dashbordet. Dette er reglene, hentet fra
button-card-malene i dashbordet (`universal_base`, `universal_sensor_ny`, `template_sensor_small`
m.fl.). Bruk dem før du finner på noe eget.

## Farger – alltid temaets variabler

| Bruk | Variabel |
|---|---|
| Popup-bakgrunn | `--gray000` |
| Kortflate | `--gray100` (kort i seksjoner) / `--gray200` (kort i popup, fliser) |
| Innvendige flater, spor | `--gray100` inne i et `--gray200`-kort |
| Tekst | `--gray1000`, dempet `--gray800` |
| Tekst på fylt flate | `--black` |
| Aktiv/på | `--active-big` (gradient) — `--active-small` for små |
| Status | `--red`, `--orange`, `--yellow`, `--green`, `--blue`, `--purple`, `--pink` |

Aldri hardkodede hex-verdier uten reserve: `var(--active-big, #ee95ff)`.

## Former

- Kort: `border-radius: 24px` (store) / `22px` (fliser). Piller `999px`. Sirkler `50%`.
- Store fliser er 160 px høye, små 66 px.
- Ingen skygger (`box-shadow: none`), ingen kanter på kort.

## Ikonflisen

Rund, 52 px, `background: rgba(250,251,252,0.1)`, `border: 1px solid rgba(250,251,252,0.1)`,
ikonet 30 px i tekstfargen — ikke tonet. På de store flisene henger den 10 px ut over
øvre venstre hjørne (`translate: -10px -10px`).

## Typografi

| Element | Størrelse | Vekt | Opasitet |
|---|---|---|---|
| Stort tall (verdien) | `2em` (30 px) | 300 | 1 |
| Navn / undertekst | 14 px | 500 | 0.7 |
| Alt-tekst til høyre | 14 px | 500 | 0.7 |
| Små fliser: verdi | 16 px | 500 | 1 |
| Overskrifter i popup | 30 px | 500 | 1 |

Tabular-nums på tall. Halvfet (600+) brukes ikke; det tunge er 500, det store er 300.

## Fylte tilstander

En flis som er «på» blir fylt med `--active-big` og får `--black` som tekst- og ikonfarge.
Utilgjengelig: ingen bakgrunn, `1px dashed var(--gray400)`, ikon i `--gray600` med 0.6 i opasitet.

## Interaksjon

- Trykk = handling (toggle), langt trykk = mer-info. Begge med haptikk (`haptic`-event + vibrate).
- Trykk på en verdi åpner entiteten bak den.
- Grafer skal kunne leses med fingeren: dra over gir verdien og tidspunktet.
- Fanerader: `ki-tabs-card`-formen — tynn ring, piller, glidende pille.
