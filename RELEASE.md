# ki-cards 5.4.0

## `ki-tesla-card` oppdatert

Ny versjon med mer detaljert ladescene, vei og skygge under bilen, og rullende hjul.
Nye tilstander `port-apen` (ladeporten) og `kjorer`. Ladestatus, ladeport og fart har
fått egne felt i editoren.

### Låsrettelsen fra 5.2.0 måtte bæres over

Den nye fila var bygget videre på en eldre gren og hadde `lock.folkevogn_lock` med
`state === "unlocked"` igjen. Hadde jeg lagt den inn rått, ville bilen alltid vist seg
som låst — sjekken slår aldri til for en `on`/`off`-bryter.

`switch.tesla_model_y_car_doors_locked` og `laas_omvendt` er derfor lagt inn på nytt,
sammen med editorfeltene.

Kontrollert etterpå: `on` gir åpen, `off` gir låst, en ekte `lock.`-entitet virker, og
`laas_omvendt: false` snur tolkningen.

## Nytt kort: `ki-strom-card` (var 5.3.0)

Animert hus koblet til en strømmast: strømmen renner fortere jo mer huset trekker,
ledningene farges etter spotprisen, vinduene lyser med forbruket, og huset blinker
oransje når du nærmer deg neste effekttrinn. Nederst ligger dagens spotpris time for
time med Norgespris som stiplet linje.

Mangler `raw_today` på spotprissensoren, droppes pristimene og resten tegnes som før —
grafen krever attributtet, ikke bare tilstanden.

Kortet fikk merkeikon og README-rad. Bundelen er nå 53 kort.
