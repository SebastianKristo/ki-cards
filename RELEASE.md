# ki-cards 3.47.0

## Loggen i `ki-sikkerhet-card` viste bare én opplåsning

Historikk-API-et i Home Assistant har `significant_changes_only` slått på som standard.
Endringer som bare rører attributtene regnes ikke som betydelige — og ansiktssensoren står
på samme navn mens det er `bekreftet_tid` som flytter seg. Låste Rune opp i går og
Sebastian i dag, så API-et to endringer; låste Rune opp tre ganger, så det én.

Ansiktssensoren hentes nå med `significant_changes_only=0`. Da kommer hver opplåsning med,
også flere på rad av samme person.

Dublettfiltreringen er samtidig strammet: den gikk på tidspunktet alene, så to personer med
samme `bekreftet_tid` slo hverandre ut. Nå er nøkkelen navn og tidspunkt sammen.

## Dørlåsen manglet

Samme innstilling gjaldt alarm- og låsespørringen: raske låst/ulåst-vekslinger kunne
forsvinne. Den ber nå også om alt.

Er entiteten helt fraværende fra svaret, sier loggen det rett ut: «Ingen historikk for
lock.dorlas_blatann. Sjekk at entiteten ikke er utelatt fra recorder.» Det er den
vanligste årsaken når en enkelt entitet mangler mens resten er der — en `exclude` i
recorder-oppsettet, eller at `purge_keep_days` er kortere enn perioden loggen ber om.
