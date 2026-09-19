# ki-cards 5.0.0

## Fire kort er fjernet

`ki-klima-card`, `ki-energi-card`, `ki-stromregning-card` og `ki-vaer-card` er tatt ut av
bundelen, sammen med README-radene, eksempelavsnittet for værkortet og merkefilene deres.

Hovedversjonen er hevet til 5.0.0 fordi dette er en endring som **fjerner noe**: har du
et av dem i et dashbord, slutter det å virke etter oppdateringen.

### Kontrollert før sletting

`ki-energi-card` var nevnt i fem andre filer, så jeg sjekket hver av dem før jeg rørte
noe. Alle fem var kommentarer om designspråket — «i samme stil som ki-energi-card» — og
ikke ekte avhengigheter. Ingen kode brøt.

`ki-energi-card-strom` er et annet kort og er beholdt, med sin merkefil og README-rad.

Bundelen er nå 52 kort, ned fra 55, og 156 kB mindre.

## Nytt kort: `ki-tesla-card` (var 4.37.0)

Animert Tesla Model Y sett fra siden: batteriet i dørterskelen fylles til batterinivået
med markør for ladegrensen, energi strømmer gjennom kabelen ved lading, frunk og
bagasjerom åpnes i tegningen, defrost gir varmebølger, sentry blinker og hjulene ruller
når bilen kjører.

Standardentitetene peker på Tesla-entitetene dine, og frunk, sentry, klima, innetemperatur,
gir og fart finnes automatisk fra prefiksene `folkevogn` og `tesla_model_y`.

Kortet fikk også et merkeikon og en README-rad, som de andre.
