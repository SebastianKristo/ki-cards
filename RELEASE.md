# ki-cards 3.89.0

## Containere som kjørte ble vist som nede i rødt

`ki-rack-card` sammenlignet tilstanden ordrett mot `"running"`, og oppdagelsen låste
`status_pa` til nettopp den verdien. Proxmox Extended Sensors oppgir «running» for noen
containere og «online», «on» eller «Running» for andre — og alt som ikke var akkurat
`running` ble rødt.

Sammenligningen er nå uten hensyn til store og små bokstaver, og standardlista dekker
`running`, `online`, `on`, `started`, `active`, `up` og `ok`. Oppdagelsen setter ikke
lenger `status_pa` i det hele tatt, så standardlista gjelder.

**Og en tilstand vi ikke kjenner igjen** — verken en «på»- eller en kjent «av»-verdi —
vises nå som uten svar, ikke som nede. Et falskt rødt kort er verre enn et spørsmålstegn.
Testet mot fjorten skrivemåter.

## Unraid-fanen: fliser som navigasjon

Fanen hadde fem seksjoner under hverandre og var den siste som krevde rulling. Nå er den
fem fliser: **Array, Containere, Disker, Delinger, Virtuelle maskiner**. Hver flis viser
det ene tallet som sier om delen har det bra, og åpner sin egen del over rutenettet.

Fanen er fra atten kort til fem.

`kort:` er nytt i `ki-rack-card`: en flis kan åpne en vilkårlig liste kort, ikke bare en
enhet. Det er dette som gjør flisene brukbare som navigasjon.

### To feil det avdekket

**Innebygde Home Assistant-kort kunne ikke lages.** `grid`, `conditional` og `entities`
heter noe annet internt, og `document.createElement("grid")` gir ingenting. VM-flisen
åpnet derfor en tom seksjon. Egendefinerte kort lages direkte, resten gjennom
`loadCardHelpers()`, som er måten HA gjør det selv.

**Disker-flisen viste «off paritet».** En rå tilstand som undertekst sier ingenting.
Paritetshelsen er nå flisens *status* — «off» betyr frisk i Unraid — og underteksten viser
hvor mye av array-en som er brukt.

Fliser uten statusentitet er ren navigasjon, og får en pil i stedet for en farget prikk.
