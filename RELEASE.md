# ki-cards 8.95.0

Bygget oppå 8.94.1 fra GitHub.

## ki-veggpanel-card 1.11.0: nattmodus med en gang, åpne dører om natta, og GUI-editor

**Nattmodus svarer med en gang.** Et trykk på Nattmodus-flisen ventet til bryteren (en logikk i Homey) hadde svart
og Home Assistant hadde sendt tilstanden tilbake — ofte flere sekunder — før flisen ble fylt og nattkortet kom.
Nå fylles flisen, nattkortet kommer og Nattmodus-pillen står i toppen i samme øyeblikk som du trykker. Svarer
ikke bryteren innen seks sekunder, går panelet tilbake til det bryteren faktisk sier. Det samme gjelder **Slå av**
på nattkortet, og alle scener med `aktiv:` som veksler en bryter.

**Det som står åpent, vises først.** `natt.sjekk:` er en liste med dører, vinduer og låser som skal være lukket om
natta. Står noe av dem åpent når nattmodus slås på, ligger det øverst i nattkortet — i rødt, med en svak puls:
«Verandadøra står åpen», «Dørlås er ulåst».

**GUI-editor.** Hele veggpanelet kan nå settes opp i Home Assistants egen redigerer, i sammenleggbare seksjoner:
Generelt, Toppstripe, Klokke, Sidemeny, Scener, Varme, Lys, Gardiner og markise, Nattmodus, Nytt i Plex og Strøm.
Lister — menypunkter, scener, soner, lamper, dekker, nattens sjekk og knapper — redigeres med legg til / flytt /
fjern. De innebygde kortene (prosa, familie, media, buss) har mange egne felt og redigeres som YAML i sin seksjon.
Tomme felt fjernes, så YAML-en holder seg ryddig.

**For andre installasjoner.** Kortet har ikke lenger dine entiteter som standard. Det som ikke er satt opp, vises
ikke — **tøm støvsugerfeltet, så er støvsugeren borte fra toppen**. Været finner seg selv (første `weather.*`).
Holdet på klokka slår kioskmodus bare når `input_boolean.kiosk_mode` finnes. Ditt oppsett har alt satt eksplisitt
og ser likt ut som før.

### Kontrollert

Begge byggesjekkene kjørt (64 kort). Veggpanelet er kjørt med nattmodus av: et trykk på flisen gir nattkortet,
fylt flis og Nattmodus-pillen før bryteren har svart, og kaller `homeassistant.toggle`; med verandadøra åpen står
«Verandadøra står åpen» i rødt øverst, og en lukket inngangsdør vises ikke. Været finnes uten oppsett. Editoren er
registrert med tolv seksjoner; `strom: false` vises som «Vis strømkortet» av og lagres tilbake som `strom: false`;
et tømt støvsugerfelt fjernes fra YAML-en.
