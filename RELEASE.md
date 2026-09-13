# ki-cards 3.35.0

## `ki-ruter-card` 4.4.0: nå kommer alle avgangene

Entur-integrasjonen i Home Assistant legger **to** avganger på hver sensor:

```
route: 5 Ringen via Storo   due_at: 15:15   real_time: true   delay: 0
next_route: 25 Haugerud     next_due_at: 15:18   next_due_in: 2 min
```

Kortet leste bare den første, og lette ellers etter `route_1` til `route_12` og en
`departures`-liste — ingen av delene finnes i disse sensorene. Derfor sto det én avgang
uansett hvor høyt `maks` var satt, og derfor hjalp ikke listestøtten i forrige versjon.

`next_route`-paret leses nå. Minuttene tas fra sensorens egen tilstand for den første og
fra `next_due_in` for den andre, i stedet for å regnes ut fra et klokkeslett uten dato.

**Plattform-sensorene slås sammen.** To avganger per sensor er fortsatt lite, men
Entur lager også en sensor per plattform — `..._platform_a`, `..._platform_b` og så
videre. De plukkes nå opp automatisk og slås sammen til én holdeplass, sortert etter
avgangstid, med plattformbokstaven på hver rad. Majorstuen går dermed fra én avgang til
et par dusin å velge blant.

Dubletter lukes bort: samme linje, mål og minutt fra to sensorer blir én rad.

Slås av med `plattformer: false`, enten på kortet eller per holdeplass. Vil du styre det
selv i stedet, list entitetene: `entities: [sensor.a, sensor.b]`.

**Toppraden er borte.** Ikonet, tittelen og «oppdatert 15:14» er av som standard —
popupen har sin egen overskrift. `vis_topp: true` gir den tilbake.
