# ki-cards 5.30.0

## Fanerada er den samme som i lanseringskortet

Rada over strømregningen er nå bygget som fanerada i `ki-lansering-card`, tegn for tegn: ingen
fylt bakgrunn, bare en tynn ring rundt, rada like bred som fanene den inneholder, og hele greia
midtstilt over kortet.

- `.skinne` er `inline-flex` med `padding:2px` og `border:1px solid rgba(255,255,255,.3)`
- fanene er 13 px, `padding:6px 14px`, dempet hvit tekst
- den valgte er fylt med `--active-big` og mørk tekst, med samme skygge som i lanseringskortet

**Kalenderknappen er nå en fane som de andre** — den bærer bare et ikon i stedet for tekst. Det
er det som gjør at glidepilla kan gli bort til den, i stedet for at markeringen hopper. Står
kalenderen åpen, er det kalenderfanen som er merket; lukker du den, går pilla tilbake til
perioden du sto i.

Fargen beholder reserven fra 5.29.0: `var(--active-big, #ee95ff)`, både på pilla og på den valgte
fanen, så markeringen ser lik ut enten basen er der eller ikke.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 60 kort bygges med hass. Rota i kortet er
`style` + `.faner` + `.k` — rada ligger altså fortsatt utenfor kortflaten. Fem faner i rada, alltid
nøyaktig én merket, kalenderfanen merket når kalenderen er åpen, og alle fire periodene tegnet med
oppdiktede tall uten `NaN`.

Inneholder også 5.26.0 til 5.29.0. Ingen andre kort er rørt.
