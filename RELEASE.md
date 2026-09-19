# ki-cards 4.14.0

## `ki-post-card` 3.1.0: pakker fra Norwegian Parcel Tracker, funnet selv

Postkortet viser nå pakkene under leveringsraden. Ingenting listes opp i YAML-en —
kortet finner `_status`-sensorene gjennom entitetsregisteret, filtrert på plattformen
`norwegian_parcel_tracker`.

Det måtte være automatisk: pakker kommer og går, og en liste man må vedlikeholde ville
vært utdatert før den var skrevet.

### Rekkefølgen er den du vil handle på

Klar for henting først, så fastlåste, så resten. **En pakke som venter på deg er det
eneste som haster** — resten er bare informasjon.

Klar-pakker får grønn sirkel med hentestedet som undertekst. Fastlåste — der
integrasjonen har satt `stale` — får oransje og siste hendelse. Leverte skjules, med
`pakker_leverte: true` for å ta dem med dempet.

Datoen til høyre er lesbar: «i dag», «i morgen», ukedag innen en uke, ellers «14. okt».

Trykk på en pakke åpner den, der hele hendelsesloggen ligger som attributter.

`pakker: false` skrur det av.

## `ki-bursdag-pro-card` 3.1.0: én oppføring i stedet for ti

Skjemaet lagde **én kalenderhendelse per år**, opptil tretti. Det var rotete å rette i,
og det gikk tomt etter ti år uten at noen fikk beskjed.

Nå lages én hendelse med `rrule: FREQ=YEARLY`. Den går aldri ut.

Støtter ikke kalenderen gjentakelse, faller kortet tilbake til kopier og sier fra i
skjemaet — bedre enn å feile stille og ikke lagre noe.

### Enklere å fylle ut

* **Navn foreslås fra husets `person`-entiteter.** Det er også den vanligste feilkilden:
  «Cybele» og «cybele» blir to oppføringer i kalenderen.
* **Dag og måned skrives for seg,** som «12.04». En `type="date"` krever at man blar til
  1985 i en månedsvelger, og det er tungt på mobil. Tolkningen tar «12.04», «12/4»,
  «1204» og «12.4.», og avviser 31. februar.
* **Fødselsåret er valgfritt.** Uten det lages bursdagen uten alder, i stedet for at
  skjemaet nekter.
* Første forekomst legges i år hvis datoen ikke er passert, ellers neste år — ellers
  dukket bursdagen opp som «passert» med en gang.
* Feil vises i skjemaet i stedet for at knappen ikke gjør noe.

## `ki-tabs-card`: rene ikonfaner (var 4.13.1)

En fane uten `title:` blir rund og kompakt i stedet for like bred som en med tekst, og
får `aria-label` fra `aria:` eller ikonnavnet.

## `ki-homelab-card`: søkefelt (var 4.13.0)

I `_liste`, så det virker likt i alle fire visningene. Treffer navn og undertittel, vises
fra åtte rader.
