# ki-cards 3.98.0

## `ki-basseng-card` 1.8.0: leter bredere etter LitElement, og sier fra når den ikke finnes

`ki-basseng-card` er **det eneste kortet i bundelen** som er bygget på LitElement. Alle
de andre er vanlige `HTMLElement`. Det er derfor bare dette svikter med «Custom element
doesn't exist».

Kortet henter LitElement ved å ta prototypen til et Home Assistant-element og lese `html`
og `css` fra den. Det virker bare så lenge frontend faktisk legger dem der.

Denne versjonen:

* **Leter i åtte elementer** i stedet for fire, og går oppover arvekjeden til den finner
  et ledd med både `html` og `css`. Tåler mellomledd uten å vite hva de heter.
* **Sier fra i konsollen** når den ikke finner dem, i stedet for å kaste stille fra en
  `.then()` der bundelens try/catch ikke rekker.

Seks frontend-former er kontrollert: direkte arv, ett og to mellomledd, bare `ha-card`
tilgjengelig, ingen med `html`/`css`, og ingen HA-elementer i det hele tatt. De fire
første registrerer kortet; de to siste sier hvorfor de ikke gjør det.

### Hva jeg IKKE har løst

Står det `ki-basseng-card: fant ikke LitElement i frontend` i konsollen etter denne
oppdateringen, er konklusjonen at Home Assistant ikke lenger legger `html` og `css` på
LitElement-prototypen. Da er det ingenting å lete bredere etter, og kortet må bygges om
til vanlig `HTMLElement` som resten av bundelen.

Det er en reell omskriving av rundt 2200 linjer, ikke en lapp. Den bør gjøres som eget
arbeid.

En teori jeg forkastet underveis: at et mixin-ledd i arvekjeden var årsaken. Testet, og
den gamle koden håndterte det fint — `html` arves gjennom kjeden uansett.
