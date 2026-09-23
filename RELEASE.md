# ki-cards 5.54.0

## ki-vanning-card 3.12.0: ingen kuttet tekst i flisene, og haptikk

**Neste og siste kjøring ble kuttet.** Står de to flisene ved siden av hverandre på en mobil, er hver
rundt 160 px bred, og «tir. 23. sep kl. 06:00» fikk ikke plass på én linje — verdien ble klippet med
ellipse. Nå får verdien gå over to linjer, og dagen og klokka står i hvert sitt spenn som ikke brekker
inni seg. Linja deler seg derfor alltid mellom dem:

    Neste kjøring          Siste kjøring
    tir. 23. sep           i går
    kl. 06:00              kl. 18:00

Er det plass, står alt på én linje som før.

**Haptikk** — et lite dunk når du:

- bytter fane (bare når du faktisk bytter, ikke ved trykk på fanen du står i)
- trykker på en sone for å folde varighetene ut eller inn
- velger en varighet, stopper, slår noe av eller på, eller trykker en knapp — de hadde
  `navigator.vibrate` fra før, men det finnes ikke i Safari, så på iPhone kjentes ingenting

Alt går nå gjennom samme hjelper, som sender `haptic`-eventet Home Assistant-appen lytter på (iOS og
Android) pluss `navigator.vibrate` for en nettleser på Android.

### Kontrollert

Begge byggesjekkene kjørt: 111 kort leser styles, 61 kort bygges med hass. Kortet er i tillegg tegnet
med samme OpenSprinkler-oppsett som i 5.53.0: flisverdiene har dag og klokke i hvert sitt spenn
(«i dag» / «kl. 21:00»), og haptikk-eventene kommer som de skal — `selection` ved fanebytte og ved
trykk på en sone, `light` når du velger en varighet. Ingen `navigator.vibrate`-kall står igjen utenfor
hjelperen.
