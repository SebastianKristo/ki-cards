# ki-cards 3.34.0

## `ki-ruter-card` 4.3.0

**Gløden er av.** Jeg leste «gjern gløden øverst» som «gjerne» og gjorde den sterkere —
det skulle vært «fjern». Den er nå av som standard. `bakgrunn_glod: true` slår den på.

**Bare én avgang ble vist.** Kortet leste avganger fra `route` / `due_at` og de nummererte
`route_1` til `route_12`. Mange Entur- og kollektivsensorer legger i stedet hele lista i én
attributt — `departures`, `next_departures`, `calls` — og da så kortet bare den første
avgangen, uansett hvor høyt `maks` sto.

Slike lister leses nå også, med feltnavnene som er vanlige på tvers av integrasjonene
(`line`/`route`, `destination`/`front_text`, `expected_departure_time`/`due_at`, `delay`,
`realtime`, `platform`). Heter attributten noe annet hos deg:
`avganger_attributt: mitt_feltnavn`, enten på kortet eller per holdeplass.

**«Invalid Date».** Den overstrekede planlagte tiden ble regnet som
`new Date(new Date("14:53"))`, og et klokkeslett uten dato gir Invalid Date. Den regnes nå
fra minutter til avgang, som allerede tåler begge formater.

**Velgeren hoppet til start.** Ved hvert bytte ble hele innholdet tegnet om, og
rullestillingen i pillerada nullstilt — med mange holdeplasser forsvant den valgte ut av
syne. Posisjonen beholdes nå, og den valgte pilla rulles til midten.

**Rekkefølge i editoren.** Under skjemaet ligger nå en liste over reisene og
holdeplassene med opp- og nedknapper. Rekkefølgen der er den samme som pillene får.
Hvilke holdeplasser som er med, settes fortsatt i YAML.

Editoren har også fått brytere for animert topp og farget skjær, og standardverdien for
avganger er rettet til 8 så den stemmer med kortet.
